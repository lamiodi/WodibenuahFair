import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { processSuccessfulPayment } from '../services/paymentService.js';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

router.post('/paystack', async (req, res) => {
    try {
        // Fail fast if the global express.json() verify callback isn't wired up.
        if (!Buffer.isBuffer(req.rawBody)) {
            console.error('Webhook misconfiguration: req.rawBody is not a Buffer');
            return res.status(500).send('Server misconfigured: req.rawBody is not a Buffer');
        }

        // Verify the HMAC SHA-512 signature over the EXACT raw bytes Paystack sent.
        const expected = crypto
            .createHmac('sha512', PAYSTACK_SECRET_KEY || '')
            .update(req.rawBody)
            .digest('hex');

        const signature = req.headers['x-paystack-signature'];
        if (!signature || expected !== signature) {
            return res.status(400).send('Invalid signature');
        }

        const event = typeof req.body === 'object' && req.body !== null 
            ? req.body 
            : JSON.parse(req.rawBody.toString('utf8'));

        if (event.event === 'charge.success') {
            const data = event.data || {};
            const reference = data.reference;
            const amount = data.amount || 0;
            const customer = data.customer || {};
            const email = customer.email;

            // Paystack metadata can be an object or a JSON string depending on channel
            let metadata = data.metadata;
            if (typeof metadata === 'string') {
                try { metadata = JSON.parse(metadata); } catch { metadata = {}; }
            }
            metadata = metadata || {};

            console.log(`[Paystack Webhook] Received charge.success for ref: ${reference}, email: ${email}`);

            // Determine whether this is an ERP transaction or a Vendor payment
            const isErpReference = reference && (
                reference.startsWith('POS-') ||
                metadata.saleId ||
                metadata.shiftId ||
                metadata.source === 'erp' ||
                metadata.source === 'retail'
            );

            let isErp = Boolean(isErpReference);

            // If not clearly identified by metadata/prefix, check if reference exists in ERP transactions
            if (!isErp && !metadata.vendorId) {
                try {
                    const erpCheck = await pool.query(
                        'SELECT 1 FROM erp.paystack_transactions WHERE reference = $1',
                        [reference]
                    );
                    if (erpCheck.rows.length > 0) {
                        isErp = true;
                    }
                } catch {
                    // ERP schema might not be initialized or query failed; fall through
                }
            }

            if (isErp) {
                // Route to ERP transaction processor
                try {
                    const { processErpPaystackEvent } = await import('./erp.js');
                    const erpResult = await processErpPaystackEvent(event);
                    console.log(`[Paystack Webhook] ERP transaction processed: ${erpResult.status} for ref: ${reference}`);
                } catch (erpErr) {
                    console.error(`[Paystack Webhook] Error processing ERP payment for ref ${reference}:`, erpErr);
                }
            } else {
                // Route to Vendor booth payment processor
                const vendorId = metadata.vendorId || null;
                const identifier = vendorId || email;
                const isEmailLookup = !vendorId;
                const amountPaid = amount / 100; // kobo to Naira

                if (!identifier) {
                    console.warn(`[Paystack Webhook] Cannot process vendor payment: missing vendorId and email for ref ${reference}`);
                    return res.sendStatus(200);
                }

                try {
                    const result = await processSuccessfulPayment(reference, amountPaid, identifier, isEmailLookup);
                    console.log(`[Paystack Webhook] Vendor payment ${result.status} for ${identifier} (ref: ${reference})`);
                } catch (vendorErr) {
                    console.error(`[Paystack Webhook] Failed to process vendor payment for ${identifier}:`, vendorErr.message);
                }
            }
        }

        // Always acknowledge Paystack with 200 to avoid infinite retries
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook Error:', error);
        res.sendStatus(500);
    }
});

export default router;
