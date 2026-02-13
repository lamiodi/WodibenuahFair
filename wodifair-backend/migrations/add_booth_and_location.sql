-- Add booth_type column to vendors table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='booth_type') THEN
        ALTER TABLE vendors ADD COLUMN booth_type VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='selected_location') THEN
        ALTER TABLE vendors ADD COLUMN selected_location VARCHAR(100);
    END IF;
END $$;
