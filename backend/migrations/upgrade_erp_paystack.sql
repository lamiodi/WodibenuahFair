-- ===========================================================================
-- ERP Paystack tables
-- Idempotent. Self-contained. Safe to run in any order.
-- ===========================================================================

-- paystack_transactions: one row per payment attempt. Idempotent on
-- `reference` — the unique index is the last line of defence against
-- duplicate processing even if the application-level pre-check ever
-- fails (race, retry, deploy-during-flight).
CREATE TABLE IF NOT EXISTS erp.paystack_transactions (
  id                  VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  reference           VARCHAR(255) UNIQUE NOT NULL,
  sale_id             VARCHAR(255) REFERENCES erp.sales(id) ON DELETE SET NULL,
  shift_id            VARCHAR(255),
  amount_kobo         BIGINT NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'NGN',
  email               VARCHAR(255),
  status              VARCHAR(50) NOT NULL DEFAULT 'initialized',
                                     -- initialized | success | failed | abandoned
  paystack_status     VARCHAR(50),
  channel             VARCHAR(50),
  authorization_url   TEXT,
  access_code         VARCHAR(255),
  paid_at             TIMESTAMP,
  raw_response        JSONB,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_paystack_sale_id        ON erp.paystack_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_erp_paystack_shift_id       ON erp.paystack_transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_erp_paystack_status         ON erp.paystack_transactions(status);
CREATE INDEX IF NOT EXISTS idx_erp_paystack_created_at     ON erp.paystack_transactions(created_at DESC);
