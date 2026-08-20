import { jest } from '@jest/globals';
import request from 'supertest';

// Mock Axios Factory
const mockAxios = {
  get: jest.fn(),
  post: jest.fn()
};

// Mock dependencies BEFORE importing app
jest.unstable_mockModule('axios', () => ({
  default: mockAxios
}));

// Dynamic imports
const { default: app } = await import('../server.js');
const { default: pool, initDb } = await import('../db.js');

describe('Vendor Registration & Payment Flow', () => {
  let vendorId;
  const testEmail = `test_vendor_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Ensure DB is initialized and migrations run
    await initDb();
  });

  afterAll(async () => {
    // Cleanup
    if (vendorId) {
      await pool.query('DELETE FROM vendors WHERE id = $1', [vendorId]);
    }
    await pool.end(); // Close DB connection
  });

  it('should register a new vendor successfully', async () => {
    const res = await request(app)
      .post('/api/vendors/register')
      .send({
        email: testEmail,
        fullName: 'Test Vendor',
        phoneNumber: '08012345678',
        whatsappNumber: '08012345678',
        instagramHandle: '@testvendor',
        businessName: 'Test Business',
        sector: 'Fashion',
        boothType: 'Half Booth',
        selectedLocation: 'Abuja',
        isPreviousVendor: false,
        liveInAbuja: true,
        categoryAccepted: true,
        agreeToMarket: true,
        agreeToWhatsapp: true,
        agreeToTerms: true
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('vendor');
    expect(res.body.vendor.email).toEqual(testEmail);
    expect(res.body.vendor.payment_status).toEqual('pending'); // Default
    
    vendorId = res.body.vendor.id;
  });

  it('should verify payment successfully', async () => {
    if (!vendorId) throw new Error('Vendor registration failed, cannot test payment');

    // Mock Paystack Success with matching customer email & metadata
    mockAxios.get.mockResolvedValue({
      data: {
        status: true,
        data: {
          status: 'success',
          amount: 19500000, // 195,000 * 100 (Half Booth Price)
          reference: 'TEST_REF_123',
          customer: { email: testEmail },
          metadata: { vendorId: vendorId }
        }
      }
    });

    // Mock Resend Success
    mockAxios.post.mockResolvedValue({
      data: { id: 'email_123' }
    });

    const res = await request(app)
      .post('/api/vendors/verify-payment')
      .send({
        reference: 'TEST_REF_123',
        vendorId: vendorId
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.vendor.payment_status).toEqual('paid');
    // Database returns numeric as string
    expect(parseFloat(res.body.vendor.amount_paid)).toEqual(195000); 

    // Verify Paystack was called
    expect(mockAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('TEST_REF_123'),
      expect.anything()
    );
  });

  it('should reject payment verification if transaction customer does not match vendor', async () => {
    // Register another vendor
    const victimEmail = `victim_${Date.now()}@example.com`;
    const regRes = await request(app).post('/api/vendors/register').send({
      email: victimEmail,
      fullName: 'Victim Vendor',
      phoneNumber: '08000000000',
      whatsappNumber: '08000000000',
      instagramHandle: '@victim',
      businessName: 'Victim Biz',
      sector: 'Fashion',
      boothType: 'Half Booth',
      selectedLocation: 'Abuja',
      isPreviousVendor: false,
      liveInAbuja: true,
      categoryAccepted: true,
      agreeToMarket: true,
      agreeToWhatsapp: true,
      agreeToTerms: true
    });
    const victimId = regRes.body.vendor.id;

    // Mock Paystack with completely different customer email and vendorId
    mockAxios.get.mockResolvedValueOnce({
      data: {
        status: true,
        data: {
          status: 'success',
          amount: 19500000,
          reference: 'MISMATCH_REF_999',
          customer: { email: 'stranger@example.com' },
          metadata: { vendorId: 99999 }
        }
      }
    });

    const res = await request(app)
      .post('/api/vendors/verify-payment')
      .send({
        reference: 'MISMATCH_REF_999',
        vendorId: victimId
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toContain('Transaction does not match');

    await pool.query('DELETE FROM vendors WHERE id = $1', [victimId]);
  });

  it('should fail payment verification if amount is insufficient', async () => {
     // Register another vendor for this test
     const cheapEmail = `cheap_${Date.now()}@example.com`;
     const regRes = await request(app).post('/api/vendors/register').send({
        email: cheapEmail,
        fullName: 'Cheap Vendor',
        phoneNumber: '000',
        whatsappNumber: '000',
        instagramHandle: '@cheap',
        businessName: 'Cheap Biz',
        sector: 'Fashion',
        boothType: 'Half Booth', // Price is 195,000
        selectedLocation: 'Abuja',
        isPreviousVendor: false,
        liveInAbuja: true,
        categoryAccepted: true,
        agreeToMarket: true,
        agreeToWhatsapp: true,
        agreeToTerms: true
     });
     const cheapId = regRes.body.vendor.id;

     // Mock Paystack with insufficient amount (e.g. 5000) matching this customer
     mockAxios.get.mockResolvedValueOnce({
      data: {
        status: true,
        data: {
          status: 'success',
          amount: 500000, // 5,000 * 100
          reference: 'CHEAP_REF',
          customer: { email: cheapEmail },
          metadata: { vendorId: cheapId }
        }
      }
    });

    const res = await request(app)
      .post('/api/vendors/verify-payment')
      .send({
        reference: 'CHEAP_REF',
        vendorId: cheapId
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toContain('Insufficient payment');
    
    await pool.query('DELETE FROM vendors WHERE id = $1', [cheapId]);
  });

  it('should update vendor approval status via PATCH /api/vendors/:id/status', async () => {
    // Import jwt to sign an admin token
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign({ id: 'admin1', role: 'admin' }, process.env.JWT_SECRET || '7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0');

    // 1. Reject vendor
    const rejectRes = await request(app)
      .patch(`/api/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approvalStatus: 'rejected' });

    expect(rejectRes.statusCode).toEqual(200);
    expect(rejectRes.body.vendor.approval_status).toEqual('rejected');
    expect(rejectRes.body.vendor.is_approved).toEqual(false);

    // 2. Approve vendor
    const approveRes = await request(app)
      .patch(`/api/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approvalStatus: 'approved' });

    expect(approveRes.statusCode).toEqual(200);
    expect(approveRes.body.vendor.approval_status).toEqual('approved');
    expect(approveRes.body.vendor.is_approved).toEqual(true);
  });
});
