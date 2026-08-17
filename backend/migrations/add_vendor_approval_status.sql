-- Add approval status to vendors table safely
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';

-- Automatically mark all paid vendors as approved
UPDATE vendors 
SET is_approved = TRUE, approval_status = 'approved'
WHERE payment_status = 'paid' AND (approval_status IS NULL OR approval_status = 'pending');
