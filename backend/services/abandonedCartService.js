import pool from '../db.js';
import { sendProfessionalEmail } from './emailTemplates.js';
import { BOOTH_PRICES } from '../config/pricing.js';

const sendAbandonedCartEmails = async () => {
  try {
    console.log('Running Abandoned Cart Recovery...');

    // Find vendors who registered > 1 hour ago but haven't paid
    // AND haven't been emailed yet (we need a flag for this, or check last_updated)
    // For simplicity, let's assume we run this once a day and check for vendors from the last 24h
    // Ideally, we'd add a column `abandoned_email_sent` to the vendors table.
    
    // For now, let's just log who we WOULD send to, or implement the column if possible.
    // Given the constraints, I will create a query that checks `created_at` and `payment_status`.
    
    const query = `
      SELECT * FROM vendors 
      WHERE payment_status = 'pending' 
      AND created_at < NOW() - INTERVAL '1 hour'
      AND created_at > NOW() - INTERVAL '24 hour'
      AND abandoned_email_sent = FALSE
    `;

    const result = await pool.query(query);
    const vendors = result.rows;

    console.log(`Found ${vendors.length} abandoned registrations.`);

    for (const vendor of vendors) {
      // Send Email
      const price = BOOTH_PRICES[vendor.booth_type] || 0;
      
      try {
        const content = `
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Hi <span style="color: #000000; font-weight: bold;">${vendor.full_name}</span>,</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">We noticed you started registering for the <strong>Wodibenuah Fair 2026</strong> but didn't complete your payment.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #D4AF37; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #555;"><strong>Pending Booth:</strong> ${vendor.booth_type}</p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #555;"><strong>Amount:</strong> ₦${price.toLocaleString()}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">Your spot is not reserved until payment is confirmed. Spaces are filling up fast!</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;">If you have any questions, simply reply to this email.</p>
        `;

        await sendProfessionalEmail({
          to: vendor.email,
          subject: 'Complete Your Wodibenuah Fair Registration',
          title: 'Don\'t Miss Out!',
          content: content,
          actionLink: `${process.env.CLIENT_URL || 'https://wodibenuahfair.org'}/register?email=${encodeURIComponent(vendor.email)}`,
          actionText: 'Complete Registration'
        });
        
        // Mark as sent
        await pool.query('UPDATE vendors SET abandoned_email_sent = TRUE WHERE id = $1', [vendor.id]);
        console.log(`Abandoned cart email sent to ${vendor.email}`);

      } catch (err) {
        console.error(`Failed to send email to ${vendor.email}`, err);
      }
    }

  } catch (error) {
    console.error('Error in Abandoned Cart Job:', error);
  }
};

export default sendAbandonedCartEmails;
