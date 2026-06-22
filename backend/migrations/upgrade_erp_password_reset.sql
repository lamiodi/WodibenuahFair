-- ===========================================================================
-- ERP credential hardening
-- Adds:
--   * must_change_password flag
--   * password_reset_tokens table (single-use, expiring, hashed)
--   * last_password_change_at for audit
-- Marks the well-known default CEO + rep as needing rotation. The
-- boot-time credential rotator (utils/erpFirstBoot.js) generates a
-- cryptographically random replacement on next server start and logs
-- the plaintext to the server console ONCE.
-- Idempotent: every statement is guarded with IF NOT EXISTS / DO blocks.
-- ===========================================================================

-- 1) flag columns
ALTER TABLE erp.users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_password_change_at TIMESTAMP;

-- 2) reset tokens (store SHA-256 of the token, never the raw token)
CREATE TABLE IF NOT EXISTS erp.password_reset_tokens (
  id            VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(255) NOT NULL REFERENCES erp.users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(128) UNIQUE NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  used_at       TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_reset_tokens_user    ON erp.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_reset_tokens_expires ON erp.password_reset_tokens(expires_at);

-- 3) mark the seeded default CEO + rep so the boot rotator picks them up.
--    We do this by NAME (the only stable identifier at seed time) and we
--    only flip the flag if the user is still on the well-known default.
DO $$
DECLARE
  default_ceo_bcrypt CONSTANT TEXT := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; -- bcrypt('admin123')
  default_rep_pin     CONSTANT TEXT := '1234';
BEGIN
  UPDATE erp.users
  SET    must_change_password = TRUE
  WHERE  role = 'ceo'
    AND  password_hash = default_ceo_bcrypt
    AND  must_change_password = FALSE;

  UPDATE erp.users
  SET    must_change_password = TRUE
  WHERE  role = 'rep'
    AND  name  = 'Store Rep 1'
    AND  pin   = default_rep_pin
    AND  must_change_password = FALSE;
END$$;
