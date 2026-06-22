-- ===========================================================================
-- add_unique_vendor_payment_reference.sql
--
-- Wodifair webhook hardening (mirrors Bubu Lagos migration 015).
--
-- Adds a UNIQUE constraint on vendors.payment_reference. Combined with
-- the existing payment_status check in processSuccessfulPayment, this
-- gives us 3 layers of webhook idempotency:
--
--   1. Pre-check (in processSuccessfulPayment):
--        IF payment_status = 'paid' AND payment_reference = $ref
--        THEN return immediately, no UPDATE, no email.
--   2. Row lock (in processSuccessfulPayment):
--        BEGIN; SELECT ... FOR UPDATE; UPDATE; COMMIT.
--   3. DB UNIQUE (this migration):
--        Two 'paid' rows for the same payment_reference is now
--        impossible — even if layer 1 races, the DB rejects.
--
-- Before adding the constraint we dedup any existing rows that share
-- a payment_reference. We keep the OLDEST row (lowest id) and NULL
-- out the others so they cannot re-attach to a later webhook
-- delivery. payment_reference itself is left intact on the kept row
-- so its payment_reference stays valid.
--
-- Idempotent. Safe to run alongside the live Wodifair backend.
-- ===========================================================================

-- 1. Dedup: keep one row per payment_reference (the oldest by id),
--    NULL out the rest. Wrapped in a CTE so it's a single statement.
UPDATE vendors
SET    payment_reference = NULL,
       updated_at = NOW()
WHERE  id IN (
         SELECT id FROM (
           SELECT id,
                  ROW_NUMBER() OVER (
                    PARTITION BY payment_reference
                    ORDER BY id ASC
                  ) AS rn
           FROM vendors
           WHERE payment_reference IS NOT NULL
         ) AS t
         WHERE t.rn > 1
       );

-- 2. Add the UNIQUE constraint. DO NOTHING-style: the migration
--    runner tracks this file by name in the migrations table, so it
--    will never run twice anyway, but a belt-and-suspenders guard
--    here costs nothing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'vendors_payment_reference_unique'
  ) THEN
    ALTER TABLE vendors
      ADD CONSTRAINT vendors_payment_reference_unique UNIQUE (payment_reference);
  END IF;
END$$;
