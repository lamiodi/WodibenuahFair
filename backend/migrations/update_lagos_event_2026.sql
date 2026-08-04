-- Update Lagos event to 2026 date and venue
UPDATE events 
SET 
  title = 'Wodibenuah Fair Lagos 2026',
  location = 'The Five Palm Oniru, Lagos',
  start_date = '2026-12-13 10:00:00',
  end_date = '2026-12-13 22:00:00',
  status = 'upcoming',
  is_registration_open = true,
  is_featured = true
WHERE location LIKE '%Lagos%' OR title LIKE '%Lagos%';

