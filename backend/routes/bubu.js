// ===========================================================================
// Bubu Lagos API routes  (mounted at /api/bubu in server.js)
//
// Stub module — the Bubu Lagos backend (c:\Users\nuke\...\Bubu lagos\backend)
// continues to own its own Express service. This module exists so that:
//   * /api/bubu/health reports liveness against the shared Supabase project
//   * The migration `add_bubu_schema.sql` is runnable from the Wodifair
//     backend's migration runner (it already runs all *.sql in /migrations).
//
// When you are ready to retire the standalone Bubu backend and serve it
// from this service, port the routes from bubu-lagos/backend/src/routes/*
// into this file. Until then, do NOT add business logic here — the
// Bubu backend still owns it.
//
// Existing Wodifair routes (/api/auth, /api/vendors, /api/events, etc.)
// and ERP/Retail routes are NOT modified by this file.
// ===========================================================================

import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import pool from '../db.js';

const router = express.Router();

const safe = (fn) => async (req, res, next) => {
  try { return await fn(req, res, next); }
  catch (err) {
    console.error('[bubu]', req.method, req.originalUrl, '->', err.message);
    res.status(500).json({ error: 'Bubu internal error', detail: err.message });
  }
};

// -- Cloudinary  (folder: /bubu) — same account, namespaced folder --
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (e) { /* surfaces on first upload */ }

// ===========================================================================
// HEALTH  (public)
// ===========================================================================
router.get('/health', safe(async (req, res) => {
  // Touch a Bubu table to confirm schema was migrated
  const r = await pool.query('SELECT COUNT(*)::int AS n FROM bubu.categories');
  res.json({
    status: 'ok',
    service: 'bubu',
    sharedDb: 'supabase',
    schema: 'bubu',
    categories: r.rows[0].n,
  });
}));

// ===========================================================================
// CLOUDINARY SIGNED UPLOAD  (matches the pattern in /api/retail)
//   GET /api/bubu/cloudinary/sign
// ===========================================================================
router.get('/cloudinary/sign', safe(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'bubu';
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');
  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  });
}));

export default router;
