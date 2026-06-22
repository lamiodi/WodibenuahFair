/**
 * Webhook integration test — Wodifair backend.
 *
 * Closes the test-coverage gap on /api/webhooks/paystack. Before this
 * file, a regression in the signature verification, the FOR UPDATE
 * row lock, or the idempotency pre-check could ship to production
 * undetected.
 *
 * Strategy:
 *   - Mock axios (Resend is called via the Resend SDK which uses
 *     fetch; we use module mocks for it too, see jest.unstable_mockModule
 *     at the top).
 *   - Real DB: we register a vendor row directly, send a signed
 *     charge.success to the live Express app, then assert the row
 *     flipped to paid.
 *   - Idempotency: send the SAME body twice; the second must return
 *     200, must not re-update amount_paid, and must not send a second
 *     email (we assert on call count).
 *   - Bad signature: a request with a wrong x-paystack-signature must
 *     return 400 and must not touch the DB.
 *
 * Requires DATABASE_URL in the environment. Runs against a real PG
 * instance (the same initDb the server uses). The vendor row is
 * deleted in afterAll.
 */

import { jest } from '@jest/globals';
import crypto from 'crypto';
import request from 'supertest';

const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
};
const mockFetch = jest.fn();

jest.unstable_mockModule('axios', () => ({ default: mockAxios }));
// Resend v6 uses fetch under the hood; stub it so the email send is
// a no-op.
global.fetch = mockFetch;
mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'email_test' }) });

const { default: app } = await import('../server.js');
const { default: pool, initDb } = await import('../db.js');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'test_secret_key';
const VENDOR_BOOTH_AMOUNT_NAIRA = 80000; // Shared Booth, Abuja — matches BOOTH_PRICES

// Build a charge.success event with a known signature.
function buildSignedEvent(overrides = {}) {
  const body = {
    event: 'charge.success',
    data: {
      reference: overrides.reference || `BUBU-WEBHOOK-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      amount: overrides.amount ?? VENDOR_BOOTH_AMOUNT_NAIRA * 100, // kobo
      status: 'success',
      customer: { email: overrides.email || `webhook_test_${Date.now()}@example.com` },
      metadata: overrides.vendorId ? { vendorId: overrides.vendorId } : {},
    },
  };
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac('sha512', PAYSTACK_SECRET).update(raw).digest('hex');
  return { body, raw, sig };
}

describe('Paystack webhook hardening', () => {
  let testVendorId;
  let testEmail;

  beforeAll(async () => {
    await initDb();

    // Insert a real vendor row that the webhook will look up by id.
    testEmail = `webhook_test_${Date.now()}@example.com`;
    const insert = await pool.query(
      `INSERT INTO vendors (
         email, full_name, phone_number, whatsapp_number, instagram_handle,
         business_name, sector, booth_type, selected_location,
         is_previous_vendor, live_in_abuja, category_accepted,
         agree_to_market, agree_to_whatsapp, agree_to_terms
       ) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        testEmail, 'Webhook Test Vendor', '08000000000', '@webhook',
        'Webhook Test Biz', 'Fashion', 'Shared Booth', 'Abuja',
        false, true, true, true, true, true,
      ]
    );
    testVendorId = insert.rows[0].id;
  });

  afterAll(async () => {
    if (testVendorId) {
      // Use a SAVEPOINT-style cleanup: best-effort. The DB may have
      // already been torn down by other tests; ignore failures.
      try { await pool.query('DELETE FROM vendors WHERE id = $1', [testVendorId]); } catch { /* */ }
    }
    try { await pool.end(); } catch { /* */ }
  });

  beforeEach(() => {
    mockAxios.get.mockReset();
    mockAxios.post.mockReset();
    mockFetch.mockClear();
  });

  it('returns 400 on missing/invalid signature and does not update the vendor', async () => {
    const { body, raw } = buildSignedEvent({ vendorId: testVendorId });
    const before = await pool.query('SELECT payment_status, payment_reference, amount_paid FROM vendors WHERE id = $1', [testVendorId]);

    const res = await request(app)
      .post('/api/webhooks/paystack')
      .set('x-paystack-signature', 'deadbeef'.repeat(8))
      .set('content-type', 'application/json')
      .send(raw);

    expect(res.statusCode).toBe(400);

    const after = await pool.query('SELECT payment_status, payment_reference, amount_paid FROM vendors WHERE id = $1', [testVendorId]);
    expect(after.rows[0]).toEqual(before.rows[0]);
  });

  it('returns 200 and flips the vendor to paid on a valid charge.success', async () => {
    const { body, raw, sig } = buildSignedEvent({ vendorId: testVendorId });

    const res = await request(app)
      .post('/api/webhooks/paystack')
      .set('x-paystack-signature', sig)
      .set('content-type', 'application/json')
      .send(raw);

    expect(res.statusCode).toBe(200);

    const after = await pool.query('SELECT payment_status, payment_reference, amount_paid FROM vendors WHERE id = $1', [testVendorId]);
    expect(after.rows[0].payment_status).toBe('paid');
    expect(after.rows[0].payment_reference).toBe(body.data.reference);
    expect(parseFloat(after.rows[0].amount_paid)).toBe(VENDOR_BOOTH_AMOUNT_NAIRA);
  });

  it('is idempotent: replaying the same charge.success does not double-update or re-send', async () => {
    // Use a fresh vendor so the previous test's 'paid' state doesn't
    // short-circuit before we can observe the duplicate behaviour.
    const email = `idempotency_${Date.now()}@example.com`;
    const v = await pool.query(
      `INSERT INTO vendors (
         email, full_name, phone_number, whatsapp_number, instagram_handle,
         business_name, sector, booth_type, selected_location,
         is_previous_vendor, live_in_abuja, category_accepted,
         agree_to_market, agree_to_whatsapp, agree_to_terms
       ) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        email, 'Idempotency Test', '08000000001', '@idemp',
        'Idempotency Biz', 'Fashion', 'Shared Booth', 'Abuja',
        false, true, true, true, true, true,
      ]
    );
    const vendorId = v.rows[0].id;

    const { raw, sig, body } = buildSignedEvent({ vendorId, amount: VENDOR_BOOTH_AMOUNT_NAIRA * 100 });

    // First delivery
    const r1 = await request(app)
      .post('/api/webhooks/paystack')
      .set('x-paystack-signature', sig)
      .set('content-type', 'application/json')
      .send(raw);
    expect(r1.statusCode).toBe(200);

    const after1 = await pool.query('SELECT amount_paid, updated_at FROM vendors WHERE id = $1', [vendorId]);
    const updatedAt1 = after1.rows[0].updated_at;
    const callsAfter1 = mockFetch.mock.calls.length;

    // Wait 1s so updated_at would change if a second UPDATE happened.
    await new Promise((r) => setTimeout(r, 1100));

    // Replay (same body, same signature)
    const r2 = await request(app)
      .post('/api/webhooks/paystack')
      .set('x-paystack-signature', sig)
      .set('content-type', 'application/json')
      .send(raw);
    expect(r2.statusCode).toBe(200);

    const after2 = await pool.query('SELECT amount_paid, updated_at FROM vendors WHERE id = $1', [vendorId]);
    expect(after2.rows[0].updated_at).toEqual(updatedAt1); // unchanged → no second UPDATE
    expect(parseFloat(after2.rows[0].amount_paid)).toBe(VENDOR_BOOTH_AMOUNT_NAIRA);

    // No second email send.
    const callsAfter2 = mockFetch.mock.calls.length;
    expect(callsAfter2).toBe(callsAfter1);

    // Cleanup
    await pool.query('DELETE FROM vendors WHERE id = $1', [vendorId]);
  });

  it('rejects insufficient payment amounts', async () => {
    // New vendor
    const email = `insufficient_${Date.now()}@example.com`;
    const v = await pool.query(
      `INSERT INTO vendors (
         email, full_name, phone_number, whatsapp_number, instagram_handle,
         business_name, sector, booth_type, selected_location,
         is_previous_vendor, live_in_abuja, category_accepted,
         agree_to_market, agree_to_whatsapp, agree_to_terms
       ) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        email, 'Insufficient Test', '08000000002', '@insuf',
        'Insufficient Biz', 'Fashion', 'Shared Booth', 'Abuja',
        false, true, true, true, true, true,
      ]
    );
    const vendorId = v.rows[0].id;

    // Pay 5,000 naira (50,000 kobo) for an 80,000-naira booth.
    const { raw, sig } = buildSignedEvent({ vendorId, amount: 5000 * 100 });

    const res = await request(app)
      .post('/api/webhooks/paystack')
      .set('x-paystack-signature', sig)
      .set('content-type', 'application/json')
      .send(raw);

    // The webhook swallows the error and returns 200 (so Paystack
    // doesn't retry forever on a business-logic rejection). The
    // important assertion is that the DB row is NOT flipped to paid.
    expect(res.statusCode).toBe(200);
    const after = await pool.query('SELECT payment_status FROM vendors WHERE id = $1', [vendorId]);
    expect(after.rows[0].payment_status).toBe('pending');

    await pool.query('DELETE FROM vendors WHERE id = $1', [vendorId]);
  });
});
