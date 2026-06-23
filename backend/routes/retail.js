// ===========================================================================
// Retail OS API routes  (mounted at /api/retail in server.js)
//
// This module is intentionally self-contained and DEFENSIVE:
//   * It never mutates any existing Wodifair / ERP table or route.
//   * Every public export is wrapped so a single failing handler returns
//     a JSON 500 rather than crashing the live process.
//   * Sync endpoint supports idempotency_key for offline-first / Dexie.
//   * Cloudinary upload uses folder "retail/".
//
// The Retail OS frontend (Next.js + Dexie) originally called its own
// /api/* Next routes. To centralise on this backend, repoint the Retail
// base URL to /api/retail/* on the Wodifair Render service.
//
// Existing Wodifair routes (/api/auth, /api/vendors, /api/events, etc.)
// and ERP routes (/api/erp/*) are NOT modified by this file.
// ===========================================================================

import express from 'express';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';

const router = express.Router();

// -- safe wrapper: turns thrown errors into JSON responses, never crashes --
const safe = (fn) => async (req, res, next) => {
  try { return await fn(req, res, next); }
  catch (err) {
    console.error('[retail]', req.method, req.originalUrl, '->', err.message);
    res.status(500).json({ error: 'Retail internal error', detail: err.message });
  }
};

// -- idempotency record helper (prevents the same offline payload twice) --
const recordSync = async (idempotencyKey, entity, action, entityId) => {
  if (!idempotencyKey) return true; // no key = accept
  const r = await pool.query(
    `INSERT INTO retail.sync_log (idempotency_key, entity, action, entity_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING idempotency_key`,
    [idempotencyKey, entity, action, entityId]
  );
  return r.rowCount > 0; // false = already processed
};

// ===========================================================================
// Cloudinary  (folder: /retail)  — same account as Wodifair, namespaced folder
// ===========================================================================
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} catch (e) { /* will surface on first upload attempt */ }

// ===========================================================================
// HEALTH  (public)
// ===========================================================================
router.get('/health', safe(async (req, res) => {
  const r = await pool.query('SELECT 1 AS ok');
  res.json({ status: 'ok', service: 'retail', db: r.rows[0].ok === 1 });
}));

// ===========================================================================
// PRODUCTS
//   GET    /api/retail/products
//   POST   /api/retail/products           (single) | { action: 'seed', products: [...] }
//   PUT    /api/retail/products
// ===========================================================================
router.get('/products', safe(async (req, res) => {
  const r = await pool.query('SELECT * FROM retail.wodi_products ORDER BY name ASC');
  res.json(r.rows);
}));

router.post('/products', safe(async (req, res) => {
  const body = req.body || {};

  if (body.action === 'seed') {
    const products = Array.isArray(body.products) ? body.products : [];
    const created = [];
    for (const p of products) {
      try {
        const id = body.keepIds && p.id ? p.id : uuidv4();
        const r = await pool.query(
          `INSERT INTO retail.wodi_products
             (id, barcode, name, "costPrice", "sellingPrice", "stockQuantity", "reorderLevel", category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (barcode) DO UPDATE SET
             name = EXCLUDED.name,
             "costPrice" = EXCLUDED."costPrice",
             "sellingPrice" = EXCLUDED."sellingPrice",
             "stockQuantity" = EXCLUDED."stockQuantity",
             "reorderLevel" = EXCLUDED."reorderLevel",
             category = EXCLUDED.category,
             "updatedAt" = CURRENT_TIMESTAMP
           RETURNING *`,
          [id, p.barcode, p.name, p.costPrice, p.sellingPrice, p.stockQuantity,
           p.reorderLevel || 5, p.category || 'General']
        );
        created.push(r.rows[0]);
      } catch (e) { /* skip duplicates / bad rows */ }
    }
    return res.json({ seeded: created.length });
  }

  const id = body.id || uuidv4();
  const r = await pool.query(
    `INSERT INTO retail.wodi_products
       (id, barcode, name, "costPrice", "sellingPrice", "stockQuantity", "reorderLevel", "imageBase64", "imageUrl", category, "expiryDate")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      id,
      body.barcode,
      body.name,
      body.costPrice,
      body.sellingPrice,
      body.stockQuantity,
      body.reorderLevel || 5,
      body.imageBase64 || null,
      body.imageUrl || null,
      body.category || 'General',
      body.expiryDate || null,
    ]
  );
  res.json(r.rows[0]);
}));

router.put('/products', safe(async (req, res) => {
  const body = req.body || {};
  if (!body.id) return res.status(400).json({ error: 'id is required' });
  const r = await pool.query(
    `UPDATE retail.wodi_products SET
       name = $1,
       "costPrice" = $2,
       "sellingPrice" = $3,
       "stockQuantity" = $4,
       "reorderLevel" = $5,
       category = $6,
       "imageBase64" = COALESCE($7, "imageBase64"),
       "imageUrl" = COALESCE($8, "imageUrl"),
       "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $9 RETURNING *`,
    [
      body.name,
      body.costPrice,
      body.sellingPrice,
      body.stockQuantity,
      body.reorderLevel,
      body.category,
      body.imageBase64 || null,
      body.imageUrl || null,
      body.id,
    ]
  );
  res.json(r.rows[0]);
}));

// ===========================================================================
// CUSTOMERS
//   GET    /api/retail/customers
//   POST   /api/retail/customers
// ===========================================================================
router.get('/customers', safe(async (req, res) => {
  const r = await pool.query('SELECT * FROM retail.wodi_customers ORDER BY "totalSpent" DESC');
  res.json(r.rows);
}));

router.post('/customers', safe(async (req, res) => {
  const body = req.body || {};
  const id = body.id || uuidv4();
  const r = await pool.query(
    `INSERT INTO retail.wodi_customers (id, name, phone, "totalSpent", points, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [id, body.name, body.phone, body.totalSpent || 0, body.points || 0, body.status || 'Regular']
  );
  res.json(r.rows[0]);
}));

// ===========================================================================
// SALES  (read-only listing; writes flow through /sync)
// ===========================================================================
router.get('/sales', safe(async (req, res) => {
  const r = await pool.query(
    'SELECT * FROM retail.wodi_sales ORDER BY "createdAt" DESC LIMIT 200'
  );
  res.json(r.rows);
}));

// ===========================================================================
// SHIFTS
// ===========================================================================
router.get('/shifts', safe(async (req, res) => {
  const r = await pool.query('SELECT * FROM retail.wodi_shifts ORDER BY "openedAt" DESC');
  res.json(r.rows);
}));

// ===========================================================================
// SETTINGS  (key/value store)
// ===========================================================================
router.get('/settings', safe(async (req, res) => {
  const r = await pool.query('SELECT * FROM retail.wodi_settings');
  res.json(r.rows);
}));

// ===========================================================================
// SYNC
//   POST /api/retail/sync            { idempotencyKey?, action, entity, data }
//   GET  /api/retail/sync/pull?lastSync=<ms>
// ===========================================================================
router.post('/sync', safe(async (req, res) => {
  const body = req.body || {};
  const { action, entity, data, idempotencyKey } = body;
  if (!entity || !action) return res.status(400).json({ error: 'entity and action are required' });

  // Idempotency: short-circuit if this key has been processed before
  if (idempotencyKey) {
    const fresh = await recordSync(idempotencyKey, entity, action, data?.id);
    if (!fresh) return res.json({ success: true, deduped: true });
  }

  switch (entity) {
    case 'sale': {
      if (action === 'create_sale' && data?.id) {
        const exists = await pool.query('SELECT 1 FROM retail.wodi_sales WHERE id = $1', [data.id]);
        if (exists.rowCount === 0) {
          await pool.query(
            `INSERT INTO retail.wodi_sales
               (id, items, "totalAmount", "profitMade", "paymentMethod", "paymentRef",
                "splitDetails", "soldBy", "shiftId", "isHeld", "isQuickSale",
                "isRefund", "originalSaleId", "customerId", synced)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, true)`,
            [
              data.id, data.items, data.totalAmount, data.profitMade,
              data.paymentMethod, data.paymentRef || null, data.splitDetails || null,
              data.soldBy, data.shiftId,
              !!data.isHeld, !!data.isQuickSale, !!data.isRefund,
              data.originalSaleId || null, data.customerId || null,
            ]
          );

          // Decrement stock best-effort
          try {
            const items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
            for (const item of (items || [])) {
              if (item.productId && String(item.productId).length > 10 && item.qty) {
                await pool.query(
                  `UPDATE retail.wodi_products
                   SET "stockQuantity" = GREATEST(0, "stockQuantity" - $1), "updatedAt" = CURRENT_TIMESTAMP
                   WHERE id = $2`,
                  [item.qty, item.productId]
                );
              }
            }
          } catch (e) { /* stock update is best-effort */ }
        }
      }
      break;
    }

    case 'shift': {
      if (action === 'create_shift' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_shifts
             (id, "repName", "openingCash", "salesCount", "totalSales", "totalExpenses", synced)
           VALUES ($1,$2,$3,$4,$5,$6, true)
           ON CONFLICT (id) DO NOTHING`,
          [data.id, data.repName, data.openingCash || 0,
           data.salesCount || 0, data.totalSales || 0, data.totalExpenses || 0]
        );
      } else if (action === 'close_shift' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_shifts
             (id, "repName", "openingCash", "closingCash", "expectedCash", variance,
              "salesCount", "totalSales", "totalExpenses", "closedAt", synced)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, CURRENT_TIMESTAMP, true)
           ON CONFLICT (id) DO UPDATE SET
             "closingCash" = EXCLUDED."closingCash",
             "expectedCash" = EXCLUDED."expectedCash",
             variance = EXCLUDED.variance,
             "salesCount" = EXCLUDED."salesCount",
             "totalSales" = EXCLUDED."totalSales",
             "totalExpenses" = EXCLUDED."totalExpenses",
             "closedAt" = EXCLUDED."closedAt",
             synced = true`,
          [data.id, data.repName, data.openingCash, data.closingCash, data.expectedCash,
           data.variance, data.salesCount, data.totalSales, data.totalExpenses]
        );
      }
      break;
    }

    case 'customer': {
      if (action === 'create_customer' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_customers (id, name, phone, "totalSpent", points, status)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (id) DO NOTHING`,
          [data.id, data.name, data.phone, data.totalSpent || 0, data.points || 0, data.status || 'Regular']
        );
      }
      break;
    }

    case 'product': {
      if (action === 'create_product' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_products
             (id, barcode, name, "costPrice", "sellingPrice", "stockQuantity", "reorderLevel", "imageBase64", category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO NOTHING`,
          [data.id, data.barcode, data.name, data.costPrice, data.sellingPrice,
           data.stockQuantity, data.reorderLevel || 5, data.imageBase64 || null, data.category || 'General']
        );
      } else if (action === 'update_product' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_products
             (id, barcode, name, "costPrice", "sellingPrice", "stockQuantity", "reorderLevel", category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             "costPrice" = EXCLUDED."costPrice",
             "sellingPrice" = EXCLUDED."sellingPrice",
             "stockQuantity" = EXCLUDED."stockQuantity",
             "reorderLevel" = EXCLUDED."reorderLevel",
             category = EXCLUDED.category,
             "updatedAt" = CURRENT_TIMESTAMP`,
          [data.id, data.barcode, data.name, data.costPrice, data.sellingPrice,
           data.stockQuantity, data.reorderLevel || 5, data.category || 'General']
        );
      }
      break;
    }

    case 'inventory_adjustment': {
      if (action === 'create_adjustment' && data?.id) {
        const exists = await pool.query('SELECT 1 FROM retail.wodi_audit_logs WHERE id = $1', [data.id]);
        if (exists.rowCount === 0) {
          await pool.query(
            `INSERT INTO retail.wodi_audit_logs
               (id, "productId", type, quantity, reason, "performedBy", synced)
             VALUES ($1,$2,$3,$4,$5,$6, true)`,
            [data.id, data.productId, data.type, data.quantity, data.reason, data.performedBy]
          );
          let sql = null;
          if (data.type === 'ADD')         sql = `UPDATE retail.wodi_products SET "stockQuantity" = "stockQuantity" + $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`;
          else if (data.type === 'REMOVE') sql = `UPDATE retail.wodi_products SET "stockQuantity" = GREATEST(0, "stockQuantity" - $1), "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`;
          else if (data.type === 'SET')    sql = `UPDATE retail.wodi_products SET "stockQuantity" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`;
          if (sql) await pool.query(sql, [data.quantity, data.productId]);
        }
      }
      break;
    }

    case 'audit_log': {
      if (action === 'create_audit_log' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_audit_logs
             (id, "productId", action, "oldValue", "newValue", "performedBy", synced)
           VALUES ($1,$2,$3,$4,$5,$6, true)
           ON CONFLICT (id) DO NOTHING`,
          [data.id, data.productId, data.action, data.oldValue, data.newValue, data.performedBy]
        );
      }
      break;
    }

    case 'expense': {
      if (action === 'create_expense' && data?.id) {
        await pool.query(
          `INSERT INTO retail.wodi_expenses
             (id, amount, category, description, "shiftId", "loggedBy", synced)
           VALUES ($1,$2,$3,$4,$5,$6, true)
           ON CONFLICT (id) DO NOTHING`,
          [data.id, data.amount, data.category, data.description, data.shiftId, data.loggedBy]
        );
      }
      break;
    }

    default:
      return res.status(400).json({ error: `Unknown entity: ${entity}` });
  }

  res.json({ success: true });
}));

router.get('/sync/pull', safe(async (req, res) => {
  const lastSync = Number(req.query.lastSync) || 0;
  const lastSyncDate = new Date(lastSync);

  const products  = await pool.query('SELECT * FROM retail.wodi_products  WHERE "updatedAt" > $1', [lastSyncDate]);
  const customers = await pool.query('SELECT * FROM retail.wodi_customers WHERE "updatedAt" > $1', [lastSyncDate]);
  const settings  = await pool.query('SELECT * FROM retail.wodi_settings');

  res.json({
    success: true,
    timestamp: Date.now(),
    data: {
      products:  products.rows,
      customers: customers.rows,
      settings:  settings.rows,
    },
  });
}));

// ===========================================================================
// CLOUDINARY SIGNED UPLOAD
//   GET /api/retail/cloudinary/sign  -> { timestamp, signature, apiKey, cloudName, folder }
//   The Retail frontend posts the file directly to Cloudinary, then
//   sends the returned secure_url back via PUT /api/retail/products.
// ===========================================================================
router.get('/cloudinary/sign', safe(async (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'retail';
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

// ===========================================================================
// BULK IMPORT  (bypasses rate limiter for initial data load)
//   POST /api/retail/bulk-import
//   Body: { products: [...], batchSize: 50 }
// ===========================================================================
let bulkImportLock = false;
router.post('/bulk-import', safe(async (req, res) => {
  if (bulkImportLock) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  bulkImportLock = true;
  try {
    const products = Array.isArray(req.body.products) ? req.body.products : [];
    const batchSize = req.body.batchSize || 100;
    
    if (products.length === 0) {
      return res.json({ seeded: 0, message: 'No products provided' });
    }
    
    let seeded = 0;
    let errors = 0;
    const errorDetails = [];
    
    // Process in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));
      
      for (const p of batch) {
        try {
          const id = uuidv4();
          await pool.query(
            `INSERT INTO retail.wodi_products
               (id, barcode, name, "costPrice", "sellingPrice", "stockQuantity", "reorderLevel", category)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (barcode) DO UPDATE SET
               name = EXCLUDED.name,
               "costPrice" = EXCLUDED."costPrice",
               "sellingPrice" = EXCLUDED."sellingPrice",
               "stockQuantity" = EXCLUDED."stockQuantity",
               "reorderLevel" = EXCLUDED."reorderLevel",
               category = EXCLUDED.category,
               "updatedAt" = CURRENT_TIMESTAMP`,
            [id, p.barcode, p.name, p.costPrice || 0, p.sellingPrice || 0, 
             p.stockQuantity || 0, p.reorderLevel || 5, p.category || 'General']
          );
          seeded++;
        } catch (e) {
          errors++;
          errorDetails.push({ name: p.name, error: e.message });
        }
      }
    }
    
    res.json({ 
      seeded, 
      errors,
      total: products.length,
      details: errorDetails.slice(0, 10) // First 10 errors
    });
  } finally {
    bulkImportLock = false;
  }
}));

// ===========================================================================
// SEED  (dev convenience — same shape as the old Next route)
// ===========================================================================
router.post('/seed', safe(async (req, res) => {
  const SAMPLE_PRODUCTS = [
    { barcode: '6281001234001', name: 'Ankara Fabric - Red',   costPrice: 2500,  sellingPrice: 4500,  stockQuantity: 45, reorderLevel: 10, category: 'Fabrics' },
    { barcode: '6281001234002', name: 'Ankara Fabric - Blue',  costPrice: 2500,  sellingPrice: 4500,  stockQuantity: 30, reorderLevel: 10, category: 'Fabrics' },
    { barcode: '6281001234003', name: 'Black Gown - Elegant',  costPrice: 8000,  sellingPrice: 15000, stockQuantity: 12, reorderLevel: 3,  category: 'Clothing' },
  ];
  const SAMPLE_CUSTOMERS = [
    { name: 'Adaeze Okonkwo', phone: '08012345678' },
    { name: 'Chidi Nwosu',    phone: '08023456789' },
  ];

  let productsSeeded = 0;
  for (const p of SAMPLE_PRODUCTS) {
    try {
      await pool.query(
        `INSERT INTO retail.wodi_products
           (id, barcode, name, "costPrice", "sellingPrice", "stockQuantity", "reorderLevel", category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (barcode) DO UPDATE SET
           name = EXCLUDED.name, "costPrice" = EXCLUDED."costPrice",
           "sellingPrice" = EXCLUDED."sellingPrice", "stockQuantity" = EXCLUDED."stockQuantity",
           "reorderLevel" = EXCLUDED."reorderLevel", category = EXCLUDED.category,
           "updatedAt" = CURRENT_TIMESTAMP`,
        [uuidv4(), p.barcode, p.name, p.costPrice, p.sellingPrice,
         p.stockQuantity, p.reorderLevel, p.category]
      );
      productsSeeded++;
    } catch (_) { /* skip */ }
  }

  let customersSeeded = 0;
  for (const c of SAMPLE_CUSTOMERS) {
    try {
      await pool.query(
        `INSERT INTO retail.wodi_customers (id, name, phone, "totalSpent", points, status)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (phone) DO NOTHING`,
        [uuidv4(), c.name, c.phone, 0, 0, 'Regular']
      );
      customersSeeded++;
    } catch (_) { /* skip */ }
  }

  res.json({ productsSeeded, customersSeeded });
}));

export default router;
