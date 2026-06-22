-- ===========================================================================
-- Shared-schema Optimization Migration
--
-- Applied AFTER add_retail_schema.sql and add_bubu_schema.sql.
-- All statements are idempotent (IF NOT EXISTS / CREATE OR REPLACE / DO $$).
--
-- Optimizations applied:
--   1. Enable pgcrypto (needed by gen_random_uuid() on PG < 13)
--   2. Add missing FK-supporting indexes (Bubu order_items, gift_card_logs,
--      bubu.orders.coupon_id, bubu.orders.gift_card_id)
--   3. Add GIN index on retail.wodi_sales.items JSONB for future analytics
--   4. Add indexes on commonly-filtered columns
--        (retail.wodi_sales.soldBy, isHeld, isRefund,
--         retail.wodi_shifts.repName,
--         retail.wodi_audit_logs.action, performedBy,
--         retail.wodi_coupons.isActive,
--         bubu.orders.guest_email,
--         bubu.contact_messages.created_at,
--         bubu.gift_card_logs.created_at)
--   5. CHECK constraints for non-negative monetary columns
--   6. Add auto-update triggers for updated_at on tables that have the column
--      but no trigger
--
-- Optimizations NOT applied (require code changes / data migration):
--   * ON DELETE CASCADE -> RESTRICT for products / order_items
--   * VARCHAR(255) id -> native UUID
--   * paymentMethod VARCHAR(50) -> ENUM
--   * Removed gen_random_uuid()::text casts (works via implicit cast)
-- ===========================================================================

-- 1. Extension (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- 2. Missing FK-supporting indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_bubu_orders_coupon_id
  ON bubu.orders(coupon_id) WHERE coupon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bubu_orders_gift_card_id
  ON bubu.orders(gift_card_id) WHERE gift_card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bubu_order_items_variant_id
  ON bubu.order_items(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bubu_gift_card_logs_gift_card_id
  ON bubu.gift_card_logs(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_bubu_gift_card_logs_order_id
  ON bubu.gift_card_logs(order_id) WHERE order_id IS NOT NULL;

-- =========================================================================
-- 3. GIN index on JSONB (supports future "items @> '[{...}]'" queries)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_retail_sales_items_gin
  ON retail.wodi_sales USING GIN (items);
CREATE INDEX IF NOT EXISTS idx_retail_sales_split_details_gin
  ON retail.wodi_sales USING GIN ("splitDetails")
  WHERE "splitDetails" IS NOT NULL;

-- =========================================================================
-- 4. Indexes on commonly-filtered columns
-- =========================================================================
-- Retail: filter "my sales" / "my shifts" by rep name
CREATE INDEX IF NOT EXISTS idx_retail_sales_sold_by ON retail.wodi_sales("soldBy");
CREATE INDEX IF NOT EXISTS idx_retail_sales_is_held ON retail.wodi_sales("isHeld") WHERE "isHeld" = TRUE;
CREATE INDEX IF NOT EXISTS idx_retail_sales_is_refund ON retail.wodi_sales("isRefund") WHERE "isRefund" = TRUE;
CREATE INDEX IF NOT EXISTS idx_retail_shifts_rep_name ON retail.wodi_shifts("repName");
CREATE INDEX IF NOT EXISTS idx_retail_audit_logs_action ON retail.wodi_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_retail_audit_logs_performed_by ON retail.wodi_audit_logs("performedBy");
CREATE INDEX IF NOT EXISTS idx_retail_coupons_is_active ON retail.wodi_coupons("isActive") WHERE "isActive" = TRUE;

-- Bubu: guest order lookups + admin lists
CREATE INDEX IF NOT EXISTS idx_bubu_orders_guest_email
  ON bubu.orders(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bubu_contact_messages_created_at
  ON bubu.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bubu_gift_card_logs_created_at
  ON bubu.gift_card_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bubu_orders_created_at
  ON bubu.orders(created_at DESC);

-- =========================================================================
-- 5. CHECK constraints for non-negative monetary columns
--    Wrapped in DO blocks so they don't fail if already added
-- =========================================================================
DO $$
BEGIN
  -- Retail sales
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_sales_total_nonneg') THEN
    ALTER TABLE retail.wodi_sales
      ADD CONSTRAINT chk_retail_sales_total_nonneg CHECK ("totalAmount" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_customers_total_nonneg') THEN
    ALTER TABLE retail.wodi_customers
      ADD CONSTRAINT chk_retail_customers_total_nonneg CHECK ("totalSpent" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_customers_points_nonneg') THEN
    ALTER TABLE retail.wodi_customers
      ADD CONSTRAINT chk_retail_customers_points_nonneg CHECK (points >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_products_cost_nonneg') THEN
    ALTER TABLE retail.wodi_products
      ADD CONSTRAINT chk_retail_products_cost_nonneg CHECK ("costPrice" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_products_selling_nonneg') THEN
    ALTER TABLE retail.wodi_products
      ADD CONSTRAINT chk_retail_products_selling_nonneg CHECK ("sellingPrice" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_products_stock_nonneg') THEN
    ALTER TABLE retail.wodi_products
      ADD CONSTRAINT chk_retail_products_stock_nonneg CHECK ("stockQuantity" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_retail_expenses_amount_nonneg') THEN
    ALTER TABLE retail.wodi_expenses
      ADD CONSTRAINT chk_retail_expenses_amount_nonneg CHECK (amount >= 0);
  END IF;

  -- Bubu commerce
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_orders_total_nonneg') THEN
    ALTER TABLE bubu.orders
      ADD CONSTRAINT chk_bubu_orders_total_nonneg CHECK (total_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_products_base_price_nonneg') THEN
    ALTER TABLE bubu.products
      ADD CONSTRAINT chk_bubu_products_base_price_nonneg CHECK (base_price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_variants_price_nonneg') THEN
    ALTER TABLE bubu.product_variants
      ADD CONSTRAINT chk_bubu_variants_price_nonneg CHECK (price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_variants_stock_nonneg') THEN
    ALTER TABLE bubu.product_variants
      ADD CONSTRAINT chk_bubu_variants_stock_nonneg CHECK (stock_quantity >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_gift_cards_original_positive') THEN
    ALTER TABLE bubu.gift_cards
      ADD CONSTRAINT chk_bubu_gift_cards_original_positive CHECK (original_balance > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_gift_cards_current_nonneg') THEN
    ALTER TABLE bubu.gift_cards
      ADD CONSTRAINT chk_bubu_gift_cards_current_nonneg CHECK (current_balance >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_coupons_value_nonneg') THEN
    ALTER TABLE bubu.coupons
      ADD CONSTRAINT chk_bubu_coupons_value_nonneg CHECK (value >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_order_items_qty_positive') THEN
    ALTER TABLE bubu.order_items
      ADD CONSTRAINT chk_bubu_order_items_qty_positive CHECK (quantity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bubu_order_items_price_nonneg') THEN
    ALTER TABLE bubu.order_items
      ADD CONSTRAINT chk_bubu_order_items_price_nonneg CHECK (price_at_purchase >= 0);
  END IF;
END$$;

-- =========================================================================
-- 6. Auto-update triggers for updated_at columns
--    Reusable function lives in the public schema; the Bubu / Retail tables
--    can call it from there.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Retail
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'wodi_products','wodi_customers','wodi_coupons','wodi_users',
      'wodi_settings'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON retail.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON retail.%1$s
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t
    );
  END LOOP;
END$$;

-- Bubu
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'customers','gift_cards','coupons'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON bubu.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON bubu.%1$s
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t
    );
  END LOOP;
END$$;
