import express from 'express';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';
import { sendProfessionalEmail } from '../services/emailTemplates.js';

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

    // Send email notification to Admin
    const adminEmail = 'Wodibenuah@yahoo.com'; // Hardcoded as per user request for now, or use ENV
    
    const emailContent = `
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">You have received a new inquiry via the website contact form.</p>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #D4AF37; margin: 20px 0;">
        <p style="margin: 0 0 10px; font-size: 14px; color: #555;"><strong>From:</strong> ${name} (<a href="mailto:${email}" style="color: #D4AF37; text-decoration: none;">${email}</a>)</p>
        <p style="margin: 0 0 10px; font-size: 14px; color: #555;"><strong>Type:</strong> ${inquiryType}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
        <p style="margin: 0; font-size: 15px; color: #333; white-space: pre-wrap;">${message}</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">You can reply directly to this email to contact the user.</p>
    `;

    await sendProfessionalEmail({
      to: adminEmail,
      subject: `New Inquiry: ${inquiryType} from ${name}`,
      title: 'New Contact Message',
      content: emailContent,
      actionLink: `mailto:${email}`,
      actionText: 'Reply to User'
    });

    res.status(201).json({ message: 'Message received successfully' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
