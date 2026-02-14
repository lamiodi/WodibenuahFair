DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='updated_at') THEN
        ALTER TABLE vendors ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
