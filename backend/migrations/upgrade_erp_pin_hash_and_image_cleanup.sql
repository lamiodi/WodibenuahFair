-- ===========================================================================
-- ERP hardening — round 2
--   1. Replace plaintext rep PINs with bcrypt hashes (pin column -> pin_hash)
--   2. Drop the legacy image_base64 column on erp.products
--   3. Add erp.security_events for login / password / reset audit trail
--
-- Idempotent. Self-contained. Safe to run alongside the live Wodifair
-- backend (it does not touch any public/non-erp schema or table).
-- Requires pgcrypto for crypt() — CREATE EXTENSION below is safe to
-- re-run (IF NOT EXISTS).
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) PIN -> pin_hash  (rep accounts)
-- ---------------------------------------------------------------------------
ALTER TABLE erp.users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);

-- Hash any existing plaintext PINs using pgcrypto's crypt() with
-- bcrypt format. pgcrypto's bf salt is `$2a$10$...` which is compatible
-- with Node bcryptjs.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, pin
    FROM erp.users
    WHERE pin IS NOT NULL
      AND pin <> ''
      AND (pin_hash IS NULL OR pin_hash = '')
      AND role = 'rep'
  LOOP
    UPDATE erp.users
    SET pin_hash = crypt(rec.pin, gen_salt('bf', 10))
    WHERE id = rec.id;
  END LOOP;
END$$;

-- Now safe to drop the plaintext column.
ALTER TABLE erp.users DROP COLUMN IF EXISTS pin;

-- Sanity check: every rep must have a pin_hash after the migration.
-- (A rep created by the very first migration with no plaintext pin will
-- be flagged with must_change_password so the boot rotator hashes one.)
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM erp.users
  WHERE role = 'rep' AND is_active = TRUE AND (pin_hash IS NULL OR pin_hash = '');
  IF missing_count > 0 THEN
    UPDATE erp.users
    SET must_change_password = TRUE
    WHERE role = 'rep' AND is_active = TRUE AND (pin_hash IS NULL OR pin_hash = '');
    RAISE NOTICE 'Flagged % rep(s) without pin_hash for first-boot rotation', missing_count;
  END IF;
END$$;

-- ---------------------------------------------------------------------------
-- 2) Drop legacy image_base64 column
--    All uploads are now Cloudinary URLs (image_url). The application
--    auto-uploads base64 payloads to Cloudinary and stores the result.
-- ---------------------------------------------------------------------------
ALTER TABLE erp.products DROP COLUMN IF EXISTS image_base64;

-- ---------------------------------------------------------------------------
-- 3) Security events  (login attempts, password changes, resets, admin resets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS erp.security_events (
  id           VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  event        VARCHAR(100) NOT NULL,
                                -- login_success | login_fail
                                -- password_change | pin_change
                                -- reset_request | reset_complete
                                -- admin_reset | token_redeem_fail
  user_id      VARCHAR(255) REFERENCES erp.users(id) ON DELETE SET NULL,
  user_email   VARCHAR(255),
  user_name    VARCHAR(255),
  ip           VARCHAR(64),
  user_agent   TEXT,
  detail       TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_sec_events_event      ON erp.security_events(event);
CREATE INDEX IF NOT EXISTS idx_erp_sec_events_user_id    ON erp.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_sec_events_created_at ON erp.security_events(created_at DESC);

-- Convenience view (optional): latest 200 events for the admin dashboard.
-- Comment-out if you don't want it.
-- CREATE OR REPLACE VIEW erp.v_recent_security_events AS
--   SELECT * FROM erp.security_events ORDER BY created_at DESC LIMIT 200;
