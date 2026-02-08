import express from 'express';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all upcoming events
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE status = 'upcoming' ORDER BY start_date ASC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Public: Get next featured event
router.get('/next', async (req, res) => {
  try {
    // Priority: Featured upcoming event -> Earliest upcoming event
    const query = `
      SELECT * FROM events 
      WHERE status = 'upcoming' 
      ORDER BY is_featured DESC, start_date ASC 
      LIMIT 1
    `;
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json(null); // No upcoming events
    }
  } catch (error) {
    console.error('Error fetching next event:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Get all events (including past/drafts)
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY start_date DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin events:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Create Event
router.post('/', authenticateToken, validate([
  body('title').trim().notEmpty().escape(),
  body('location').trim().notEmpty().escape(),
  body('startDate').isISO8601(),
  body('description').trim().notEmpty()
]), async (req, res) => {
  const { title, location, mapLink, startDate, endDate, description, imageUrl, status, isRegistrationOpen, isFeatured } = req.body;
  try {
    // If setting as featured, unset others if desired (optional, but good UX)
    if (isFeatured) {
      await pool.query('UPDATE events SET is_featured = FALSE WHERE is_featured = TRUE');
    }

    const result = await pool.query(
      'INSERT INTO events (title, location, map_link, start_date, end_date, description, image_url, status, is_registration_open, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [title, location, mapLink, startDate, endDate, description, imageUrl, status || 'upcoming', isRegistrationOpen !== undefined ? isRegistrationOpen : true, isFeatured || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Update Event
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, location, mapLink, startDate, endDate, description, imageUrl, status, isRegistrationOpen, isFeatured } = req.body;
  try {
    // If setting as featured, unset others
    if (isFeatured) {
      await pool.query('UPDATE events SET is_featured = FALSE WHERE is_featured = TRUE AND id != $1', [id]);
    }

    const result = await pool.query(
      'UPDATE events SET title = $1, location = $2, map_link = $3, start_date = $4, end_date = $5, description = $6, image_url = $7, status = $8, is_registration_open = $9, is_featured = $10 WHERE id = $11 RETURNING *',
      [title, location, mapLink, startDate, endDate, description, imageUrl, status, isRegistrationOpen, isFeatured, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Delete Event
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
