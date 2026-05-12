import fs from 'fs';
import PDFDocument from 'pdfkit';
import path from 'path';

const outputPath = path.resolve('../Payment_Completion_Guide_For_PA.pdf');
const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(outputPath));

// Title
doc.fontSize(20).font('Helvetica-Bold').text('WODI BENUAH FAIR', { align: 'center' });
doc.fontSize(16).text('Vendor Payment Completion Guide', { align: 'center' });
doc.moveDown();

// Intro
doc.fontSize(12).font('Helvetica').text('This guide explains the process for vendors who have already submitted their registration form but skipped or failed the payment step. You can share this with your PA or vendors to help them complete their booth payment easily.', { align: 'justify' });
doc.moveDown(2);

// Steps
const steps = [
  {
    title: "Step 1: Go to the 'Complete Payment' Page",
    desc: "Navigate to the vendor registration page on the website. Look for the link that says 'Already registered but haven't paid? Click here to complete your payment'. Clicking this takes you to the dedicated payment recovery page."
  },
  {
    title: "Step 2: Enter the Registered Email Address",
    desc: "On the Complete Payment page, the vendor must type in the EXACT email address they used when they originally filled out the registration form. Click the 'Lookup Registration' button."
  },
  {
    title: "Step 3: Review Vendor Details",
    desc: "The system will search for the vendor's record. Once found, it will display their details on the screen, including their Business Name, selected Booth Type, Event Location, and the Total Amount Due. The vendor should review this to ensure it's correct."
  },
  {
    title: "Step 4: Proceed to Payment",
    desc: "Click the 'Proceed to Payment' button. This will open the secure Paystack payment window. The vendor can choose their preferred method to pay (ATM Card, Bank Transfer, USSD, etc.) and complete the transaction."
  },
  {
    title: "Step 5: Receive Confirmation & Invoice",
    desc: "Once the payment is successful, the page will show a 'Payment Successful!' message and redirect to a 'Thank You' screen. Instantly, an automatic email containing the official Payment Receipt and PDF Invoice is sent to the vendor's email address (and a copy is sent to the admin team)."
  }
];

steps.forEach(step => {
  doc.fontSize(14).font('Helvetica-Bold').text(step.title);
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text(step.desc, { align: 'justify' });
  doc.moveDown(1.5);
});

doc.moveDown();
doc.fontSize(10).font('Helvetica-Oblique').text('Note: If the email entered in Step 2 is not found, it means the vendor did not complete the initial registration form, or they are using a different email address.', { align: 'center' });

doc.end();
console.log('PDF generated successfully at ' + outputPath);