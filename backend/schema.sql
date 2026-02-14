-- Create Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  whatsapp_number VARCHAR(50) NOT NULL,
  instagram_handle VARCHAR(100) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  is_previous_vendor BOOLEAN DEFAULT FALSE,
  live_in_abuja BOOLEAN DEFAULT FALSE,
  category_accepted BOOLEAN DEFAULT FALSE,
  agree_to_market BOOLEAN DEFAULT FALSE,
  agree_to_whatsapp BOOLEAN DEFAULT FALSE,
  agree_to_terms BOOLEAN DEFAULT FALSE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_reference VARCHAR(100),
  amount_paid DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Vendors Table
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);
CREATE INDEX IF NOT EXISTS idx_vendors_payment_status ON vendors(payment_status);

-- Create Users Table (for Admins/Staff)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- admin, viewer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  inquiry_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  description TEXT,
  image_url VARCHAR(255),
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, past
  is_registration_open BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safe column additions for events table (in case table already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_registration_open') THEN
        ALTER TABLE events ADD COLUMN is_registration_open BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_featured') THEN
        ALTER TABLE events ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create Blogs Table
CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(255),
  author_id INTEGER REFERENCES users(id),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Highlights Table
CREATE TABLE IF NOT EXISTS highlights (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(255),
  badge VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Highlights Data (if empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM highlights) THEN
        INSERT INTO highlights (title, description, image_url, badge, display_order) VALUES
        ('VIP Experience', 'Exclusive access to our premium lounge with complimentary champagne and networking opportunities.', 'https://images.unsplash.com/photo-1561053720-76cd73ff22c3?q=80&w=2070&auto=format&fit=crop', 'Premium', 1),
        ('Fashion Runway', 'Witness the latest trends from top designers in our signature fashion showcase.', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2070&auto=format&fit=crop', 'Exclusive', 2),
        ('Gourmet Dining', 'Savor exquisite culinary delights from world-class chefs and premium food vendors.', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop', 'Curated', 3);
    END IF;
END $$;
