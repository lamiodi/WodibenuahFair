-- Ensure Wodibenuah Fair Lagos 2026 event exists and is active
DO $$
BEGIN
    -- If no Lagos event exists, insert it
    IF NOT EXISTS (SELECT 1 FROM events WHERE location ILIKE '%Lagos%' OR title ILIKE '%Lagos%') THEN
        -- Unset featured on older events
        UPDATE events SET is_featured = FALSE;

        INSERT INTO events (
            title, location, start_date, end_date, description,
            image_url, status, is_registration_open, is_featured
        ) VALUES (
            'Wodibenuah Fair Lagos 2026',
            'The Five Palm Oniru, Lagos',
            '2026-12-13 10:00:00',
            '2026-12-13 22:00:00',
            'The premier cultural and vendor exhibition in Lagos featuring top brands, fashion showcases, and curated shopping experiences.',
            'https://res.cloudinary.com/dwmz4youk/image/upload/v1779310064/wodifair/Gemini_Generated_Image_euj3e6euj3e6euj3.png',
            'upcoming',
            TRUE,
            TRUE
        );
    ELSE
        -- Ensure existing Lagos event is marked upcoming, open, and featured
        UPDATE events 
        SET 
            status = 'upcoming',
            is_registration_open = TRUE,
            is_featured = TRUE
        WHERE location ILIKE '%Lagos%' OR title ILIKE '%Lagos%';

        -- Unset featured on any non-Lagos events
        UPDATE events 
        SET is_featured = FALSE 
        WHERE location NOT ILIKE '%Lagos%' AND title NOT ILIKE '%Lagos%';
    END IF;
END $$;
