import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey.includes('PLACEHOLDER')) {
  console.warn('WARNING: RESEND_API_KEY is missing or invalid. Email sending will be disabled.');
}

// Create a mock Resend client if key is missing
export const resend = (apiKey && !apiKey.includes('PLACEHOLDER')) 
  ? new Resend(apiKey) 
  : { 
      emails: { 
        send: async () => {
          console.log('Mock email sent (API key missing)');
          return { id: 'mock_id' };
        } 
      } 
    };

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const fromEmail = process.env.EMAIL_FROM || 'Wodibenuah Fair <onboarding@resend.dev>';
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
