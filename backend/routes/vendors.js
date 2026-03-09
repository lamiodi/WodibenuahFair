import express from 'express';
import axios from 'axios';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import { processSuccessfulPayment } from '../services/paymentService.js';
import { sendProfessionalEmail } from '../services/emailTemplates.js';
import { BOOTH_PRICES } from '../config/pricing.js';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Get Booth Prices (Public)
router.get('/prices', (req, res) => {
  res.json(BOOTH_PRICES);
});

// Get All Vendors (Protected)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Register Vendor
router.post('/register', validate([
  body('email').isEmail().normalizeEmail(),
  body('fullName').trim().notEmpty().escape(),
  body('phoneNumber').trim().notEmpty().escape(),
  body('whatsappNumber').trim().notEmpty().escape(),
  body('instagramHandle').trim().notEmpty().escape(),
  body('businessName').trim().notEmpty().escape(),
  body('sector').trim().notEmpty().escape(),
  body('boothType').trim().notEmpty().escape(),
  body('selectedLocation').trim().notEmpty().escape(),
  body('isPreviousVendor').isBoolean(),
  body('liveInAbuja').isBoolean(),
  body('categoryAccepted').isBoolean(),
  body('agreeToMarket').isBoolean(),
  body('agreeToWhatsapp').isBoolean(),
  body('agreeToTerms').isBoolean(),
  body('eventId').optional({ checkFalsy: true }).isInt(),
  body('boothType').trim().notEmpty().escape(),
  body('selectedLocation').trim().notEmpty().escape()
]), async (req, res, next) => {
  const {
    email, fullName, phoneNumber, whatsappNumber, instagramHandle,
    businessName, sector, boothType, selectedLocation, isPreviousVendor, liveInAbuja,
    categoryAccepted, agreeToMarket, agreeToWhatsapp, agreeToTerms, eventId
  } = req.body;

  try {
    // Check for existing registration
    const existingVendor = await pool.query('SELECT * FROM vendors WHERE email = $1', [email]);
    if (existingVendor.rows.length > 0) {
      const vendor = existingVendor.rows[0];
      if (vendor.payment_status === 'paid') {
        return res.status(409).json({ error: 'This email is already registered and paid.' });
      } else {
        // If pending, we can update their details or just return the existing ID to let them pay
        // Updating details is safer in case they changed booth type
        const updateQuery = `
          UPDATE vendors SET
            full_name = $2, phone_number = $3, whatsapp_number = $4, instagram_handle = $5,
            business_name = $6, sector = $7, booth_type = $8, selected_location = $9, 
            is_previous_vendor = $10, live_in_abuja = $11, category_accepted = $12, 
            agree_to_market = $13, agree_to_whatsapp = $14, agree_to_terms = $15, event_id = $16,
            updated_at = NOW()
          WHERE email = $1
          RETURNING *;
        `;
        const updateValues = [
          email, fullName, phoneNumber, whatsappNumber, instagramHandle,
          businessName, sector, boothType, selectedLocation, isPreviousVendor, liveInAbuja,
          categoryAccepted, agreeToMarket, agreeToWhatsapp, agreeToTerms, eventId
        ];

        const updatedResult = await pool.query(updateQuery, updateValues);

        // Email removed as per request - feedback is shown on frontend instead

        return res.status(200).json({ message: 'Registration updated', vendor: updatedResult.rows[0] });
      }
    }

    const query = `
      INSERT INTO vendors (
        email, full_name, phone_number, whatsapp_number, instagram_handle,
        business_name, sector, booth_type, selected_location, is_previous_vendor, live_in_abuja,
        category_accepted, agree_to_market, agree_to_whatsapp, agree_to_terms, event_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

    const values = [
      email, fullName, phoneNumber, whatsappNumber, instagramHandle,
      businessName, sector, boothType, selectedLocation, isPreviousVendor, liveInAbuja,
      categoryAccepted, agreeToMarket, agreeToWhatsapp, agreeToTerms, eventId
    ];

    const result = await pool.query(query, values);

    // Email removed as per request - feedback is shown on frontend instead

    res.status(201).json({ message: 'Vendor registered successfully', vendor: result.rows[0] });
  } catch (error) {
    console.error('Error registering vendor:', error);
    next(error);
  }
});

// Verify Payment
router.post('/verify-payment', validate([
  body('reference').trim().notEmpty().escape(),
  body('vendorId').isInt()
]), async (req, res) => {
  const { reference, vendorId } = req.body;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const data = response.data;

    if (data.status && data.data.status === 'success') {
      // Amount is in kobo from Paystack, convert to Naira
      const amountPaid = data.data.amount / 100;

      try {
        const result = await processSuccessfulPayment(reference, amountPaid, vendorId);
        res.json({
          status: 'success',
          message: 'Payment verified successfully',
          vendor: result.vendor
        });
      } catch (err) {
        console.error('Error processing payment via service:', err);
        res.status(500).json({ status: 'error', message: 'Error processing payment record' });
      }
    } else {
      res.status(400).json({ status: 'error', message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Public: Get Approved Vendors
router.get('/public', async (req, res) => {
  try {
    // Only fetch paid vendors
    const result = await pool.query(`
      SELECT business_name, full_name, sector, instagram_handle 
      FROM vendors 
      WHERE payment_status = 'paid' 
      ORDER BY business_name ASC
    `);

    // Transform to match frontend structure (add placeholders for missing images/details)
    const vendors = result.rows.map(v => ({
      name: v.business_name,
      category: v.sector,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop", // Default placeholder
      booth: "TBD" // Placeholder
    }));

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching public vendors:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
