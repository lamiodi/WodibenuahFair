// ===========================================================================
// ERP API routes  (mounted at /api/erp in server.js)
//
// This module is intentionally self-contained and DEFENSIVE:
//   * It never mutates any existing Wodifair table or route.
//   * Every public export is wrapped so a single failing handler returns
//     a JSON 500 rather than crashing the live process.
//   * Sync endpoint supports idempotency_key for offline-first / Dexie.
//   * Cloudinary upload uses folder "erp/".
//
// Existing Wodifair routes (/api/auth, /api/vendors, /api/events, etc.)
// are NOT modified by this file.
// ===========================================================================

import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import pool from '../db.js';
import { requireErpAuth, signErpToken } from '../middleware/erpAuth.js';

const router = express.Router();

// -- safe wrapper: turns thrown errors into JSON responses, never crashes --
const safe = (fn) => async (req, res, next) => {
  try { return await fn(req, res, next); }
  catch (err) {
    console.error('[erp]', req.method, req.originalUrl, '->', err.message);
    res.status(500).json({ error: 'ERP internal error', detail: err.message });
  }
};

// -- strict limiter on auth: 10 attempts / 5 min / IP, blocks brute force --
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Try again in a few minutes.' },
});

// -- common-sense PIN blocklist: reject trivially guessable PINs --
const WEAK_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '4321', '5678', '8765', '1212', '6969', '0001', '9999', '0852', '1010',
  '1122', '1313', '1414', '1515', '2020', '2580', '7777', '8888', '9999',
]);
const isPinAcceptable = (pin) => {
  if (!/^\d{4,8}$/.test(String(pin))) return false;
  if (WEAK_PINS.has(String(pin))) return false;
  return true;
};

// -- security event audit log helper (best-effort, never throws) --
const logSecurityEvent = async (event, req, { user, detail } = {}) => {
  try {
    await pool.query(
      `INSERT INTO erp.security_events
         (event, user_id, user_email, user_name, ip, user_agent, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        event,
        user?.id || null,
        user?.email || null,
        user?.name || null,
        req?.ip || null,
        req?.headers?.['user-agent'] || null,
        detail || null,
      ]
    );
  } catch (e) { /* never block the response on audit failures */ }
};

// ===========================================================================
// Cloudinary  (folder: /erp)  — using SDK directly to avoid extra deps
// ===========================================================================
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (e) { /* will surface on first upload attempt */ }

// ===========================================================================
// HEALTH  (public)
// ===========================================================================
router.get('/health', safe(async (req, res) => {
  const r = await pool.query('SELECT 1 AS ok');
  res.json({ status: 'ok', service: 'erp', db: r.rows[0].ok === 1 });
}));

// ===========================================================================
// AUTH
// ===========================================================================

// POST /api/erp/auth/login   { email, password }  -> CEO / admin
// POST /api/erp/auth/login   { name, pin }        -> Rep (PIN is bcrypt-hashed)
router.post('/auth/login', authLimiter, safe(async (req, res) => {
  const { email, password, name, pin } = req.body || {};

  let user = null;
  if (email && password) {
    const r = await pool.query(
      `SELECT * FROM erp.users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE AND password_hash IS NOT NULL`,
      [email]
    );
    if (r.rows.length > 0) {
      const ok = await bcrypt.compare(password, r.rows[0].password_hash);
      if (ok) user = r.rows[0];
      else await logSecurityEvent('login_fail', req, { user: r.rows[0], detail: 'bad password' });
    } else {
      await logSecurityEvent('login_fail', req, { detail: `unknown email ${email}` });
    }
  } else if (name && pin) {
    const r = await pool.query(
      `SELECT * FROM erp.users WHERE LOWER(name) = LOWER($1) AND is_active = TRUE AND pin_hash IS NOT NULL`,
      [name]
    );
    if (r.rows.length > 0) {
      const ok = await bcrypt.compare(String(pin), r.rows[0].pin_hash);
      if (ok) user = r.rows[0];
      else await logSecurityEvent('login_fail', req, { user: r.rows[0], detail: 'bad pin' });
    } else {
      await logSecurityEvent('login_fail', req, { detail: `unknown rep name ${name}` });
    }
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signErpToken({ id: user.id, role: user.role, name: user.name });
  await logSecurityEvent('login_success', req, { user });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    mustChangePassword: !!user.must_change_password,
  });
}));

router.get('/auth/me', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  res.json({ user: req.erpUser });
}));

// ===========================================================================
// AUTH — password / PIN management
//   POST /api/erp/auth/change-password   { currentPassword | currentPin, newPassword | newPin }
//   POST /api/erp/auth/forgot-password   { email | name }   -> { resetToken } (dev) or { ok: true } (prod, emailed)
//   POST /api/erp/auth/reset-password    { resetToken, newPassword | newPin }
//   POST /api/erp/auth/admin-reset       { adminSecret, userId, newPassword?, newPin? }
//
// Tokens are random 32 bytes, returned to the caller ONCE, stored as
// SHA-256 hashes, expire in 1 hour, single-use.
// ===========================================================================

// ---- change own password / PIN ----
router.post('/auth/change-password', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const { currentPassword, currentPin, newPassword, newPin } = req.body || {};
  if (!newPassword && !newPin) {
    return res.status(400).json({ error: 'newPassword or newPin is required' });
  }

  const r = await pool.query(`SELECT * FROM erp.users WHERE id = $1`, [req.erpUser.id]);
  if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const u = r.rows[0];

  if (u.role === 'ceo' || u.role === 'admin') {
    if (!currentPassword) return res.status(400).json({ error: 'currentPassword is required' });
    const ok = await bcrypt.compare(currentPassword, u.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'newPassword must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE erp.users SET password_hash = $1, must_change_password = FALSE,
       last_password_change_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [hash, u.id]
    );
    await logSecurityEvent('password_change', req, { user: u });
  } else if (u.role === 'rep') {
    if (!currentPin) return res.status(400).json({ error: 'currentPin is required' });
    const ok = await bcrypt.compare(String(currentPin), u.pin_hash || '');
    if (!ok) return res.status(401).json({ error: 'Current PIN is incorrect' });
    if (!isPinAcceptable(newPin)) {
      return res.status(400).json({ error: 'newPin must be 4-8 digits and not a trivial sequence' });
    }
    const pinHash = await bcrypt.hash(String(newPin), 10);
    await pool.query(
      `UPDATE erp.users SET pin_hash = $1, must_change_password = FALSE,
       last_password_change_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [pinHash, u.id]
    );
    await logSecurityEvent('pin_change', req, { user: u });
  } else {
    return res.status(403).json({ error: 'Unsupported role' });
  }

  res.json({ ok: true });
}));

// ---- forgot password (CEO) or forgot PIN (rep) ----
router.post('/auth/forgot-password', authLimiter, safe(async (req, res) => {
  const { email, name } = req.body || {};
  if (!email && !name) return res.status(400).json({ error: 'email or name is required' });

  const lookup = email
    ? await pool.query(`SELECT id, email, role FROM erp.users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE`, [email])
    : await pool.query(`SELECT id, email, role FROM erp.users WHERE LOWER(name) = LOWER($1) AND is_active = TRUE`, [name]);

  // Always respond with a generic OK to avoid user enumeration.
  if (lookup.rows.length === 0) {
    return res.json({ ok: true, message: 'If the account exists, a reset link has been issued.' });
  }
  const u = lookup.rows[0];

  // 32-byte token, returned ONCE to the caller (and ideally emailed in prod).
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    `INSERT INTO erp.password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [u.id, tokenHash, expiresAt]
  );

  // In production, also email the link via Resend (already a dep of Wodifair backend).
  // We log instead of throwing if email fails — the API response still surfaces the
  // token so a dev can complete the reset flow without SMTP.
  if (process.env.RESEND_API_KEY && u.email) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${process.env.ERP_PUBLIC_URL || 'https://your-erp-host'}/reset?token=${rawToken}`;
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@wodifair.local',
        to: u.email,
        subject: 'Reset your ERP password',
        html: `<p>Click below to reset your ERP password. The link expires in 1 hour.</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>If you didn't request this, you can ignore this email.</p>`,
      });
    } catch (e) {
      console.error('[erp-forgot] email send failed (non-fatal):', e.message);
    }
  }

  // Production: NEVER return the raw token. Email is the only path.
  // Dev/test: surface the token so the frontend can complete the flow
  // without an SMTP server.
  const inDev = process.env.NODE_ENV !== 'production';

  await logSecurityEvent('reset_request', req, { user: u });

  res.json({
    ok: true,
    ...(inDev && { resetToken: rawToken }),
    expiresAt,
  });
}));

// ---- redeem a reset token ----
router.post('/auth/reset-password', safe(async (req, res) => {
  const { resetToken, newPassword, newPin } = req.body || {};
  if (!resetToken) return res.status(400).json({ error: 'resetToken is required' });
  if (!newPassword && !newPin) return res.status(400).json({ error: 'newPassword or newPin is required' });

  const tokenHash = crypto.createHash('sha256').update(String(resetToken)).digest('hex');
  const r = await pool.query(
    `SELECT t.id AS token_id, t.user_id, t.expires_at, t.used_at, u.role, u.name, u.email
     FROM erp.password_reset_tokens t
     JOIN erp.users u ON u.id = t.user_id
     WHERE t.token_hash = $1`,
    [tokenHash]
  );
  if (r.rows.length === 0) {
    await logSecurityEvent('token_redeem_fail', req, { detail: 'unknown token hash' });
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const row = r.rows[0];
  if (row.used_at) {
    await logSecurityEvent('token_redeem_fail', req, { user: row, detail: 'token already used' });
    return res.status(400).json({ error: 'Token already used' });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await logSecurityEvent('token_redeem_fail', req, { user: row, detail: 'token expired' });
    return res.status(400).json({ error: 'Token expired' });
  }

  if (row.role === 'ceo' || row.role === 'admin') {
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'newPassword must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE erp.users SET password_hash = $1, must_change_password = FALSE,
       last_password_change_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [hash, row.user_id]
    );
  } else if (row.role === 'rep') {
    if (!isPinAcceptable(newPin)) {
      return res.status(400).json({ error: 'newPin must be 4-8 digits and not a trivial sequence' });
    }
    const pinHash = await bcrypt.hash(String(newPin), 10);
    await pool.query(
      `UPDATE erp.users SET pin_hash = $1, must_change_password = FALSE,
       last_password_change_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [pinHash, row.user_id]
    );
  } else {
    return res.status(403).json({ error: 'Unsupported role' });
  }

  // mark token used
  await pool.query(`UPDATE erp.password_reset_tokens SET used_at = NOW() WHERE id = $1`, [row.token_id]);
  await logSecurityEvent('reset_complete', req, { user: row });

  res.json({ ok: true });
}));

// ---- admin-secret reset (no email needed; protected by ADMIN_SECRET) ----
router.post('/auth/admin-reset', safe(async (req, res) => {
  const { adminSecret, userId, newPassword, newPin } = req.body || {};
  if (!process.env.ADMIN_SECRET) {
    return res.status(503).json({ error: 'ADMIN_SECRET not configured on server' });
  }
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const u = await pool.query(`SELECT id, role FROM erp.users WHERE id = $1`, [userId]);
  if (u.rows.length === 0) return res.status(404).json({ error: 'User not found' });

  if (u.rows[0].role === 'ceo' || u.rows[0].role === 'admin') {
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'newPassword must be at least 8 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE erp.users SET password_hash = $1, must_change_password = FALSE,
       last_password_change_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [hash, userId]
    );
  } else if (u.rows[0].role === 'rep') {
    if (!isPinAcceptable(newPin)) {
      return res.status(400).json({ error: 'newPin must be 4-8 digits and not a trivial sequence' });
    }
    const pinHash = await bcrypt.hash(String(newPin), 10);
    await pool.query(
      `UPDATE erp.users SET pin_hash = $1, must_change_password = FALSE,
       last_password_change_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [pinHash, userId]
    );
  } else {
    return res.status(403).json({ error: 'Unsupported role' });
  }
  await logSecurityEvent('admin_reset', req, { detail: `reset target user_id=${userId}` });
  res.json({ ok: true });
}));

// ===========================================================================
// PRODUCTS
// ===========================================================================
router.get('/products', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const r = await pool.query(
    `SELECT * FROM erp.products ORDER BY name ASC`
  );
  // surface image_url in priority order
  const rows = r.rows.map(p => ({
    ...p,
    image: p.image_url || null,
  }));
  res.json(rows);
}));

router.post('/products', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const id = req.body.id || crypto.randomUUID();
  const { barcode, name, costPrice, sellingPrice, stockQuantity, reorderLevel, imageUrl, imageBase64, category, expiryDate } = req.body;
  const { imageUrl: finalImageUrl } = await resolveProductImage({ imageUrl, imageBase64 });
  const r = await pool.query(
    `INSERT INTO erp.products
       (id, barcode, name, cost_price, selling_price, stock_quantity, reorder_level, image_url, category, expiry_date, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW())
     ON CONFLICT (id) DO UPDATE SET
       barcode        = EXCLUDED.barcode,
       name           = EXCLUDED.name,
       cost_price     = EXCLUDED.cost_price,
       selling_price  = EXCLUDED.selling_price,
       stock_quantity = EXCLUDED.stock_quantity,
       reorder_level  = EXCLUDED.reorder_level,
       image_url      = EXCLUDED.image_url,
       category       = EXCLUDED.category,
       expiry_date    = EXCLUDED.expiry_date,
       updated_at     = NOW()
     RETURNING *`,
    [
      id, barcode, name,
      Number(costPrice) || 0,
      Number(sellingPrice) || 0,
      parseInt(stockQuantity, 10) || 0,
      parseInt(reorderLevel, 10) || 5,
      finalImageUrl,
      category || 'General',
      expiryDate || null,
    ]
  );
  res.status(201).json(r.rows[0]);
}));

router.put('/products/:id', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const { id } = req.params;
  const { barcode, name, costPrice, sellingPrice, stockQuantity, reorderLevel, imageUrl, imageBase64, category, expiryDate } = req.body;
  // Only resolve the image if the caller is actively trying to change it.
  let finalImageUrl = null;
  const wantsImage = imageUrl !== undefined || imageBase64 !== undefined;
  if (wantsImage) {
    const resolved = await resolveProductImage({ imageUrl, imageBase64 });
    finalImageUrl = resolved.imageUrl;
  }
  const r = await pool.query(
    `UPDATE erp.products SET
       barcode        = COALESCE($2, barcode),
       name           = COALESCE($3, name),
       cost_price     = COALESCE($4, cost_price),
       selling_price  = COALESCE($5, selling_price),
       stock_quantity = COALESCE($6, stock_quantity),
       reorder_level  = COALESCE($7, reorder_level),
       image_url      = CASE WHEN $8::boolean THEN $9 ELSE image_url END,
       category       = COALESCE($10, category),
       expiry_date    = COALESCE($11, expiry_date),
       updated_at     = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id, barcode || null, name || null,
      costPrice != null ? Number(costPrice) : null,
      sellingPrice != null ? Number(sellingPrice) : null,
      stockQuantity != null ? parseInt(stockQuantity, 10) : null,
      reorderLevel != null ? parseInt(reorderLevel, 10) : null,
      wantsImage,
      finalImageUrl,
      category || null,
      expiryDate || null,
    ]
  );
  if (r.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(r.rows[0]);
}));

router.delete('/products/:id', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM erp.products WHERE id = $1', [id]);
  res.json({ ok: true });
}));

// POST /api/erp/products/upload  body: { imageBase64: "data:image/png;base64,...." }
//   -> { url, public_id }
// Accepts either a data URL ("data:image/png;base64,...") or a raw base64 string.
router.post('/products/upload', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const { imageBase64 } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

  const dataUri = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'erp',
    resource_type: 'image',
  });
  res.json({ url: result.secure_url, public_id: result.public_id });
}));

// -- helper used by POST /products and PUT /products/:id --
// If the caller sent imageBase64, upload to Cloudinary and return a URL.
// If the caller sent imageUrl, return it as-is.
// Returns { imageUrl, imageBase64Consumed } (base64 is always consumed —
// we never store base64 server-side anymore).
const resolveProductImage = async ({ imageUrl, imageBase64 }) => {
  if (imageUrl && /^https?:\/\//.test(String(imageUrl))) {
    return { imageUrl, imageBase64Consumed: false };
  }
  if (imageBase64 && String(imageBase64).length > 0) {
    const dataUri = String(imageBase64).startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'erp',
      resource_type: 'image',
    });
    return { imageUrl: result.secure_url, imageBase64Consumed: true };
  }
  return { imageUrl: null, imageBase64Consumed: false };
};

// ===========================================================================
// CUSTOMERS
// ===========================================================================
router.get('/customers', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const r = await pool.query(`SELECT * FROM erp.customers ORDER BY total_spent DESC`);
  res.json(r.rows);
}));

router.post('/customers', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const id = req.body.id || crypto.randomUUID();
  const { name, phone, email, totalSpent, points, status } = req.body;
  const r = await pool.query(
    `INSERT INTO erp.customers (id, name, phone, email, total_spent, points, status, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7, NOW())
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       phone = EXCLUDED.phone,
       email = EXCLUDED.email,
       total_spent = EXCLUDED.total_spent,
       points = EXCLUDED.points,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING *`,
    [id, name, phone, email || null, Number(totalSpent) || 0, parseInt(points, 10) || 0, status || 'Regular']
  );
  res.status(201).json(r.rows[0]);
}));

// ===========================================================================
// SHIFTS
// ===========================================================================
router.get('/shifts', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const r = await pool.query(`SELECT * FROM erp.shifts ORDER BY opened_at DESC`);
  res.json(r.rows);
}));

router.post('/shifts', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const id = req.body.id || crypto.randomUUID();
  const { repName, openingCash, closingCash, expectedCash, salesCount, totalSales, totalExpenses, variance, openedAt, closedAt } = req.body;
  const r = await pool.query(
    `INSERT INTO erp.shifts
       (id, rep_name, opening_cash, closing_cash, expected_cash, sales_count, total_sales, total_expenses, variance, opened_at, closed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, NOW()), $11)
     ON CONFLICT (id) DO UPDATE SET
       closing_cash = EXCLUDED.closing_cash,
       expected_cash = EXCLUDED.expected_cash,
       sales_count = EXCLUDED.sales_count,
       total_sales = EXCLUDED.total_sales,
       total_expenses = EXCLUDED.total_expenses,
       variance = EXCLUDED.variance,
       closed_at = EXCLUDED.closed_at
     RETURNING *`,
    [
      id, repName,
      Number(openingCash) || 0,
      closingCash != null ? Number(closingCash) : null,
      expectedCash != null ? Number(expectedCash) : null,
      parseInt(salesCount, 10) || 0,
      Number(totalSales) || 0,
      Number(totalExpenses) || 0,
      variance != null ? Number(variance) : null,
      openedAt || null,
      closedAt || null,
    ]
  );
  res.status(201).json(r.rows[0]);
}));

// ===========================================================================
// SALES
// ===========================================================================
router.get('/sales', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const r = await pool.query(`SELECT * FROM erp.sales ORDER BY created_at DESC LIMIT 200`);
  res.json(r.rows);
}));

router.post('/sales', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const id = req.body.id || crypto.randomUUID();
  const { items, totalAmount, profitMade, paymentMethod, paymentRef, splitDetails, soldBy, shiftId, isHeld, isQuickSale, isRefund, originalSaleId, couponCode, customerId } = req.body;
  const r = await pool.query(
    `INSERT INTO erp.sales
       (id, items, total_amount, profit_made, payment_method, payment_ref, split_details, sold_by, shift_id,
        is_held, is_quick_sale, is_refund, original_sale_id, coupon_code, customer_id, synced)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, TRUE)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      id,
      JSON.stringify(items || []),
      Number(totalAmount) || 0,
      Number(profitMade) || 0,
      paymentMethod || 'Cash',
      paymentRef || null,
      splitDetails ? JSON.stringify(splitDetails) : null,
      soldBy,
      shiftId || null,
      !!isHeld,
      !!isQuickSale,
      !!isRefund,
      originalSaleId || null,
      couponCode || null,
      customerId || null,
    ]
  );
  res.status(201).json(r.rows[0] || { id, deduplicated: true });
}));

// ===========================================================================
// EXPENSES
// ===========================================================================
router.get('/expenses', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const r = await pool.query(`SELECT * FROM erp.expenses ORDER BY created_at DESC LIMIT 200`);
  res.json(r.rows);
}));

router.post('/expenses', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const id = req.body.id || crypto.randomUUID();
  const { amount, category, description, shiftId, loggedBy } = req.body;
  const r = await pool.query(
    `INSERT INTO erp.expenses (id, amount, category, description, shift_id, logged_by, synced)
     VALUES ($1,$2,$3,$4,$5,$6, TRUE)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [id, Number(amount) || 0, category, description || null, shiftId || null, loggedBy]
  );
  res.status(201).json(r.rows[0] || { id, deduplicated: true });
}));

// ===========================================================================
// AUDIT LOGS  (inventory adjustments + price changes)
// ===========================================================================
router.get('/audit-logs', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const r = await pool.query(`SELECT * FROM erp.audit_logs ORDER BY created_at DESC LIMIT 200`);
  res.json(r.rows);
}));

router.post('/audit-logs', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const id = req.body.id || crypto.randomUUID();
  const { action, entity, entityId, productId, type, quantity, oldValue, newValue, reason, details, performedBy } = req.body;
  const r = await pool.query(
    `INSERT INTO erp.audit_logs
       (id, action, entity, entity_id, product_id, type, quantity, old_value, new_value, reason, details, performed_by, synced)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, TRUE)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [
      id, action, entity, entityId || null, productId || null, type || null,
      quantity != null ? Number(quantity) : null,
      oldValue != null ? String(oldValue) : null,
      newValue != null ? String(newValue) : null,
      reason || null, details || null, performedBy
    ]
  );
  res.status(201).json(r.rows[0] || { id, deduplicated: true });
}));

// ===========================================================================
// SETTINGS  (key/value)
// ===========================================================================
router.get('/settings', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const r = await pool.query(`SELECT key, value FROM erp.settings`);
  const obj = {};
  r.rows.forEach(row => { obj[row.key] = row.value; });
  res.json(obj);
}));

router.put('/settings', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const entries = Object.entries(req.body || {});
  for (const [k, v] of entries) {
    await pool.query(
      `INSERT INTO erp.settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [k, String(v)]
    );
  }
  res.json({ ok: true, count: entries.length });
}));

// ===========================================================================
// SYNC  (offline-first / Dexie)
//
//  POST /api/erp/sync         { idempotency_key, action, entity, data }
//                             Applies a single queued mutation. Idempotent.
//  GET  /api/erp/sync/pull?lastSync=<ms>
//                             Returns everything updated after lastSync.
// ===========================================================================
router.post('/sync', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const { idempotency_key, action, entity, data } = req.body || {};
  if (!action || !entity) return res.status(400).json({ error: 'action and entity are required' });

  // 1) idempotency: same key replayed -> short-circuit OK
  if (idempotency_key) {
    const seen = await pool.query(
      `SELECT idempotency_key FROM erp.sync_log WHERE idempotency_key = $1`,
      [idempotency_key]
    );
    if (seen.rows.length > 0) {
      return res.json({ ok: true, deduplicated: true });
    }
  }

  // 2) apply the mutation
  let result = { ok: true };
  try {
    switch (entity) {
      case 'sale': {
        const id = data.id || crypto.randomUUID();
        // Race-safe: wrap insert + stock decrement in a single transaction
        // with row-level locks on every affected product.
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Lock every product row we'll touch, in a stable order (by id)
          // to avoid deadlocks if two sales race.
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            const productIds = [...new Set(
              data.items.map(i => i.productId).filter(Boolean)
            )].sort();
            for (const pid of productIds) {
              await client.query(
                `SELECT id FROM erp.products WHERE id = $1 FOR UPDATE`,
                [pid]
              );
            }
          }

          const r = await client.query(
            `INSERT INTO erp.sales
               (id, items, total_amount, profit_made, payment_method, payment_ref, split_details, sold_by, shift_id,
                is_held, is_quick_sale, is_refund, original_sale_id, customer_id, synced)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, TRUE)
             ON CONFLICT (id) DO NOTHING
             RETURNING id`,
            [
              id,
              typeof data.items === 'string' ? data.items : JSON.stringify(data.items || []),
              Number(data.totalAmount) || 0,
              Number(data.profitMade) || 0,
              data.paymentMethod || 'Cash',
              data.paymentRef || null,
              data.splitDetails ? (typeof data.splitDetails === 'string' ? data.splitDetails : JSON.stringify(data.splitDetails)) : null,
              data.soldBy,
              data.shiftId || null,
              !!data.isHeld,
              !!data.isQuickSale,
              !!data.isRefund,
              data.originalSaleId || null,
              data.customerId || null,
            ]
          );

          if (data.items && Array.isArray(data.items)) {
            for (const it of data.items) {
              if (it.productId) {
                await client.query(
                  `UPDATE erp.products
                   SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW()
                   WHERE id = $2`,
                  [Number(it.qty) || 0, it.productId]
                );
              }
            }
          }

          await client.query('COMMIT');
          result = { ok: true, id: r.rows[0]?.id || id };
        } catch (e) {
          await client.query('ROLLBACK').catch(() => {});
          throw e;
        } finally {
          client.release();
        }
        break;
      }
      case 'shift': {
        const id = data.id || crypto.randomUUID();
        await pool.query(
          `INSERT INTO erp.shifts
             (id, rep_name, opening_cash, closing_cash, expected_cash, sales_count, total_sales, total_expenses, variance, opened_at, closed_at, synced)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, NOW()), $11, TRUE)
           ON CONFLICT (id) DO UPDATE SET
             closing_cash = EXCLUDED.closing_cash,
             expected_cash = EXCLUDED.expected_cash,
             sales_count = EXCLUDED.sales_count,
             total_sales = EXCLUDED.total_sales,
             total_expenses = EXCLUDED.total_expenses,
             variance = EXCLUDED.variance,
             closed_at = EXCLUDED.closed_at`,
          [
            id, data.repName,
            Number(data.openingCash) || 0,
            data.closingCash != null ? Number(data.closingCash) : null,
            data.expectedCash != null ? Number(data.expectedCash) : null,
            parseInt(data.salesCount, 10) || 0,
            Number(data.totalSales) || 0,
            Number(data.totalExpenses) || 0,
            data.variance != null ? Number(data.variance) : null,
            data.openedAt || null,
            data.closedAt || null,
          ]
        );
        result = { ok: true, id };
        break;
      }
      case 'customer': {
        const id = data.id || crypto.randomUUID();
        await pool.query(
          `INSERT INTO erp.customers (id, name, phone, total_spent, points, status, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6, NOW())
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             total_spent = EXCLUDED.total_spent,
             points = EXCLUDED.points,
             status = EXCLUDED.status,
             updated_at = NOW()`,
          [id, data.name, data.phone, Number(data.totalSpent) || 0, parseInt(data.points, 10) || 0, data.status || 'Regular']
        );
        result = { ok: true, id };
        break;
      }
      case 'product': {
        const id = data.id || crypto.randomUUID();
        if (action === 'update_product' || action === 'create_product') {
          await pool.query(
            `INSERT INTO erp.products
               (id, barcode, name, cost_price, selling_price, stock_quantity, reorder_level, image_url, category, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               cost_price = EXCLUDED.cost_price,
               selling_price = EXCLUDED.selling_price,
               stock_quantity = EXCLUDED.stock_quantity,
               reorder_level = EXCLUDED.reorder_level,
               image_url = EXCLUDED.image_url,
               category = EXCLUDED.category,
               updated_at = NOW()`,
            [
              id, data.barcode, data.name,
              Number(data.costPrice) || 0,
              Number(data.sellingPrice) || 0,
              parseInt(data.stockQuantity, 10) || 0,
              parseInt(data.reorderLevel, 10) || 5,
              data.imageUrl || null,
              data.category || 'General',
            ]
          );
          result = { ok: true, id };
        }
        break;
      }
      case 'inventory_adjustment': {
        const id = data.id || crypto.randomUUID();
        const adjClient = await pool.connect();
        try {
          await adjClient.query('BEGIN');
          // Lock the product row first to serialize concurrent adjustments.
          await adjClient.query(
            `SELECT id FROM erp.products WHERE id = $1 FOR UPDATE`,
            [data.productId]
          );

          await adjClient.query(
            `INSERT INTO erp.audit_logs
               (id, action, entity, entity_id, product_id, type, quantity, reason, performed_by, synced)
             VALUES ($1,'INVENTORY_ADJUST','product',$2,$3,$4,$5,$6,$7, TRUE)
             ON CONFLICT (id) DO NOTHING`,
            [id, data.productId, data.productId, data.type, Number(data.quantity) || 0, data.reason || null, data.performedBy]
          );
          if (data.type === 'ADD') {
            await adjClient.query(
              `UPDATE erp.products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2`,
              [Number(data.quantity) || 0, data.productId]
            );
          } else if (data.type === 'REMOVE') {
            await adjClient.query(
              `UPDATE erp.products SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = NOW() WHERE id = $2`,
              [Number(data.quantity) || 0, data.productId]
            );
          } else if (data.type === 'SET') {
            await adjClient.query(
              `UPDATE erp.products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2`,
              [Number(data.quantity) || 0, data.productId]
            );
          }
          await adjClient.query('COMMIT');
        } catch (e) {
          await adjClient.query('ROLLBACK').catch(() => {});
          throw e;
        } finally {
          adjClient.release();
        }
        result = { ok: true, id };
        break;
      }
      case 'audit_log': {
        const id = data.id || crypto.randomUUID();
        await pool.query(
          `INSERT INTO erp.audit_logs
             (id, action, entity, entity_id, product_id, old_value, new_value, performed_by, synced)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, TRUE)
           ON CONFLICT (id) DO NOTHING`,
          [id, data.action, 'product', data.productId, data.productId,
           data.oldValue != null ? String(data.oldValue) : null,
           data.newValue != null ? String(data.newValue) : null,
           data.performedBy]
        );
        result = { ok: true, id };
        break;
      }
      case 'expense': {
        const id = data.id || crypto.randomUUID();
        await pool.query(
          `INSERT INTO erp.expenses (id, amount, category, description, shift_id, logged_by, synced)
           VALUES ($1,$2,$3,$4,$5,$6, TRUE)
           ON CONFLICT (id) DO NOTHING`,
          [id, Number(data.amount) || 0, data.category, data.description || null, data.shiftId || null, data.loggedBy]
        );
        result = { ok: true, id };
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }
  } catch (innerErr) {
    console.error('[erp-sync] apply failed:', innerErr);
    return res.status(500).json({ error: 'sync apply failed', detail: innerErr.message });
  }

  // 3) record idempotency key (best-effort, never blocks the response)
  if (idempotency_key) {
    try {
      await pool.query(
        `INSERT INTO erp.sync_log (idempotency_key, entity, action, entity_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [idempotency_key, entity, action, result.id || null]
      );
    } catch (e) { /* logging only */ }
  }

  res.json(result);
}));

router.get('/sync/pull', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  const lastSync = parseInt(req.query.lastSync, 10) || 0;
  const since = new Date(lastSync);

  const [products, customers, settings] = await Promise.all([
    pool.query(`SELECT * FROM erp.products WHERE updated_at > $1`, [since]),
    pool.query(`SELECT * FROM erp.customers WHERE updated_at > $1`, [since]),
    pool.query(`SELECT key, value FROM erp.settings`),
  ]);

  const settingsObj = {};
  settings.rows.forEach(r => { settingsObj[r.key] = r.value; });

  res.json({
    success: true,
    timestamp: Date.now(),
    data: {
      products: products.rows,
      customers: customers.rows,
      settings: settingsObj,
    },
  });
}));

// ===========================================================================
// BULK SEED  (handy for first-time ERP setup)
// ===========================================================================
router.post('/seed', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const { products = [], customers = [] } = req.body || {};
  let pCount = 0, cCount = 0;

  for (const p of products) {
    await pool.query(
      `INSERT INTO erp.products
         (id, barcode, name, cost_price, selling_price, stock_quantity, reorder_level, category, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
       ON CONFLICT (barcode) DO UPDATE SET
         name = EXCLUDED.name,
         cost_price = EXCLUDED.cost_price,
         selling_price = EXCLUDED.selling_price,
         stock_quantity = EXCLUDED.stock_quantity,
         reorder_level = EXCLUDED.reorder_level,
         category = EXCLUDED.category,
         updated_at = NOW()`,
      [
        p.id || crypto.randomUUID(),
        p.barcode, p.name,
        Number(p.costPrice) || 0,
        Number(p.sellingPrice) || 0,
        parseInt(p.stockQuantity, 10) || 0,
        parseInt(p.reorderLevel, 10) || 5,
        p.category || 'General',
      ]
    );
    pCount++;
  }

  for (const c of customers) {
    await pool.query(
      `INSERT INTO erp.customers (id, name, phone, total_spent, points, status, updated_at)
       VALUES ($1,$2,$3,0,0,'Regular', NOW())
       ON CONFLICT (phone) DO NOTHING`,
      [c.id || crypto.randomUUID(), c.name, c.phone]
    );
    cCount++;
  }

  res.json({ ok: true, products: pCount, customers: cCount });
}));

// ===========================================================================
// PAYSTACK  (POS card / transfer / split)
//
//   POST /api/erp/paystack/initialize   { saleId?, shiftId?, email, amountKobo, reference?, callbackUrl?, metadata? }
//   GET  /api/erp/paystack/verify/:ref  -> { status, amountKobo, channel, paidAt, saleId, ... }
//   POST /api/erp/paystack/webhook      (Paystack-signed; idempotent on reference)
//   GET  /api/erp/paystack              (list recent; auth required)
//
// Uses the SAME Paystack account as the Wodifair backend
// (PAYSTACK_SECRET_KEY is already in env). Channel selection happens
// on the frontend via Paystack Inline/Standard — backend only verifies
// and records the result.
// ===========================================================================

const PAYSTACK_BASE = 'https://api.paystack.co';
const getPaystackKey = () => process.env.PAYSTACK_SECRET_KEY;

const paystackHeaders = () => ({
  Authorization: `Bearer ${getPaystackKey()}`,
  'Content-Type': 'application/json',
});

// -- initialize a transaction --
router.post('/paystack/initialize', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  if (!getPaystackKey()) {
    return res.status(503).json({ error: 'PAYSTACK_SECRET_KEY not configured on server' });
  }
  const { saleId, shiftId, email, amountKobo, reference, callbackUrl, metadata } = req.body || {};
  if (!email || !amountKobo || amountKobo < 100) {
    return res.status(400).json({ error: 'email and amountKobo (>= 100) are required' });
  }
  const ref = reference || `ERP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  // Idempotency layer 1: if this reference is already in our DB, return it.
  const existing = await pool.query(
    `SELECT * FROM erp.paystack_transactions WHERE reference = $1`,
    [ref]
  );
  if (existing.rows.length > 0 && existing.rows[0].authorization_url) {
    return res.json({
      ok: true,
      reference: existing.rows[0].reference,
      authorization_url: existing.rows[0].authorization_url,
      access_code: existing.rows[0].access_code,
      deduplicated: true,
    });
  }

  // Persist first (so we can survive a crash mid-call and still dedupe on retry).
  await pool.query(
    `INSERT INTO erp.paystack_transactions
       (reference, sale_id, shift_id, amount_kobo, email, status, raw_response)
     VALUES ($1, $2, $3, $4, $5, 'initialized', $6)
     ON CONFLICT (reference) DO NOTHING`,
    [ref, saleId || null, shiftId || null, parseInt(amountKobo, 10), email, JSON.stringify({ initiatedBy: req.erpUser.id })]
  );

  const response = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    {
      email,
      amount: parseInt(amountKobo, 10),
      reference: ref,
      callback_url: callbackUrl,
      metadata: { ...(metadata || {}), saleId, shiftId, initiatedBy: req.erpUser.id },
    },
    { headers: paystackHeaders() }
  );

  if (!response.data || !response.data.status) {
    await pool.query(
      `UPDATE erp.paystack_transactions SET status = 'failed', updated_at = NOW() WHERE reference = $1`,
      [ref]
    );
    return res.status(502).json({ error: 'Paystack rejected initialization', detail: response.data });
  }

  await pool.query(
    `UPDATE erp.paystack_transactions
     SET authorization_url = $1, access_code = $2, updated_at = NOW()
     WHERE reference = $3`,
    [response.data.data.authorization_url, response.data.data.access_code, ref]
  );

  res.json({
    ok: true,
    reference: ref,
    authorization_url: response.data.data.authorization_url,
    access_code: response.data.data.access_code,
  });
}));

// -- verify by reference (frontend calls this after the popup closes) --
router.get('/paystack/verify/:reference', requireErpAuth(['ceo', 'rep', 'admin']), safe(async (req, res) => {
  if (!getPaystackKey()) {
    return res.status(503).json({ error: 'PAYSTACK_SECRET_KEY not configured on server' });
  }
  const { reference } = req.params;
  const response = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: paystackHeaders() }
  );
  const data = response.data && response.data.data;

  if (data && data.status === 'success') {
    // Idempotency layer 2: only flip DB if it's not already success.
    await pool.query(
      `UPDATE erp.paystack_transactions
       SET status = 'success',
           paystack_status = $1,
           channel = $2,
           paid_at = $3,
           updated_at = NOW()
       WHERE reference = $4 AND status <> 'success'`,
      [data.status, data.channel, data.paid_at ? new Date(data.paid_at) : null, reference]
    );

    // Mark the linked sale paid (if any).
    await pool.query(
      `UPDATE erp.sales
       SET payment_method = COALESCE(payment_method, 'Card'),
           payment_ref = $1,
           synced = TRUE,
           updated_at = NOW()
       WHERE id = (SELECT sale_id FROM erp.paystack_transactions WHERE reference = $1)`,
      [reference]
    ).catch(() => { /* sale may not be linked yet */ });
  }

  // Always return fresh view.
  const row = await pool.query(
    `SELECT * FROM erp.paystack_transactions WHERE reference = $1`,
    [reference]
  );
  res.json({ ok: true, paystack: response.data, local: row.rows[0] || null });
}));

// Helper function for processing ERP Paystack events (callable by both webhooks)
export async function processErpPaystackEvent(event) {
  const data = event.data || {};
  const reference = data.reference;
  if (!reference) return { status: 'no_reference' };

  // 1) idempotency guard — if the row is already success, return 200 immediately.
  const existing = await pool.query(
    `SELECT status FROM erp.paystack_transactions WHERE reference = $1`,
    [reference]
  );
  if (existing.rows.length > 0 && existing.rows[0].status === 'success') {
    return { status: 'duplicate', reference };
  }

  // 2) upsert
  await pool.query(
    `INSERT INTO erp.paystack_transactions
       (reference, sale_id, amount_kobo, currency, email, status, paystack_status, channel, paid_at, raw_response, updated_at)
     VALUES ($1, NULL, $2, $3, $4, 'success', $5, $6, $7, $8, NOW())
     ON CONFLICT (reference) DO UPDATE SET
       status = 'success',
       paystack_status = EXCLUDED.paystack_status,
       channel = EXCLUDED.channel,
       paid_at = EXCLUDED.paid_at,
       raw_response = EXCLUDED.raw_response,
       updated_at = NOW()
     WHERE erp.paystack_transactions.status <> 'success'`,
    [
      reference,
      data.amount,
      data.currency || 'NGN',
      (data.customer && data.customer.email) || null,
      data.status,
      data.channel,
      data.paid_at ? new Date(data.paid_at) : null,
      JSON.stringify(event),
    ]
  );

  // 3) mark the linked sale as paid, if any
  await pool.query(
    `UPDATE erp.sales
     SET payment_method = COALESCE(payment_method, 'Card'),
         payment_ref = $1,
         synced = TRUE,
         updated_at = NOW()
     WHERE id = (SELECT sale_id FROM erp.paystack_transactions WHERE reference = $1)`,
    [reference]
  ).catch(() => { /* no linked sale; safe to ignore */ });

  return { status: 'processed', reference };
}

// -- webhook (Paystack-signed) --
//   Idempotency: handled by UNIQUE(reference) in the table. The
//   application-level guard below short-circuits duplicate deliveries
//   with a 200 so Paystack stops retrying.
router.post('/paystack/webhook', safe(async (req, res) => {
  if (!getPaystackKey()) {
    return res.status(503).send('Paystack not configured');
  }

  // 1) verify HMAC SHA-512 signature over the EXACT raw body
  const signature = req.headers['x-paystack-signature'];
  if (!signature) return res.status(400).send('Missing signature');
  if (!Buffer.isBuffer(req.rawBody)) {
    return res.status(500).send('Server misconfigured (rawBody unavailable)');
  }
  const expected = crypto.createHmac('sha512', getPaystackKey()).update(req.rawBody).digest('hex');
  if (expected !== signature) return res.status(400).send('Invalid signature');

  const event = JSON.parse(req.rawBody.toString('utf8'));
  if (event.event !== 'charge.success') return res.status(200).send('Ignored');

  const result = await processErpPaystackEvent(event);
  res.status(200).json(result);
}));

// -- list recent transactions (auth required) --
router.get('/paystack', requireErpAuth(['ceo', 'admin']), safe(async (req, res) => {
  const r = await pool.query(
    `SELECT id, reference, sale_id, shift_id, amount_kobo, currency, email, status,
            paystack_status, channel, paid_at, created_at
     FROM erp.paystack_transactions
     ORDER BY created_at DESC
     LIMIT 100`
  );
  res.json(r.rows);
}));

export default router;
