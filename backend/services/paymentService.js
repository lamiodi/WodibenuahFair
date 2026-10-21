import pool from '../db.js';
import { sendWithAttachments, sendProfessionalEmail } from './emailTemplates.js';
import { generateInvoice } from '../utils/invoiceGenerator.js';
import { BOOTH_PRICES, LEGACY_BOOTH_PRICES } from '../config/pricing.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Errors that retrying can NEVER fix (wrong vendor, duplicate charge,
// underpayment). The webhook handler uses this to decide: acknowledge
// with 200 (Paystack stops redelivering a doomed event) instead of 500
// (Paystack retries — right choice only for transient faults).
export class PaymentPermanentError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PaymentPermanentError';
    this.code = code;
    this.permanent = true;
  }
}

export const processSuccessfulPayment = async (reference, amountPaid, vendorIdOrEmail, isEmail = false) => {
  // We acquire a single dedicated client for the whole flow so the
  // FOR UPDATE row lock + status flip + side effects live inside one
  // transaction. If we used the pool here, the implicit transactions
  // on each .query() would commit independently, and a concurrent
  // webhook for the same reference could slip between SELECT and
  // UPDATE (the bug Fix #3 in the Wodifair hardening plan closes).
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find Vendor (locking). The lock is taken on the candidate row
    // (or two candidates, when looking up by email — but email is
    // UNIQUE in practice via app-level upsert). A second webhook
    // arriving for the same reference will block here until we
    // COMMIT below, then re-read the row and short-circuit on the
    // already-paid check.
    let vendorQuery;
    let vendorParams;

    let lookupEmail;
    if (isEmail) {
      // Case-insensitive on purpose — matches the /lookup and /register
      // semantics. An exact-case match here silently drops payments when
      // the Paystack customer email case differs from the stored row.
      lookupEmail = String(vendorIdOrEmail).toLowerCase().trim();
      vendorQuery = 'SELECT * FROM vendors WHERE LOWER(email) = $1 FOR UPDATE';
      vendorParams = [lookupEmail];
    } else {
      vendorQuery = 'SELECT * FROM vendors WHERE id = $1 FOR UPDATE';
      vendorParams = [vendorIdOrEmail];
    }

    let vendorResult = await client.query(vendorQuery, vendorParams);

    // Legacy fallback: rows created before normalizeEmail() was removed
    // may have Gmail dots (and +tags) stripped. If the exact address
    // misses and this is a Gmail address, retry the legacy dotless form.
    if (isEmail && vendorResult.rows.length === 0) {
      const [local, domain] = lookupEmail.split('@');
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        const legacyEmail = `${local.split('+')[0].replace(/\./g, '')}@${domain}`;
        if (legacyEmail !== lookupEmail) {
          vendorResult = await client.query(vendorQuery, [legacyEmail]);
        }
      }
    }

    if (vendorResult.rows.length === 0) {
      throw new PaymentPermanentError(`Vendor not found: ${vendorIdOrEmail}`, 'VENDOR_NOT_FOUND');
    }

    const vendor = vendorResult.rows[0];

    // Idempotency pre-check (layer 1 of 3). If this vendor was already
    // paid AND the stored reference matches the one Paystack just
    // re-delivered, we roll back the empty transaction and return
    // without re-sending email, re-generating the PDF, or even
    // re-issuing an UPDATE. The DB UNIQUE on payment_reference
    // (layer 3, see add_unique_vendor_payment_reference.sql) is the
    // last line of defence if layers 1 and 2 ever race.
    if (vendor.payment_status === 'paid') {
      if (vendor.payment_reference === reference) {
        // Same reference re-delivered (webhook retry, double verify):
        // true idempotent replay — do nothing.
        console.log(`Vendor ${vendor.email} already paid for reference ${reference}. Skipping duplicate.`);
        await client.query('ROLLBACK');
        return { status: 'already_paid', vendor };
      }
      // Paid with a DIFFERENT reference: the customer has been charged
      // twice. Never overwrite the first record — it is their proof of
      // payment for charge #1. Flag loudly; the second charge needs a
      // manual refund in the Paystack dashboard.
      console.error(`DOUBLE CHARGE: vendor ${vendor.email} already paid with ref ${vendor.payment_reference}; second charge ${reference} received. Refund needed.`);
      throw new PaymentPermanentError(
        `This registration is already paid (reference ${vendor.payment_reference}). A second payment (${reference}) was received and will be refunded — please contact Wodibenuah Fair support.`,
        'ALREADY_PAID_DIFFERENT_REF'
      );
    }

    // Validate Payment Amount
    // Determine price based on location.
    // Trim booth_type to guard against trailing whitespace stored in DB.
    const boothType = (vendor.booth_type || '').trim();
    const location = vendor.selected_location || 'Default';
    const priceConfig = BOOTH_PRICES[location] || BOOTH_PRICES['Default'] || {};
    const defaultPrices = BOOTH_PRICES['Default'] || {};

    let expectedAmount = Number(priceConfig[boothType]) || Number(defaultPrices[boothType]);

    // Check case-insensitive match if direct lookup missed
    if (!expectedAmount && boothType) {
      const cleanBoothType = boothType.toLowerCase();
      const matchKey = Object.keys(priceConfig).find(k => k.trim().toLowerCase() === cleanBoothType) ||
                       Object.keys(defaultPrices).find(k => k.trim().toLowerCase() === cleanBoothType);
      if (matchKey) {
        expectedAmount = Number(priceConfig[matchKey] || defaultPrices[matchKey]);
      }
    }

    // Retired booth types (e.g. 'Food Slot') are still held by existing
    // registrations — price them from the legacy map before giving up.
    if (!expectedAmount && boothType) {
      const legacyMatchKey = Object.keys(LEGACY_BOOTH_PRICES)
        .find(k => k.trim().toLowerCase() === boothType.toLowerCase());
      if (legacyMatchKey) {
        expectedAmount = Number(LEGACY_BOOTH_PRICES[legacyMatchKey]);
      }
    }

    // Reject unknown booth types explicitly rather than assuming lowest tier
    if (!expectedAmount || expectedAmount <= 0) {
      console.warn(`Unknown booth type '${vendor.booth_type}' for vendor ${vendor.email}. Price cannot be determined.`);
      await client.query('ROLLBACK');
      throw new Error(`Unrecognized booth type "${vendor.booth_type}". Please contact Wodibenuah Fair support.`);
    }

    const paidAmount = Number(amountPaid);

    if (paidAmount < expectedAmount) {
      console.warn(`Insufficient payment attempt for ${vendor.email}. Expected: ${expectedAmount}, Paid: ${paidAmount}`);
      await client.query('ROLLBACK');
      throw new PaymentPermanentError(`Insufficient payment. Expected ₦${expectedAmount.toLocaleString()}, but received ₦${paidAmount.toLocaleString()}.`, 'INSUFFICIENT_PAYMENT');
    }

    // Update Vendor (still inside the locked transaction).
    const updateQuery = `
      UPDATE vendors
      SET payment_status = 'paid',
          is_approved = TRUE,
          approval_status = 'approved',
          payment_reference = $1,
          amount_paid = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const updateResult = await client.query(updateQuery, [reference, amountPaid, vendor.id]);
    const updatedVendor = updateResult.rows[0];

    // Commit the status flip BEFORE doing the slow side effects
    // (PDF gen + email). Reason: those side effects take seconds and
    // can fail. We don't want to hold the row lock across them —
    // another webhook for the same reference should now short-circuit
    // on the (already-paid) check at the top, but if it arrives
    // mid-PDF-gen, the row is unlocked so it can read, see paid=true,
    // and bail. The PDF and email are best-effort from here on.
    await client.query('COMMIT');

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

      const adminEmail = process.env.ADMIN_EMAIL || 'Wodibenuah@yahoo.com';
      const defaultNotifyList = [adminEmail, 'bukolabc@gmail.com'];
      const envNotify = process.env.ADMIN_NOTIFY_EMAILS 
        ? process.env.ADMIN_NOTIFY_EMAILS.split(',').map(e => e.trim()).filter(Boolean)
        : [];
      const notifyEmails = Array.from(new Set([...defaultNotifyList, ...envNotify]));

      const recipients = Array.from(new Set([updatedVendor.email, ...notifyEmails]));

      await sendWithAttachments({
        to: recipients,
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
          to: notifyEmails,
          subject: `New Vendor Registration: ${updatedVendor.business_name}`,
          title: 'New Vendor Paid',
          content: adminContent,
          actionLink: `${process.env.ADMIN_URL || 'https://wodibenuahfair.org'}/admin`,
          actionText: 'View Dashboard'
        });
        console.log(`Admin notification sent to ${notifyEmails.join(', ')}`);
      } catch (adminEmailError) {
        console.error('Error sending admin notification:', adminEmailError);
      }

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't throw, just log
    }

    return { status: 'success', vendor: updatedVendor };
  } catch (error) {
    // Roll back if we're still inside a transaction (the COMMIT
    // throws no error but is idempotent; the ROLLBACK after a
    // successful COMMIT is a no-op per the PG protocol).
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    console.error('Error processing payment:', error);
    throw error;
  } finally {
    client.release();
  }
};
