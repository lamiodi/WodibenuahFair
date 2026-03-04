-- Update the Abuja event date to May 9-10, 2026
UPDATE events
SET start_date = '2026-05-09 10:00:00',
    end_date = '2026-05-10 18:00:00'
WHERE (title ILIKE '%Abuja%' OR location ILIKE '%Abuja%')
  AND EXTRACT(YEAR FROM start_date) = 2026;
