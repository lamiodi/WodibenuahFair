import request from 'supertest';
import { jest } from '@jest/globals';

// Mock dependencies
const mockPoolQuery = jest.fn();
const mockPoolConnect = jest.fn();
const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

// Create mock Pool class
class MockPool {
  constructor() {
    this.connect = mockPoolConnect;
    this.query = mockPoolQuery;
  }
}

// Setup mocks before importing app
jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: MockPool
  }
}));

jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost
  }
}));

// Import app after mocks
const { default: app } = await import('./server.js');

describe('Critical Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for connect
    mockPoolConnect.mockImplementation((cb) => {
      if (cb) cb(null, { query: jest.fn() }, jest.fn());
      return Promise.resolve({ query: jest.fn(), release: jest.fn() });
    });
  });

  describe('POST /api/register-vendor', () => {
    const validVendorData = {
      email: 'test@example.com',
      fullName: 'John Doe',
      phoneNumber: '1234567890',
      whatsappNumber: '1234567890',
      instagramHandle: '@johndoe',
      businessName: 'Johns Business',
      sector: 'Fashion',
      isPreviousVendor: false,
      liveInAbuja: true,
      categoryAccepted: true,
      agreeToMarket: true,
      agreeToWhatsapp: true,
      agreeToTerms: true
    };

    it('should register a vendor successfully', async () => {
      // Mock DB response
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: 1, ...validVendorData }]
      });

      const res = await request(app)
        .post('/api/register-vendor')
        .send(validVendorData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Vendor registered successfully');
      expect(res.body.vendor).toHaveProperty('email', validVendorData.email);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = { ...validVendorData, email: 'not-an-email' };
      
      const res = await request(app)
        .post('/api/register-vendor')
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should handle database errors gracefully', async () => {
      mockPoolQuery.mockRejectedValueOnce(new Error('DB Error'));

      const res = await request(app)
        .post('/api/register-vendor')
        .send(validVendorData);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('POST /api/verify-payment', () => {
    const paymentData = {
      reference: 'ref_12345',
      vendorId: 1
    };

    it('should verify payment successfully', async () => {
      // Mock Paystack response
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          status: true,
          data: {
            status: 'success',
            amount: 500000 // 5000 Naira in kobo
          }
        }
      });

      // Mock DB update response
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ 
          id: 1, 
          payment_status: 'paid', 
          amount_paid: 5000,
          email: 'test@example.com',
          full_name: 'John Doe',
          business_name: 'Johns Business'
        }]
      });

      // Mock Resend success (via axios.post)
      mockAxiosPost.mockResolvedValueOnce({
        data: { id: 'email_123' }
      });

      const res = await request(app)
        .post('/api/verify-payment')
        .send(paymentData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      
      // Verify Paystack call
      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('ref_12345'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String)
          })
        })
      );

      // Verify Resend call
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          to: ['test@example.com'],
          subject: 'Payment Receipt - Wodibenuah Fair 2026'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle payment verification failure from Paystack', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          status: true,
          data: {
            status: 'failed'
          }
        }
      });

      const res = await request(app)
        .post('/api/verify-payment')
        .send(paymentData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should return 400 for missing reference', async () => {
      const res = await request(app)
        .post('/api/verify-payment')
        .send({ vendorId: 1 });

      expect(res.status).toBe(400);
    });
  });
});
