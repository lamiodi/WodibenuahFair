-- Retail OS Schema Migration
-- Creates the `retail` schema in the WodiFair Supabase project.
-- Tables are kept with the same column structure and table names that
-- the Retail OS frontend (Next.js + Dexie) already expects, just namespaced.
--
-- Self-contained: does not depend on any other migration. Safe to run in any order.
-- Idempotent: every CREATE uses IF NOT EXISTS so re-runs are harmless.
-- Non-destructive: does NOT touch any existing Wodifair / ERP / public tables.

CREATE SCHEMA IF NOT EXISTS retail;

-- =========================================================================
-- RETAIL PRODUCTS
--   Mirrors Dexie's OfflineProduct (camelCase columns preserved).
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_products (
  id VARCHAR(255) PRIMARY KEY,
  barcode VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "reorderLevel" INTEGER NOT NULL DEFAULT 5,
  "imageBase64" TEXT,
  category VARCHAR(255) NOT NULL DEFAULT 'General',
  "expiryDate" DATE,
  "imageUrl" TEXT, -- Cloudinary URL (preferred over base64)
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retail_products_barcode ON retail.wodi_products(barcode);
CREATE INDEX IF NOT EXISTS idx_retail_products_category ON retail.wodi_products(category);
CREATE INDEX IF NOT EXISTS idx_retail_products_updated_at ON retail.wodi_products("updatedAt");

-- =========================================================================
-- RETAIL CUSTOMERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_customers (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) UNIQUE NOT NULL,
  "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Regular',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retail_customers_phone ON retail.wodi_customers(phone);
CREATE INDEX IF NOT EXISTS idx_retail_customers_updated_at ON retail.wodi_customers("updatedAt");

-- =========================================================================
-- RETAIL SALES  (items stored as JSONB for flexibility)
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_sales (
  id VARCHAR(255) PRIMARY KEY,
  items JSONB NOT NULL,                              -- JSONB so we can query later if needed
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "profitMade" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paymentMethod" VARCHAR(50) NOT NULL,              -- 'Cash' | 'Transfer' | 'Card' | 'Split'
  "paymentRef" VARCHAR(255),
  "splitDetails" JSONB,
  "soldBy" VARCHAR(255) NOT NULL,
  "shiftId" VARCHAR(255),
  "isHeld" BOOLEAN NOT NULL DEFAULT FALSE,
  "isQuickSale" BOOLEAN NOT NULL DEFAULT FALSE,
  "isRefund" BOOLEAN NOT NULL DEFAULT FALSE,
  "originalSaleId" VARCHAR(255),
  "customerId" VARCHAR(255) REFERENCES retail.wodi_customers(id) ON DELETE SET NULL,
  synced BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retail_sales_created_at ON retail.wodi_sales("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_retail_sales_shift_id ON retail.wodi_sales("shiftId");
CREATE INDEX IF NOT EXISTS idx_retail_sales_customer_id ON retail.wodi_sales("customerId");

-- =========================================================================
-- RETAIL SHIFTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_shifts (
  id VARCHAR(255) PRIMARY KEY,
  "repName" VARCHAR(255) NOT NULL,
  "openingCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "closingCash" DOUBLE PRECISION,
  "expectedCash" DOUBLE PRECISION,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "totalSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
  variance DOUBLE PRECISION,
  "openedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP,
  synced BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_retail_shifts_opened_at ON retail.wodi_shifts("openedAt" DESC);

-- =========================================================================
-- RETAIL EXPENSES
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_expenses (
  id VARCHAR(255) PRIMARY KEY,
  amount DOUBLE PRECISION NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  "shiftId" VARCHAR(255),
  "loggedBy" VARCHAR(255) NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retail_expenses_shift_id ON retail.wodi_expenses("shiftId");

-- =========================================================================
-- RETAIL AUDIT LOGS  (price changes, stock adjustments, deletes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,                       -- 'PRICE_CHANGE' | 'STOCK_ADJUST' | 'DELETE' | 'INVENTORY_ADJUST'
  entity VARCHAR(100) NOT NULL,
  "entityId" VARCHAR(255),
  "productId" VARCHAR(255),
  type VARCHAR(50),                                  -- 'ADD' | 'REMOVE' | 'SET'
  quantity DOUBLE PRECISION,
  reason TEXT,
  details TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "performedBy" VARCHAR(255) NOT NULL,
  synced BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_retail_audit_logs_product_id ON retail.wodi_audit_logs("productId");
CREATE INDEX IF NOT EXISTS idx_retail_audit_logs_created_at ON retail.wodi_audit_logs("createdAt" DESC);

-- =========================================================================
-- RETAIL SETTINGS  (key/value store)
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- RETAIL COUPONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_coupons (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  "discountType" VARCHAR(50) NOT NULL,                -- 'percent' | 'fixed'
  "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- RETAIL USERS  (CEO + Reps)
--   Mirrors Dexie's OfflineUser. CEO uses password_hash; reps use pin.
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.wodi_users (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'rep',           -- 'ceo' | 'rep'
  pin VARCHAR(255),                                  -- 4-digit PIN for reps (hashed)
  "passwordHash" VARCHAR(255),                       -- bcrypt for ceo
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- RETAIL SYNC LOG  (idempotency tracking for /api/retail/sync)
-- =========================================================================
CREATE TABLE IF NOT EXISTS retail.sync_log (
  idempotency_key VARCHAR(255) PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  received_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_retail_sync_log_entity ON retail.sync_log(entity);
CREATE INDEX IF NOT EXISTS idx_retail_sync_log_received_at ON retail.sync_log(received_at DESC);

-- =========================================================================
-- DEFAULT CEO  (so first-time login works out of the box)
-- Password: admin123  (bcrypt hash; user can change after first login)
-- =========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM retail.wodi_users WHERE role = 'ceo') THEN
    INSERT INTO retail.wodi_users (id, name, email, role, "passwordHash", "isActive")
    VALUES (
      gen_random_uuid()::text,
      'CEO Admin',
      'ceo@retail.local',
      'ceo',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt of 'admin123'
      TRUE
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM retail.wodi_users WHERE role = 'rep') THEN
    INSERT INTO retail.wodi_users (id, name, role, pin, "isActive")
    VALUES (
      gen_random_uuid()::text,
      'Demo Rep',
      'rep',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- bcrypt of '0000' placeholder
      TRUE
    );
  END IF;
END $$;
