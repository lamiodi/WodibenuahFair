import pool from '../db.js';
import { sendWithAttachments, sendProfessionalEmail } from './emailTemplates.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';
import { BOOTH_PRICES } from '../config/pricing.js';

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
    const expectedAmount = Number(BOOTH_PRICES[vendor.booth_type]);
    const paidAmount = Number(amountPaid);
    
    if (expectedAmount && paidAmount < expectedAmount) {
       console.warn(`Insufficient payment attempt for ${vendor.email}. Expected: ${expectedAmount}, Paid: ${paidAmount}`);
       throw new Error(`Insufficient payment. Expected ₦${expectedAmount.toLocaleString()}, but received ₦${paidAmount.toLocaleString()}.`);
    }

    // Check if already paid
    if (vendor.payment_status === 'paid') {
      console.log(`Vendor ${vendor.email} already marked as paid.`);
      // If already paid, we might want to resend the email if requested, 
      // but typically we just return success to avoid double processing.
      // However, if the email failed the first time, this prevents retrying.
      // Ideally, we should check if 'email_sent' flag exists (if we had one).
      // For now, we return early to be safe against double accounting.
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
      const emailContent = `
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Dear <span style="color: #000000; font-weight: bold;">${updatedVendor.full_name}</span>,</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">We are thrilled to confirm your payment of <span style="color: #000000; font-weight: bold;">₦${amountPaid.toLocaleString()}</span>.</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Your vendor application for <span style="color: #000000; font-weight: bold;">${updatedVendor.business_name}</span> has been successfully processed for the <strong>${updatedVendor.booth_type}</strong>.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #D4AF37; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #555;"><strong>Payment Reference:</strong> ${reference}</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Please find your official invoice attached to this email.</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Our team will review your details and contact you shortly with setup instructions.</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Best regards,<br/>The Wodibenuah Fair Team</p>
      `;

      await sendWithAttachments({
        to: [updatedVendor.email],
        subject: 'Payment Receipt & Invoice - Wodibenuah Fair 2026',
        title: 'Payment Confirmed',
        content: emailContent,
        attachments: pdfBuffer ? [
          {
            filename: `Invoice-${reference}.pdf`,
            content: pdfBuffer.toString('base64')
          }
        ] : []
      });
      
      // Send Notification to Admin
      try {
        const adminEmail = 'Wodibenuah@yahoo.com';
        const adminContent = `
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">A new vendor has completed their registration and payment.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 10px 0; color: #555;">Business Name:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #000;">${updatedVendor.business_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 10px 0; color: #555;">Contact Name:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #000;">${updatedVendor.full_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 10px 0; color: #555;">Email:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #000;">${updatedVendor.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 10px 0; color: #555;">Phone:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #000;">${updatedVendor.phone_number}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 10px 0; color: #555;">Booth Type:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #000;">${updatedVendor.booth_type}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eeeeee;">
              <td style="padding: 10px 0; color: #555;">Amount Paid:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #D4AF37;">₦${amountPaid.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #555;">Reference:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #000;">${reference}</td>
            </tr>
          </table>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Login to the admin dashboard to view full details.</p>
        `;

        await sendProfessionalEmail({
          to: adminEmail,
          subject: `New Vendor Registration: ${updatedVendor.business_name}`,
          title: 'New Vendor Paid',
          content: adminContent,
          actionLink: `${process.env.ADMIN_URL || 'https://wodibenuahfair.org'}/admin`,
          actionText: 'View Dashboard'
        });
        console.log(`Admin notification sent to ${adminEmail}`);
      } catch (adminEmailError) {
        console.error('Error sending admin notification:', adminEmailError);
      }

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't throw, just log
    }

    return { status: 'success', vendor: updatedVendor };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
