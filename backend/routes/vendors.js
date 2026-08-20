import express from 'express';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import pool from '../db.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import { processSuccessfulPayment } from '../services/paymentService.js';
import { sendProfessionalEmail } from '../services/emailTemplates.js';
import { BOOTH_PRICES } from '../config/pricing.js';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Dedicated rate limiter for public lookup to prevent vendor email harvesting
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 lookup attempts per IP per 15 minutes
  message: { error: 'Too many lookup requests. Please try again later.' }
});

// Dedicated rate limiter for verify-payment to prevent reference brute-force
const verifyPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many verification requests. Please try again later.' }
});

// Public: Lookup Vendor for Payment
router.post('/lookup', lookupLimiter, validate([
  body('email').isEmail().normalizeEmail()
]), async (req, res, next) => {
  const { email } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, business_name, booth_type, selected_location, payment_status, amount_paid FROM vendors WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No registration found with this email.' });
    }
    res.json({ vendor: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get Booth Prices (Public)
router.get('/prices', (req, res) => {
  res.json(BOOTH_PRICES);
});

// Get All Vendors (Protected) with Pagination
router.get('/', authenticateToken, async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    // Get total count for pagination info
    const countResult = await pool.query('SELECT COUNT(*) FROM vendors');
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated data
    const result = await pool.query(
      'SELECT * FROM vendors ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      vendors: result.rows,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
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
  body('liveInAbuja').optional().isBoolean(),
  body('liveInLagos').optional().isBoolean(),
  body('categoryAccepted').isBoolean(),
  body('agreeToMarket').isBoolean(),
  body('agreeToWhatsapp').isBoolean(),
  body('agreeToTerms').isBoolean(),
  body('eventId').optional({ checkFalsy: true }).isInt()
]), async (req, res, next) => {
  let {
    email, fullName, phoneNumber, whatsappNumber, instagramHandle,
    businessName, sector, boothType, selectedLocation, isPreviousVendor, liveInAbuja, liveInLagos,
    categoryAccepted, agreeToMarket, agreeToWhatsapp, agreeToTerms, eventId
  } = req.body;

  // Ensure eventId is null if it's an empty string (to avoid Postgres integer type errors)
  eventId = eventId || null;

  // Handle either liveInLagos or liveInAbuja
  const isLocalResident = Boolean(liveInLagos !== undefined ? liveInLagos : (liveInAbuja !== undefined ? liveInAbuja : false));

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
          businessName, sector, boothType, selectedLocation, isPreviousVendor, isLocalResident,
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
      businessName, sector, boothType, selectedLocation, isPreviousVendor, isLocalResident,
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
router.post('/verify-payment', verifyPaymentLimiter, validate([
  body('reference').trim().notEmpty().escape(),
  body('vendorId').isInt()
]), async (req, res) => {
  const { reference, vendorId } = req.body;

  try {
    // 1. Fetch the target vendor record
    const vendorRes = await pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    }
    const targetVendor = vendorRes.rows[0];

    // 2. Query Paystack
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    const data = response.data;

    if (data.status && data.data.status === 'success') {
      // 3. Verify that Paystack transaction matches this vendor (by email or metadata vendorId)
      const paystackCustomerEmail = (data.data.customer?.email || '').toLowerCase().trim();
      const vendorEmail = (targetVendor.email || '').toLowerCase().trim();

      let paystackMetadata = data.data.metadata;
      if (typeof paystackMetadata === 'string') {
        try { paystackMetadata = JSON.parse(paystackMetadata); } catch { paystackMetadata = {}; }
      }
      const metadataVendorId = paystackMetadata?.vendorId;

      const matchesId = metadataVendorId && Number(metadataVendorId) === Number(vendorId);
      const matchesEmail = paystackCustomerEmail && paystackCustomerEmail === vendorEmail;

      if (!matchesId && !matchesEmail) {
        console.warn(`Security alert: Reference ${reference} belongs to '${paystackCustomerEmail}' (meta vendorId: ${metadataVendorId}), but was submitted for vendor ${vendorId} ('${vendorEmail}')`);
        return res.status(403).json({
          status: 'error',
          message: 'Payment verification failed: Transaction does not match this vendor account.'
        });
      }

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
        res.status(400).json({ status: 'error', message: err.message || 'Error processing payment record' });
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

// Protected: Send Payment Link Email to Vendor
router.post('/:id/send-payment-link', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = result.rows[0];
    const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'https://wodibenuahfair.org';
    const paymentLink = `${clientUrl}/complete-payment?email=${encodeURIComponent(vendor.email)}`;

    const content = `
      <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">Dear <strong style="color: #000000;">${vendor.full_name || vendor.business_name}</strong>,</p>
      <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">Thank you for registering your business (<strong style="color: #000000;">${vendor.business_name}</strong>) for <strong>Wodibenuah Fair Lagos 2026</strong>.</p>
      <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">Your registration application has been reviewed and approved for your selected booth type (<strong>${vendor.booth_type}</strong>).</p>
      <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 20px;">Please click the button below to complete your payment securely and lock in your preferred booth space.</p>
    `;

    const emailResult = await sendProfessionalEmail({
      to: vendor.email,
      subject: 'Wodibenuah Fair Lagos 2026 - Official Vendor Payment Link',
      title: 'Complete Your Booth Payment',
      content,
      actionLink: paymentLink,
      actionText: 'COMPLETE PAYMENT NOW'
    });

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Failed to send email. Please check server email settings.' });
    }

    // Record the timestamp and count of link dispatch & mark approved
    await pool.query(
      `UPDATE vendors 
       SET payment_link_sent_at = NOW(), 
           payment_link_sent_count = COALESCE(payment_link_sent_count, 0) + 1, 
           is_approved = TRUE,
           approval_status = 'approved',
           updated_at = NOW() 
       WHERE id = $1`,
      [vendor.id]
    );

    res.json({
      message: 'Payment link email sent successfully',
      email: vendor.email,
      payment_link_sent_at: new Date().toISOString(),
      is_approved: true,
      approval_status: 'approved'
    });
  } catch (error) {
    console.error('Error sending payment link email:', error);
    next(error);
  }
});

// Protected: Update Vendor Approval Status (Approve / Reject / Reset)
router.patch('/:id/status', authenticateToken, validate([
  body('approvalStatus').isIn(['approved', 'rejected', 'pending'])
]), async (req, res, next) => {
  const { id } = req.params;
  const { approvalStatus } = req.body;
  const isApproved = approvalStatus === 'approved';

  try {
    const result = await pool.query(
      `UPDATE vendors 
       SET approval_status = $1,
           is_approved = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [approvalStatus, isApproved, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({
      message: `Vendor status updated to ${approvalStatus}`,
      vendor: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating vendor approval status:', error);
    next(error);
  }
});

export default router;
