import express from 'express';
import crypto from 'crypto';
import { processSuccessfulPayment } from '../services/paymentService.js';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

router.post('/paystack', async (req, res) => {
    try {
        // Fail fast if the global express.json() verify callback isn't
        // wired up. server.js:103-109 always sets req.rawBody, so under
        // normal operation we never reach this branch — if we do, it's
        // a server misconfig that should NOT be silently papered over
        // with a JSON.stringify(req.body) fallback (the byte
        // representation of the parsed object is not guaranteed to
        // match the original body Paystack signed, so the HMAC would
        // silently never match and every event would 400). Loud 500
        // is the correct response.
        if (!Buffer.isBuffer(req.rawBody)) {
            console.error('webhook misconfig: req.rawBody is not a Buffer');
            return res.status(500).send('Server misconfigured: req.rawBody is not a Buffer');
        }

        // Verify the HMAC SHA-512 signature over the EXACT raw bytes
        // Paystack sent. This is the only correct way — re-serialising
        // req.body (JSON.stringify) is not byte-equal to the original
        // and the signature will not match.
        const expected = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY)
            .update(req.rawBody)
            .digest('hex');

        const signature = req.headers['x-paystack-signature'];
        if (!signature || expected !== signature) {
            return res.status(400).send('Invalid signature');
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
                const result = await processSuccessfulPayment(reference, amountPaid, identifier, isEmailLookup);
                // processSuccessfulPayment returns { status: 'success' | 'already_paid', vendor }
                // Either way the webhook should ack Paystack with 200.
                console.log(`Payment ${result.status} via webhook for ${email}`);
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
