-- ERP Schema Migration
-- Self-contained: does not depend on any other migration. Safe to run in any order.
-- Idempotent: every CREATE uses IF NOT EXISTS so re-runs are harmless.

CREATE SCHEMA IF NOT EXISTS erp;

-- =========================================================================
-- ERP USERS (CEO + Reps)
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.users (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'rep',          -- 'ceo' | 'rep'
  pin VARCHAR(255),                                  -- 4-digit PIN for reps (hashed)
  password_hash VARCHAR(255),                        -- bcrypt for ceo
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ERP PRODUCTS  (image_url replaces the old imageBase64 column)
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.products (
  id VARCHAR(255) PRIMARY KEY,
  barcode VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  cost_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  selling_price DOUBLE PRECISION NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,                                    -- Cloudinary URL (preferred)
  image_base64 TEXT,                                 -- Legacy fallback (will be migrated out)
  category VARCHAR(255) NOT NULL DEFAULT 'General',
  expiry_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_products_barcode ON erp.products(barcode);
CREATE INDEX IF NOT EXISTS idx_erp_products_category ON erp.products(category);
CREATE INDEX IF NOT EXISTS idx_erp_products_updated_at ON erp.products(updated_at);

-- =========================================================================
-- ERP CUSTOMERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  total_spent DOUBLE PRECISION NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Regular',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_customers_phone ON erp.customers(phone);
CREATE INDEX IF NOT EXISTS idx_erp_customers_updated_at ON erp.customers(updated_at);

-- =========================================================================
-- ERP SALES
-- items stored as JSONB for flexibility
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.sales (
  id VARCHAR(255) PRIMARY KEY,
  items JSONB NOT NULL,
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  profit_made DOUBLE PRECISION NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL,               -- 'Cash' | 'Transfer' | 'Card' | 'Split'
  payment_ref VARCHAR(255),
  split_details JSONB,
  sold_by VARCHAR(255) NOT NULL,
  shift_id VARCHAR(255),
  is_held BOOLEAN NOT NULL DEFAULT FALSE,
  is_quick_sale BOOLEAN NOT NULL DEFAULT FALSE,
  is_refund BOOLEAN NOT NULL DEFAULT FALSE,
  original_sale_id VARCHAR(255),
  coupon_code VARCHAR(255),
  customer_id VARCHAR(255) REFERENCES erp.customers(id) ON DELETE SET NULL,
  synced BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_sales_created_at ON erp.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_sales_shift_id ON erp.sales(shift_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_sold_by ON erp.sales(sold_by);

-- =========================================================================
-- ERP SHIFTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.shifts (
  id VARCHAR(255) PRIMARY KEY,
  rep_name VARCHAR(255) NOT NULL,
  opening_cash DOUBLE PRECISION NOT NULL DEFAULT 0,
  closing_cash DOUBLE PRECISION,
  expected_cash DOUBLE PRECISION,
  sales_count INTEGER NOT NULL DEFAULT 0,
  total_sales DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_expenses DOUBLE PRECISION NOT NULL DEFAULT 0,
  variance DOUBLE PRECISION,
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP,
  synced BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_erp_shifts_opened_at ON erp.shifts(opened_at DESC);

-- =========================================================================
-- ERP EXPENSES
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.expenses (
  id VARCHAR(255) PRIMARY KEY,
  amount DOUBLE PRECISION NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  shift_id VARCHAR(255),
  logged_by VARCHAR(255) NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ERP AUDIT LOGS  (price changes, stock adjustments, deletes, generic)
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,                      -- 'PRICE_CHANGE' | 'STOCK_ADJUST' | 'DELETE' | 'INVENTORY_ADJUST' | etc.
  entity VARCHAR(100) NOT NULL,                      -- 'product' | 'sale' | 'shift' | ...
  entity_id VARCHAR(255),
  product_id VARCHAR(255),                           -- convenience for stock changes
  type VARCHAR(50),                                  -- ADD | REMOVE | SET for inventory_adjustment
  quantity DOUBLE PRECISION,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  details TEXT,
  performed_by VARCHAR(255) NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_product_id ON erp.audit_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_erp_audit_logs_created_at ON erp.audit_logs(created_at DESC);

-- =========================================================================
-- ERP SETTINGS  (key/value store)
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ERP COUPONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.coupons (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  discount_type VARCHAR(50) NOT NULL,                -- 'percent' | 'fixed'
  discount_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ERP SYNC LOG  (idempotency tracking for /api/erp/sync)
-- Prevents the same offline-queued payload from being applied twice.
-- =========================================================================
CREATE TABLE IF NOT EXISTS erp.sync_log (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  received_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_erp_sync_log_entity ON erp.sync_log(entity);
CREATE INDEX IF NOT EXISTS idx_erp_sync_log_received_at ON erp.sync_log(received_at DESC);

-- =========================================================================
-- DEFAULT CEO  (so first-time login works out of the box)
-- Password: admin123  (bcrypt hash below; user can change after first login)
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp.users WHERE role = 'ceo') THEN
    INSERT INTO erp.users (id, name, email, role, password_hash, is_active)
    VALUES (
      gen_random_uuid()::text,
      'CEO Admin',
      'ceo@wodifair.local',
      'ceo',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt of 'admin123'
      TRUE
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM erp.users WHERE role = 'rep') THEN
    INSERT INTO erp.users (id, name, role, pin, is_active)
    VALUES (
      gen_random_uuid()::text,
      'Store Rep 1',
      'rep',
      '1234',
      TRUE
    );
  END IF;
END$$;
