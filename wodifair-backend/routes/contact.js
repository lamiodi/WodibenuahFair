import express from 'express';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Admin: Get all messages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Contact Form Endpoint
router.post('/', validate([
  body('name').trim().notEmpty().escape(),
  body('email').isEmail().normalizeEmail(),
  body('inquiryType').trim().notEmpty().escape(),
  body('message').trim().notEmpty().escape()
]), async (req, res) => {
  const { name, email, inquiryType, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO contacts (name, email, inquiry_type, message) VALUES ($1, $2, $3, $4)',
      [name, email, inquiryType, message]
    );
    res.status(201).json({ message: 'Message received successfully' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
