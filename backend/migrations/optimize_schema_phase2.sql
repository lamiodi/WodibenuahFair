-- ============================================================
-- Phase 2 Optimization Migration
-- ============================================================
-- Adds the 18 missing common-lookup indexes, 5 FK-supporting
-- indexes, and 1 remaining JSONB GIN index flagged by the
-- apply-and-inspect.js run AFTER optimize_schema.sql.
--
-- All statements are idempotent (CREATE ... IF NOT EXISTS).
-- Safe to re-run.
-- ============================================================

-- ============================================================
-- 1. Common-lookup indexes (Bubu)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bubu_contact_messages_email
  ON bubu.contact_messages (email);

CREATE INDEX IF NOT EXISTS idx_bubu_customer_addresses_phone
  ON bubu.customer_addresses (phone);

CREATE INDEX IF NOT EXISTS idx_bubu_customer_addresses_zip
  ON bubu.customer_addresses (zip_code);

CREATE INDEX IF NOT EXISTS idx_bubu_orders_guest_phone
  ON bubu.orders (guest_phone);

-- ============================================================
-- 2. Common-lookup indexes (Public / WodiFair)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_public_contact_messages_phone
  ON public.contact_messages (phone);

CREATE INDEX IF NOT EXISTS idx_public_contacts_email
  ON public.contacts (email);

CREATE INDEX IF NOT EXISTS idx_public_customer_addresses_phone
  ON public.customer_addresses (phone);

CREATE INDEX IF NOT EXISTS idx_public_customer_addresses_zip
  ON public.customer_addresses (zip_code);

CREATE INDEX IF NOT EXISTS idx_public_events_status
  ON public.events (status);

CREATE INDEX IF NOT EXISTS idx_public_orders_customer_email
  ON public.orders (customer_email);

CREATE INDEX IF NOT EXISTS idx_public_orders_customer_phone
  ON public.orders (customer_phone);

CREATE INDEX IF NOT EXISTS idx_public_orders_guest_email
  ON public.orders (guest_email);

CREATE INDEX IF NOT EXISTS idx_public_orders_guest_phone
  ON public.orders (guest_phone);

CREATE INDEX IF NOT EXISTS idx_public_vendors_payment_reference
  ON public.vendors (payment_reference);

CREATE INDEX IF NOT EXISTS idx_public_wodi_customers_status
  ON public.wodi_customers (status);

-- ============================================================
-- 3. Common-lookup indexes (Retail)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_retail_sync_log_entity_id
  ON retail.sync_log (entity_id);

CREATE INDEX IF NOT EXISTS idx_retail_wodi_customers_status
  ON retail.wodi_customers (status);

-- ============================================================
-- 4. FK-supporting indexes (JOINs were seq-scanning)
-- ============================================================

-- public.audit_logs.user_id -> users
CREATE INDEX IF NOT EXISTS idx_public_audit_logs_user_id
  ON public.audit_logs (user_id);

-- public.blogs.author_id -> users
CREATE INDEX IF NOT EXISTS idx_public_blogs_author_id
  ON public.blogs (author_id);

-- public.order_items.variant_id -> product_variants
CREATE INDEX IF NOT EXISTS idx_public_order_items_variant_id
  ON public.order_items (variant_id);

-- public.vendors.event_id -> events
CREATE INDEX IF NOT EXISTS idx_public_vendors_event_id
  ON public.vendors (event_id);

-- retail.wodi_sales.customerId -> wodi_customers
-- Note: column is camelCase in the retail schema.
CREATE INDEX IF NOT EXISTS idx_retail_wodi_sales_customer_id
  ON retail.wodi_sales ("customerId");

-- ============================================================
-- 5. JSONB GIN index (the one not covered by phase 1)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_public_orders_shipping_address_gin
  ON public.orders USING gin (shipping_address)
  WHERE shipping_address IS NOT NULL;

-- ============================================================
-- END
-- ============================================================
