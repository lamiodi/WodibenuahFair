-- Add payment_link_sent_at and payment_link_sent_count to vendors table safely
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMP;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_link_sent_count INTEGER DEFAULT 0;
