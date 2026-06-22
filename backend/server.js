import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
// import { Resend } from 'resend';
import { initDb } from './db.js';

// Import Routes
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import eventRoutes from './routes/events.js';
import blogRoutes from './routes/blog.js';
import highlightRoutes from './routes/highlights.js';
import contactRoutes from './routes/contact.js';
import webhookRoutes from './routes/webhook.js';

// ERP routes (added non-destructively — failure to load cannot break
// any of the routes above; the live Wodifair API stays fully operational).
let erpRoutes = null;
try {
  const erpModule = await import('./routes/erp.js');
  erpRoutes = erpModule.default;
  console.log('ERP module loaded: /api/erp/*');
} catch (err) {
  console.error('[server] ERP module failed to load; /api/erp disabled. Live Wodifair API is unaffected.', err.message);
}

// Retail OS routes (consumes the shared Supabase + Cloudinary).
// Failure to load CANNOT break any of the Wodifair routes above.
let retailRoutes = null;
try {
  const retailModule = await import('./routes/retail.js');
  retailRoutes = retailModule.default;
  console.log('Retail module loaded: /api/retail/*');
} catch (err) {
  console.error('[server] Retail module failed to load; /api/retail disabled. Live Wodifair API is unaffected.', err.message);
}

// Bubu Lagos routes (health + Cloudinary signing stub).
// Failure to load CANNOT break any of the Wodifair routes above.
let bubuRoutes = null;
try {
  const bubuModule = await import('./routes/bubu.js');
  bubuRoutes = bubuModule.default;
  console.log('Bubu module loaded: /api/bubu/*');
} catch (err) {
  console.error('[server] Bubu module failed to load; /api/bubu disabled. Live Wodifair API is unaffected.', err.message);
}

import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate Environment Variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'PAYSTACK_SECRET_KEY', 'ADMIN_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingEnv.join(', '));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Security Middleware
// Stricter than the helmet() defaults:
//   * HSTS in production
//   * referrerPolicy: same-origin
//   * crossOriginOpenerPolicy: same-origin
//   * CSP: minimal, since this is an API (no inline scripts/frames).
//     Adjust if you ever start serving HTML from this service.
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
  },
  referrerPolicy: { policy: 'same-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  process.env.ERP_URL,                              // NEW: ERP frontend origin
  process.env.ERP_URL_ALT,                         // NEW: optional second (staging/preview)
  process.env.RETAIL_URL,                           // NEW: Retail OS frontend origin
  'https://www.wodibenuahfair.org',
  'https://wodibenuahfair.org'
].filter(Boolean);

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log('Blocked by CORS:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      }
    : '*', // Allow all in development
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    // Keep the raw body as a Buffer (needed for HMAC verification by
    // Paystack, both for the existing /api/webhooks route and for the
    // new /api/erp/paystack/webhook). The shape of req.body is unchanged.
    req.rawBody = buf;
  }
})); // Body limit to prevent DoS
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(morgan('dev')); // Logging

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Initialize Database Schema
initDb();

// ERP first-boot credential rotator.
// Runs ONCE on each server start. For any erp.users row still flagged
// with must_change_password = TRUE, it generates a strong random
// replacement and logs the plaintext to the console (visible in
// Render logs). It is fully defensive: a failure here cannot break
// the live Wodifair API. Safe to leave in production.
import('./utils/erpFirstBoot.js')
  .then(({ rotateFirstLoginCredentials }) => rotateFirstLoginCredentials())
  .catch(err => console.error('[server] ERP first-boot rotator failed to load (non-fatal):', err.message));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Wodibenuahfair API' });
});

// Lightweight Health Check for UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes); // Includes /api/vendors and /api/vendors/public
app.use('/api/events', eventRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/contact', contactRoutes);

// ERP mount — only attaches if the module loaded successfully.
// All existing Wodifair routes above are untouched.
if (erpRoutes) {
  app.use('/api/erp', erpRoutes);
}

// Retail mount — only attaches if the module loaded successfully.
if (retailRoutes) {
  app.use('/api/retail', retailRoutes);
}

// Bubu mount — only attaches if the module loaded successfully.
if (bubuRoutes) {
  app.use('/api/bubu', bubuRoutes);
}

// Deprecated/Legacy Route Handling (Redirect or Alias if needed)
// Note: Frontend has been updated to use the structured routes above.

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
