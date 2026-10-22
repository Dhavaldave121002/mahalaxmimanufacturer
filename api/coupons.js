import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from './_lib/admin-session.js';

// Helper to read fallback coupons from public/coupons.json
function readFallbackCoupons() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'coupons.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Fallback coupons read warning:', e.message);
  }
  return [
    {
      id: 'coup-launch150',
      code: 'LAUNCH150',
      title: 'Subscriber Welcome Email Voucher',
      description: 'Exclusive ₹150 OFF voucher sent via email for new subscribers & signups',
      discountType: 'FLAT',
      discountValue: 150,
      minOrderValue: 0,
      isActive: true,
      isFeatured: false,
      suggestionMode: 'SECRET_MANUAL_ONLY',
      applicableFor: 'ALL',
      usedCount: 42,
      createdAt: '2026-10-01T00:00:00.000Z'
    },
    {
      id: 'coup-milldirect10',
      code: 'MILLDIRECT10',
      title: 'Direct Loom 10% Discount',
      description: 'Get instant 10% OFF across all fabric and linen collections',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 1000,
      maxDiscountAmount: 1500,
      isActive: true,
      isFeatured: true,
      applicableFor: 'ALL',
      usedCount: 78,
      createdAt: '2026-10-02T00:00:00.000Z'
    },
    {
      id: 'coup-bulk500',
      code: 'BULK500',
      title: 'Wholesale Commercial Rebate',
      description: 'Flat ₹500 instant discount on commercial orders above ₹3,000',
      discountType: 'FLAT',
      discountValue: 500,
      minOrderValue: 3000,
      isActive: true,
      isFeatured: true,
      applicableFor: 'ALL',
      usedCount: 29,
      createdAt: '2026-10-05T00:00:00.000Z'
    },
    {
      id: 'coup-mahalaxmi20',
      code: 'MAHALAXMI20',
      title: 'Festival Mill Master Offer',
      description: 'Exclusive 20% OFF for bulk and wholesale trade consignments',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 10000,
      maxDiscountAmount: 5000,
      isActive: true,
      isFeatured: true,
      applicableFor: 'B2B',
      usedCount: 15,
      createdAt: '2026-10-08T00:00:00.000Z'
    }
  ];
}

// Helper to save to public/coupons.json and sync with app-config.json
function saveFallbackCoupons(couponsList) {
  try {
    const pubDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

    const filePath = path.join(pubDir, 'coupons.json');
    fs.writeFileSync(filePath, JSON.stringify(couponsList, null, 2), 'utf8');

    // Also update public/app-config.json so Flutter App gets the live coupons immediately
    const appConfigPath = path.join(pubDir, 'app-config.json');
    if (fs.existsSync(appConfigPath)) {
      try {
        const rawConfig = fs.readFileSync(appConfigPath, 'utf8');
        const config = JSON.parse(rawConfig);
        // Only public 1-click coupons should be published to Flutter App's live coupon list
        // Secret vouchers like LAUNCH150 sent via email are hidden from 1-click lists
        config.coupons = couponsList.filter(
          c => c.isActive && c.isFeatured && c.suggestionMode !== 'SECRET_MANUAL_ONLY' && (c.code || '').toUpperCase() !== 'LAUNCH150'
        );
        config.lastSyncedAt = new Date().toISOString();
        fs.writeFileSync(appConfigPath, JSON.stringify(config, null, 2), 'utf8');
      } catch (err) {
        // quiet fail on read-only envs
      }
    }
    return true;
  } catch (e) {
    console.warn('Fallback coupons write skipped (read-only):', e.message);
    return false;
  }
}

let tableEnsured = false;
// Ensure MySQL table exists with proper indexes
async function ensureCouponsTable(pool) {
  if (!pool || tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        discount_type VARCHAR(32) NOT NULL,
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_value DECIMAL(10,2) DEFAULT 0,
        max_discount_amount DECIMAL(10,2) DEFAULT NULL,
        valid_until DATETIME DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        is_featured TINYINT(1) DEFAULT 1,
        applicable_for VARCHAR(32) DEFAULT 'ALL',
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        suggestion_mode VARCHAR(32) DEFAULT 'PUBLIC_1CLICK',
        target_platform VARCHAR(32) DEFAULT 'ALL',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns exist on legacy tables
    try {
      await pool.query("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS suggestion_mode VARCHAR(32) DEFAULT 'PUBLIC_1CLICK'");
    } catch {}
    try {
      await pool.query("ALTER TABLE coupons ADD COLUMN IF NOT EXISTS target_platform VARCHAR(32) DEFAULT 'ALL'");
    } catch {}

    // Enforce that LAUNCH150 is always a secret, subscriber-only email voucher in MySQL
    try {
      await pool.query("UPDATE coupons SET is_featured = 0, suggestion_mode = 'SECRET_MANUAL_ONLY' WHERE UPPER(code) = 'LAUNCH150'");
    } catch {}

    tableEnsured = true;
  } catch (err) {
    console.warn('MySQL ensureCouponsTable error:', err.message);
  }
}

export default async function handler(req, res) {
  // CORS configuration for Flutter Mobile App, Web Storefront, and Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const pool = getDbPool();

  // ----------------------------------------------------
  // GET: Fetch all active or all coupons
  // ----------------------------------------------------
  if (req.method === 'GET') {
    if (pool) {
      try {
        await ensureCouponsTable(pool);
        const [rows] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');

        if (Array.isArray(rows) && rows.length > 0) {
          const formatted = rows
            .filter(r => r.is_active && r.suggestion_mode !== 'SECRET_MANUAL_ONLY' && r.code !== 'LAUNCH150')
            .map(r => ({
            id: r.id,
            code: r.code,
            title: r.title,
            description: r.description || '',
            discountType: r.discount_type,
            discountValue: Number(r.discount_value),
            minOrderValue: Number(r.min_order_value || 0),
            maxDiscountAmount: r.max_discount_amount ? Number(r.max_discount_amount) : undefined,
            validUntil: r.valid_until ? new Date(r.valid_until).toISOString() : undefined,
            isActive: Boolean(r.is_active),
            isFeatured: Boolean(r.is_featured) && r.code !== 'LAUNCH150' && r.suggestion_mode !== 'SECRET_MANUAL_ONLY',
            suggestionMode: r.suggestion_mode || (r.code === 'LAUNCH150' || !r.is_featured ? 'SECRET_MANUAL_ONLY' : 'PUBLIC_1CLICK'),
            targetPlatform: r.target_platform || 'ALL',
            applicableFor: r.applicable_for || 'ALL',
            usageLimit: r.usage_limit ? Number(r.usage_limit) : undefined,
            usedCount: Number(r.used_count || 0),
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
            }));

          return res.status(200).json({
            success: true,
            source: 'MYSQL_DATABASE',
            count: formatted.length,
            data: formatted
          });
        }
      } catch (err) {
        console.warn('MySQL coupons query failed, falling back to local file:', err.message);
      }
    }

    const fallback = readFallbackCoupons().filter(
      coupon => coupon.isActive && coupon.suggestionMode !== 'SECRET_MANUAL_ONLY' && coupon.code !== 'LAUNCH150'
    );
    return res.status(200).json({
      success: true,
      source: 'SECURE_STORAGE',
      count: fallback.length,
      data: fallback
    });
  }

  // ----------------------------------------------------
  // POST / PUT: Create or Update Coupon
  // ----------------------------------------------------
  if (req.method === 'POST' || req.method === 'PUT') {
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const rawCode = (body.code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!rawCode) {
      return res.status(400).json({ success: false, error: 'Coupon code is required.' });
    }

    const couponId = body.id || `coup-${Date.now()}`;
    const title = (body.title || rawCode).trim();
    const description = (body.description || '').trim();
    const discountType = body.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT';
    const discountValue = Number(body.discountValue) || 100;
    const minOrderValue = Number(body.minOrderValue) || 0;
    const maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;
    const isActive = body.isActive !== false ? 1 : 0;
    const rawSuggestionMode = body.suggestionMode || (body.isFeatured ? 'PUBLIC_1CLICK' : 'SECRET_MANUAL_ONLY');
    const isSecret = rawSuggestionMode === 'SECRET_MANUAL_ONLY' || rawCode === 'LAUNCH150';
    const suggestionMode = isSecret ? 'SECRET_MANUAL_ONLY' : 'PUBLIC_1CLICK';
    const isFeatured = isSecret ? 0 : (body.isFeatured !== false ? 1 : 0);
    const applicableFor = ['ALL', 'B2B', 'B2C'].includes(body.applicableFor) ? body.applicableFor : 'ALL';
    const targetPlatform = ['ALL', 'WEB_ONLY', 'APP_ONLY'].includes(body.targetPlatform) ? body.targetPlatform : 'ALL';
    const usedCount = Number(body.usedCount) || 0;

    let dbSaved = false;

    if (pool) {
      try {
        await ensureCouponsTable(pool);
        await pool.query(
          `INSERT INTO coupons 
           (id, code, title, description, discount_type, discount_value, min_order_value, max_discount_amount, valid_until, is_active, is_featured, applicable_for, used_count, suggestion_mode, target_platform)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title=VALUES(title),
             description=VALUES(description),
             discount_type=VALUES(discount_type),
             discount_value=VALUES(discount_value),
             min_order_value=VALUES(min_order_value),
             max_discount_amount=VALUES(max_discount_amount),
             valid_until=VALUES(valid_until),
             is_active=VALUES(is_active),
             is_featured=VALUES(is_featured),
             applicable_for=VALUES(applicable_for),
             used_count=VALUES(used_count),
             suggestion_mode=VALUES(suggestion_mode),
             target_platform=VALUES(target_platform)`,
          [
            couponId,
            rawCode,
            title,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscountAmount,
            validUntil,
            isActive,
            isFeatured,
            applicableFor,
            usedCount,
            suggestionMode,
            targetPlatform
          ]
        );
        dbSaved = true;
      } catch (dbErr) {
        console.warn('MySQL coupon save warning:', dbErr.message);
      }
    }

    if (process.env.NODE_ENV === 'production' && !dbSaved) {
      return res.status(503).json({ success: false, error: 'The coupon could not be saved to the database.' });
    }

    // Also persist to public/coupons.json & public/app-config.json
    const existing = readFallbackCoupons();
    const cleanObj = {
      id: couponId,
      code: rawCode,
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount: maxDiscountAmount || undefined,
      validUntil: validUntil ? validUntil.toISOString() : undefined,
      isActive: Boolean(isActive),
      isFeatured: Boolean(isFeatured),
      suggestionMode,
      targetPlatform,
      applicableFor,
      usedCount,
      createdAt: body.createdAt || new Date().toISOString()
    };

    const updated = [cleanObj, ...existing.filter(c => c.code !== rawCode && c.id !== couponId)];
    saveFallbackCoupons(updated);

    return res.status(200).json({
      success: true,
      message: dbSaved
        ? `Coupon code "${rawCode}" successfully saved to MySQL database!`
        : `Coupon code "${rawCode}" saved to verified storage!`,
      dbSaved,
      data: cleanObj
    });
  }

  // ----------------------------------------------------
  // DELETE: Remove Coupon
  // ----------------------------------------------------
  if (req.method === 'DELETE') {
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const targetId = (req.query?.id || body?.id || '').trim();
    const targetCode = (req.query?.code || body?.code || '').trim().toUpperCase();

    if (!targetId && !targetCode) {
      return res.status(400).json({ success: false, error: 'Provide coupon id or code to delete.' });
    }

    if (pool) {
      try {
        await pool.query('DELETE FROM coupons WHERE id = ? OR code = ?', [targetId, targetCode]);
      } catch (err) {
        console.warn('MySQL coupon delete warning:', err.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ success: false, error: 'The coupon could not be removed from the database.' });
        }
      }
    }

    const existing = readFallbackCoupons();
    const filtered = existing.filter(c => c.id !== targetId && c.code !== targetCode);
    saveFallbackCoupons(filtered);

    return res.status(200).json({
      success: true,
      message: 'Coupon removed successfully.',
      remaining: filtered.length
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
