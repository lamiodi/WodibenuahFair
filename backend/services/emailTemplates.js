import { resend } from './emailService.js';

const CLIENT_URL = process.env.CLIENT_URL || 'https://wodibenuahfair.org';
const LOGO_URL = `${CLIENT_URL}/images/ceoimage.png`; // Using CEO image as logo placeholder if no dedicated logo found, or text fallback.
// Ideally, we should have a dedicated logo URL. Based on file list, 'Wodi SM (17).png' might be a logo, but spaces in URL are tricky.
// Let's use a text header styled beautifully if image fails, but try to point to a valid image.
// 'ceoimage.png' was seen in file list. Let's use a public hosted version if possible or relative.
// Email clients need absolute URLs. 

// Common Styles
const styles = {
  container: 'font-family: \'Helvetica Neue\', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333333;',
  header: 'background-color: #000000; padding: 30px 20px; text-align: center;',
  logoText: 'color: #ffffff; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; text-decoration: none;',
  body: 'padding: 40px 30px;',
  heading: 'color: #D4AF37; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;',
  text: 'font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #555555;',
  highlight: 'color: #000000; font-weight: bold;',
  button: 'display: inline-block; background-color: #D4AF37; color: #000000; padding: 14px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 0px; margin-top: 20px;',
  footer: 'background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee;',
  link: 'color: #D4AF37; text-decoration: none;'
};

const emailTemplate = (title, content, actionLink = null, actionText = null) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="${styles.container}">
        <!-- Header -->
        <div style="${styles.header}">
          <a href="${CLIENT_URL}" style="${styles.logoText}">WODIBENUAH FAIR</a>
        </div>
        
        <!-- Body -->
        <div style="${styles.body}">
          <h1 style="${styles.heading}">${title}</h1>
          ${content}
          
          ${actionLink ? `
            <div style="text-align: center; margin-top: 30px;">
              <a href="${actionLink}" style="${styles.button}">${actionText}</a>
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="${styles.footer}">
          <p>&copy; ${new Date().getFullYear()} Wodibenuah Fair. All rights reserved.</p>
          <p>
            <a href="${CLIENT_URL}" style="${styles.link}">Website</a> | 
            <a href="${CLIENT_URL}/contact" style="${styles.link}">Contact Support</a>
          </p>
          <p style="margin-top: 10px;">Lagos, Nigeria</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendProfessionalEmail = async ({ to, subject, title, content, actionLink, actionText }) => {
  const html = emailTemplate(title, content, actionLink, actionText);
  const fromEmail = process.env.EMAIL_FROM || 'Wodibenuah Fair <hello@wodibenuahfair.org>';
  
  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending professional email:', error);
    return { success: false, error };
  }
};

export const sendWithAttachments = async ({ to, subject, title, content, attachments }) => {
  const html = emailTemplate(title, content);
  const fromEmail = process.env.EMAIL_FROM || 'Wodibenuah Fair <hello@wodibenuahfair.org>';
  
  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      attachments
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email with attachments:', error);
    return { success: false, error };
  }
};
