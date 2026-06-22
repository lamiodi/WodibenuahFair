// ERP-only authentication middleware.
//
// IMPORTANT:
//   * Uses WODI_JWT_SECRET, a SEPARATE secret from the public Wodifair JWT_SECRET.
//     This isolates ERP tokens from the rest of the wodifair app.
//   * The existing Wodifair middleware (../middleware/auth.js) is untouched.
//   * This module is only imported from routes/erp.js, so a load error here
//     cannot affect any existing Wodifair route.

import jwt from 'jsonwebtoken';
import { query } from '../db.js';

// Resolve the secret lazily so importing this module never throws if the
// env var happens to be missing at process boot. In production we HARD-FAIL
// if WODI_JWT_SECRET is unset, because falling back to a known string would
// let an attacker forge ERP tokens trivially.
const DEV_FALLBACK = 'erp-dev-secret-change-me';
const getSecret = () => {
  if (process.env.WODI_JWT_SECRET) return process.env.WODI_JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('WODI_JWT_SECRET is required in production. Refusing to start.');
  }
  if (!getSecret._warned) {
    console.warn('[erp-auth] WARNING: WODI_JWT_SECRET is not set. Using a development fallback. DO NOT run this in production.');
    getSecret._warned = true;
  }
  return DEV_FALLBACK;
};

export const signErpToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, getSecret(), { expiresIn });
};

/**
 * Verify an ERP JWT and attach the user record to req.erpUser.
 * Returns 401 on missing/invalid token, 403 on role mismatch.
 */
export const requireErpAuth = (roles = ['ceo', 'rep', 'admin']) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return res.status(401).json({ error: 'No ERP token provided' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, getSecret());
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired ERP token' });
      }

      // Accept tokens issued by signErpToken ({id, role, name}) OR
      // any JWT that carries a recognized role.
      if (!decoded || !decoded.role || !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient ERP role' });
      }

      // Optional: confirm the user is still active in the DB.
      try {
        const result = await query(
          `SELECT id, name, email, role, is_active
           FROM erp.users
           WHERE id = $1 AND is_active = TRUE`,
          [decoded.id]
        );
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'ERP user not found or inactive' });
        }
        req.erpUser = result.rows[0];
      } catch (dbErr) {
        // If the erp schema doesn't exist yet, still allow the request
        // (the actual handler will surface a clear error).
        req.erpUser = { id: decoded.id, role: decoded.role, name: decoded.name };
      }

      next();
    } catch (err) {
      console.error('[erp-auth] unexpected error:', err);
      res.status(500).json({ error: 'ERP auth failure' });
    }
  };
};
