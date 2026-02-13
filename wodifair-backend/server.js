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

import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate Environment Variables
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'PAYSTACK_SECRET_KEY', 'RESEND_API_KEY', 'ADMIN_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingEnv.join(', '));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Initialize Resend
console.log('Initializing Resend...');
// const resend = new Resend(process.env.RESEND_API_KEY);
console.log('Resend initialized'); // Avoid logging the object to prevent secret leakage

// Security Middleware
app.use(helmet()); // Secure HTTP headers

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL, process.env.ADMIN_URL].filter(Boolean)
    : '*', // Allow all in development
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
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

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Wodibenuahfair API' });
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes); // Includes /api/vendors and /api/vendors/public
app.use('/api/events', eventRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/highlights', highlightRoutes);
app.use('/api/contact', contactRoutes);

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
