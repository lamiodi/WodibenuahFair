// ===========================================================================
// ERP first-boot credential rotator
//
// For any erp.users row with must_change_password = TRUE, this module:
//   1. Generates a cryptographically strong random replacement
//      - CEO password : 20 chars, base62
//      - Rep PIN      : 6 digits (still 4-digit friendly if you keep it numeric)
//   2. bcrypt-hashes it and writes it back to the DB.
//   3. Logs the plaintext to the server console ONCE.
//   4. Sets must_change_password = FALSE so it never re-rotates.
//
// Idempotent: re-running on a clean DB does nothing.
// Non-destructive: never touches rows that are not flagged for rotation.
// Defensive: every DB call is wrapped; a failure logs and continues,
// it never throws at boot time.
// ===========================================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db.js';

const log = (...a) => console.log('[erp-first-boot]', ...a);
const err = (...a) => console.error('[erp-first-boot]', ...a);

// 20-char base62 password: easy to copy-paste, not in any rainbow table.
const generateStrongPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(20);
  let out = '';
  for (let i = 0; i < 20; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
};

// 6-digit PIN (reps; admins can change to anything 4-8 digits later).
const generateStrongPin = () => {
  // 000000–999999, left-padded.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
};

export const rotateFirstLoginCredentials = async () => {
  try {
    const flagged = await pool.query(
      `SELECT id, name, email, role
       FROM erp.users
       WHERE must_change_password = TRUE AND is_active = TRUE`
    );

    if (flagged.rows.length === 0) {
      log('no flagged users; nothing to rotate.');
      return { rotated: 0 };
    }

    let count = 0;
    for (const u of flagged.rows) {
      try {
        if (u.role === 'ceo' || u.role === 'admin') {
          const newPassword = generateStrongPassword();
          const hash = await bcrypt.hash(newPassword, 10);
          await pool.query(
            `UPDATE erp.users
             SET password_hash = $1,
                 must_change_password = FALSE,
                 last_password_change_at = NOW(),
                 updated_at = NOW()
             WHERE id = $2`,
            [hash, u.id]
          );
          log(`rotated CEO password for "${u.name}" <${u.email}>`);
          log(`  NEW PASSWORD: ${newPassword}  (copy now — shown once)`);
        } else if (u.role === 'rep') {
          const newPin = generateStrongPin();
          const pinHash = await bcrypt.hash(newPin, 10);
          await pool.query(
            `UPDATE erp.users
             SET pin_hash = $1,
                 must_change_password = FALSE,
                 last_password_change_at = NOW(),
                 updated_at = NOW()
             WHERE id = $2`,
            [pinHash, u.id]
          );
          log(`rotated rep PIN for "${u.name}"`);
          log(`  NEW PIN: ${newPin}  (copy now — shown once)`);
        }
        count++;
      } catch (innerErr) {
        err(`failed to rotate user ${u.id} (${u.email || u.name}):`, innerErr.message);
        // continue with the next user
      }
    }
    log(`rotation complete. ${count} credential(s) rotated.`);
    return { rotated: count };
  } catch (e) {
    err('rotator failed (non-fatal):', e.message);
    return { rotated: 0, error: e.message };
  }
};
