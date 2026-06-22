-- Bubu Lagos Schema Migration
-- Creates the `bubu` schema in the WodiFair Supabase project.
-- Tables mirror the structure from Bubu Lagos's local migrations
-- (001-017), just namespaced into the bubu schema.
--
-- Self-contained: does not depend on any other migration. Safe to run in any order.
-- Idempotent: every CREATE uses IF NOT EXISTS so re-runs are harmless.
-- Non-destructive: does NOT touch any existing Wodifair / ERP / retail tables.
--
-- NOTE: The existing Bubu Lagos backend can keep running against its own DB
-- (no migration needed there) until you're ready to flip DATABASE_URL.

CREATE SCHEMA IF NOT EXISTS bubu;

-- =========================================================================
-- ORDER STATUS + GIFT CARD + COUPON ENUMS
-- =========================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bubu_order_status') THEN
        CREATE TYPE bubu.bubu_order_status AS ENUM ('Pending', 'Paid', 'Shipped');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bubu_gift_card_status') THEN
        CREATE TYPE bubu.bubu_gift_card_status AS ENUM ('Active', 'Fully_Redeemed', 'Expired', 'Cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bubu_coupon_type') THEN
        CREATE TYPE bubu.bubu_coupon_type AS ENUM ('Percentage', 'Fixed', 'BOGO');
    END IF;
END$$;

-- =========================================================================
-- CATEGORIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.categories (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================================
-- PRODUCTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.products (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  images TEXT[],
  video_url VARCHAR(500),
  category_id VARCHAR(255) NOT NULL REFERENCES bubu.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_products_category_id ON bubu.products(category_id);

-- =========================================================================
-- PRODUCT VARIANTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.product_variants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) NOT NULL REFERENCES bubu.products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_product_variants_product_id ON bubu.product_variants(product_id);

-- =========================================================================
-- CUSTOMERS  (registered + guest)
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.customers (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bubu_customers_phone_unique
  ON bubu.customers(phone) WHERE phone IS NOT NULL AND phone != '';
CREATE INDEX IF NOT EXISTS idx_bubu_customers_is_guest ON bubu.customers(is_guest);

-- =========================================================================
-- CUSTOMER ADDRESSES
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.customer_addresses (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id VARCHAR(255) NOT NULL REFERENCES bubu.customers(id) ON DELETE CASCADE,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zip_code VARCHAR(50),
  phone VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_customer_addresses_customer_id ON bubu.customer_addresses(customer_id);

-- =========================================================================
-- PASSWORD RESET TOKENS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.password_reset_tokens (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL REFERENCES bubu.customers(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bubu_password_reset_tokens_token ON bubu.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_bubu_password_reset_tokens_customer ON bubu.password_reset_tokens(customer_id);

-- =========================================================================
-- ORDERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.orders (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount DECIMAL(10, 2) NOT NULL,
  status bubu.bubu_order_status DEFAULT 'Pending',
  payment_reference VARCHAR(255) UNIQUE,
  customer_id VARCHAR(255) REFERENCES bubu.customers(id) ON DELETE SET NULL,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(255),
  shipping_address TEXT NOT NULL,
  coupon_id VARCHAR(255),
  coupon_discount DECIMAL(12, 2) DEFAULT 0,
  gift_card_id VARCHAR(255),
  gift_card_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_orders_payment_reference ON bubu.orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bubu_orders_status ON bubu.orders(status);
CREATE INDEX IF NOT EXISTS idx_bubu_orders_customer_id ON bubu.orders(customer_id);

-- =========================================================================
-- ORDER ITEMS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.order_items (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL REFERENCES bubu.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL REFERENCES bubu.products(id) ON DELETE CASCADE,
  variant_id VARCHAR(255) REFERENCES bubu.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_order_items_order_id ON bubu.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_bubu_order_items_product_id ON bubu.order_items(product_id);

-- =========================================================================
-- CONTACT MESSAGES
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.contact_messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================================
-- ADMIN USERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.admin_users (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================================
-- STORE SETTINGS  (key/value)
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.store_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO bubu.store_settings (setting_key, setting_value) VALUES
  ('store_name', 'Bubu Lagos'),
  ('store_email', 'hello@bubulagos.com'),
  ('store_phone', '+234 123 456 7890'),
  ('store_address', 'Lagos, Nigeria'),
  ('currency', 'NGN'),
  ('shipping_fee', '0')
ON CONFLICT (setting_key) DO NOTHING;

-- =========================================================================
-- GIFT CARDS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.gift_cards (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash TEXT UNIQUE NOT NULL,
  code_masked VARCHAR(20) NOT NULL,
  original_balance DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2) NOT NULL,
  expiry_date TIMESTAMP NOT NULL,
  status bubu.bubu_gift_card_status DEFAULT 'Active',
  customer_id VARCHAR(255) REFERENCES bubu.customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_gift_card_hash ON bubu.gift_cards(code_hash);
CREATE INDEX IF NOT EXISTS idx_bubu_gift_card_customer ON bubu.gift_cards(customer_id);

-- =========================================================================
-- GIFT CARD LOGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.gift_card_logs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id VARCHAR(255) NOT NULL REFERENCES bubu.gift_cards(id) ON DELETE CASCADE,
  order_id VARCHAR(255) REFERENCES bubu.orders(id) ON DELETE SET NULL,
  amount_used DECIMAL(12, 2) NOT NULL,
  balance_before DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================================================
-- COUPONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.coupons (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type bubu.bubu_coupon_type NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  min_order_amount DECIMAL(12, 2) DEFAULT 0,
  max_discount_amount DECIMAL(12, 2),
  expiry_date TIMESTAMP,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_coupon_code ON bubu.coupons(code);

-- =========================================================================
-- NEWSLETTER SUBSCRIBERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS bubu.newsletter_subscribers (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bubu_newsletter_email ON bubu.newsletter_subscribers(email);
