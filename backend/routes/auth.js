import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// Register Admin
router.post('/register', validate([
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('adminSecret').exists().withMessage('Admin secret required')
]), async (req, res) => {
  const { email, password, adminSecret } = req.body;
  
  if (adminSecret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized: Invalid admin secret' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
router.post('/login', validate([
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
]), async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    
    // Log login action
    await pool.query('INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)', 
      [user.id, 'LOGIN', req.ip]);

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
