import pool from '../db.js';
import axios from 'axios';
import { generateInvoice } from '../utils/invoiceGenerator.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const processSuccessfulPayment = async (reference, amountPaid, vendorIdOrEmail, isEmail = false) => {
  try {
    // Find Vendor
    let vendorQuery;
    let vendorParams;

    if (isEmail) {
      vendorQuery = 'SELECT * FROM vendors WHERE email = $1';
      vendorParams = [vendorIdOrEmail];
    } else {
      vendorQuery = 'SELECT * FROM vendors WHERE id = $1';
      vendorParams = [vendorIdOrEmail];
    }

    const vendorResult = await pool.query(vendorQuery, vendorParams);
    if (vendorResult.rows.length === 0) {
      throw new Error(`Vendor not found: ${vendorIdOrEmail}`);
    }

    const vendor = vendorResult.rows[0];

    // Validate Payment Amount
    const boothPrices = {
      'Shared Booth': 80000,
      'Full Booth': 150000,
      'Half Booth': 190000,
      'Food Slot': 300000
    };
    
    // Default to a base price if not found (or throw error). 
    // Given the critical nature, we should log a warning if type mismatches, but let's strictly enforce if known.
    const expectedAmount = boothPrices[vendor.booth_type];
    
    if (expectedAmount && amountPaid < expectedAmount) {
       console.warn(`Insufficient payment attempt for ${vendor.email}. Expected: ${expectedAmount}, Paid: ${amountPaid}`);
       throw new Error(`Insufficient payment. Expected ₦${expectedAmount}, but received ₦${amountPaid}.`);
    }

    // Check if already paid
    if (vendor.payment_status === 'paid') {
      console.log(`Vendor ${vendor.email} already marked as paid.`);
      return { status: 'already_paid', vendor };
    }

    // Update Vendor
    const updateQuery = `
      UPDATE vendors 
      SET payment_status = 'paid', 
          payment_reference = $1, 
          amount_paid = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    
    const updateResult = await pool.query(updateQuery, [reference, amountPaid, vendor.id]);
    const updatedVendor = updateResult.rows[0];

    // Generate Invoice PDF
    let pdfBuffer;
    try {
      pdfBuffer = await generateInvoice(updatedVendor, { reference, amount: amountPaid });
    } catch (pdfError) {
      console.error('Error generating PDF invoice:', pdfError);
      // Continue without PDF if fails, but log it
    }

    // Send Email
    try {
      const emailPayload = {
        from: 'Wodibenuah Fair <onboarding@resend.dev>',
        to: [updatedVendor.email],
        subject: 'Payment Receipt & Invoice - Wodibenuah Fair 2026',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #D4AF37;">Payment Confirmed</h1>
            <p>Dear ${updatedVendor.full_name},</p>
            <p>Thank you for your payment of <strong>₦${amountPaid.toLocaleString()}</strong>.</p>
            <p>Your vendor application for <strong>${updatedVendor.business_name}</strong> has been successfully processed.</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <br/>
            <p>Please find your invoice attached.</p>
            <p>We will review your details and get back to you with further instructions.</p>
            <p>Best regards,<br/>Wodibenuah Fair Team</p>
          </div>
        `,
        attachments: pdfBuffer ? [
          {
            filename: `Invoice-${reference}.pdf`,
            content: pdfBuffer.toString('base64') // Resend expects base64 or buffer? Check docs. Usually buffer works or base64 string.
            // Resend Node SDK accepts buffer directly in `content` but REST API might need base64.
            // Using axios to call REST API directly as in original code:
            // "attachments": [{"content": "...", "filename": "..."}]
            // The content must be a Buffer or a Stream or a String. If String, it is treated as raw content.
            // If using Resend API directly, `content` should be an array of bytes (integers) or base64 string?
            // Re-checking Resend API docs: "The content of the attached file. ... If you are using the API directly, you should base64 encode the content."
          } 
        ] : [] 
      };

      // Resend API expects base64 string for content if using REST API directly?
      // Actually, standard practice for JSON APIs is base64 for binary data.
      // So .toString('base64') is correct.

      await axios.post('https://api.resend.com/emails', emailPayload, {
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Receipt sent to ${updatedVendor.email}`);
    } catch (emailError) {
      console.error('Error sending receipt email:', emailError.response ? emailError.response.data : emailError.message);
    }

    return { status: 'success', vendor: updatedVendor };

  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
