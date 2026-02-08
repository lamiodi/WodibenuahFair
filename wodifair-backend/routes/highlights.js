import express from 'express';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all highlights
router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM highlights ORDER BY display_order ASC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Create Highlight
router.post('/', authenticateToken, validate([
  body('title').trim().notEmpty().escape(),
  body('description').trim().notEmpty(),
  body('imageUrl').trim().notEmpty(),
  body('badge').trim().notEmpty().escape()
]), async (req, res) => {
  const { title, description, imageUrl, badge, displayOrder } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO highlights (title, description, image_url, badge, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, imageUrl, badge, displayOrder || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating highlight:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin: Update Highlight
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, imageUrl, badge, displayOrder } = req.body;
    try {
      const result = await pool.query(
        'UPDATE highlights SET title = $1, description = $2, image_url = $3, badge = $4, display_order = $5 WHERE id = $6 RETURNING *',
        [title, description, imageUrl, badge, displayOrder, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Highlight not found' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating highlight:', error);
      res.status(500).json({ error: 'Database error' });
    }
});

export default router;
