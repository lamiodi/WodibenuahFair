import express from 'express';
import crypto from 'crypto';
import { processSuccessfulPayment } from '../services/paymentService.js';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

router.post('/paystack', async (req, res) => {
    try {
        // Validate event
        const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
        
        // If rawBody is available (better for verification), use it
        // But for now, let's rely on JSON.stringify(req.body) if rawBody isn't set yet, 
        // OR better, rely on req.rawBody if server.js is configured correctly.
        
        let signature = req.headers['x-paystack-signature'];
        
        // If server.js is configured with verify, use req.rawBody
        if (req.rawBody) {
            const rawHash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(req.rawBody).digest('hex');
            if (rawHash !== signature) {
                return res.status(400).send('Invalid signature');
            }
        } else {
            // Fallback (less reliable due to JSON formatting differences)
            if (hash !== signature) {
                 // Try one more time with standard JSON stringify
                 // If this fails, we really need rawBody. 
                 // Given the constraints, I will ensure server.js sets rawBody.
                 console.warn('Warning: req.rawBody not found. Webhook verification might be flaky.');
                 // For now, proceed if hash matches, else fail
                 return res.status(400).send('Invalid signature');
            }
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const { reference, amount, metadata, customer } = event.data;
            const email = customer.email;
            // Paystack metadata is sometimes nested or flat depending on how it was sent.
            // Our frontend sends it as { vendorId: ... } inside metadata object.
            const vendorId = metadata ? metadata.vendorId : null;
            
            // Amount comes in kobo, convert to Naira
            const amountPaid = amount / 100;

            console.log(`Webhook received for ${email}, reference: ${reference}`);

            // Process Payment
            // Note: If vendorId is missing, we fallback to email lookup.
            // We pass isEmail = true if we are using email.
            // If vendorId is present, we use it (isEmail = false).
            const identifier = vendorId || email;
            const isEmailLookup = !vendorId;

            try {
                await processSuccessfulPayment(reference, amountPaid, identifier, isEmailLookup);
                console.log(`Payment processed successfully via webhook for ${email}`);
            } catch (err) {
                console.error(`Failed to process payment via webhook for ${email}:`, err);
                // We still return 200 to Paystack to acknowledge receipt, 
                // but we might want to log this to an error tracking service.
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook Error:', error);
        res.sendStatus(500);
    }
});

export default router;
