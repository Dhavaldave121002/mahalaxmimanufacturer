import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from './_lib/admin-session.js';
import { validateCouponRecord } from './_lib/coupon-validation.js';

// Helper to read fallback coupons from public/coupons.json
export function readFallbackCoupons() {
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
export async function ensureCouponsTable(pool) {
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

function mapCouponRow(row) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description || '',
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrderValue: Number(row.min_order_value || 0),
    maxDiscountAmount: row.max_discount_amount == null ? undefined : Number(row.max_discount_amount),
    validUntil: row.valid_until ? new Date(row.valid_until).toISOString() : undefined,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured) && row.code !== 'LAUNCH150' && row.suggestion_mode !== 'SECRET_MANUAL_ONLY',
    suggestionMode: row.suggestion_mode || (row.code === 'LAUNCH150' || !row.is_featured ? 'SECRET_MANUAL_ONLY' : 'PUBLIC_1CLICK'),
    targetPlatform: row.target_platform || 'ALL',
    applicableFor: row.applicable_for || 'ALL',
    usageLimit: row.usage_limit == null ? undefined : Number(row.usage_limit),
    usedCount: Number(row.used_count || 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

function couponIsAvailable(coupon) {
  if (!coupon.is_active || (Number(coupon.usage_limit || 0) > 0 && Number(coupon.used_count || 0) >= Number(coupon.usage_limit))) {
    return false;
  }
  return !coupon.valid_until || new Date(coupon.valid_until).getTime() >= Date.now();
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
    const hasAdminCookie = (req.headers?.cookie || '').split(';')
      .some(part => part.trim().startsWith('mle_admin_session='));
    let isAdmin = false;
    if (hasAdminCookie) {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      isAdmin = true;
    }

    if (pool) {
      try {
        await ensureCouponsTable(pool);
        const [rows] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');

        const formatted = (Array.isArray(rows) ? rows : [])
          .filter(r => isAdmin || (couponIsAvailable(r) && r.suggestion_mode !== 'SECRET_MANUAL_ONLY' && r.code !== 'LAUNCH150'))
          .map(mapCouponRow);
        return res.status(200).json({
          success: true,
          source: 'MYSQL_DATABASE',
          count: formatted.length,
          data: formatted
        });
      } catch (err) {
        if (isAdmin) {
          console.error('Admin coupon query failed:', err.message);
          return res.status(503).json({ success: false, error: 'Coupon data could not be loaded from the database.' });
        }
        console.warn('MySQL coupons query failed, falling back to local file:', err.message);
      }
    }

    if (isAdmin) {
      return res.status(503).json({ success: false, error: 'Admin coupon management requires a configured database.' });
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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    if ((req.query?.action || body.action) === 'validate') {
      const code = String(body.code || '').trim().toUpperCase();
      const subtotal = Number(body.subtotal);
      const platform = String(body.platform || '').trim().toUpperCase();
      const customerType = String(body.customerType || 'B2C').trim().toUpperCase();
      if (!code || !Number.isFinite(subtotal) || subtotal < 0 || !['WEB', 'APP'].includes(platform) || !['B2B', 'B2C'].includes(customerType)) {
        return res.status(400).json({ success: false, valid: false, error: 'Coupon code, subtotal, platform, or customer type is invalid.' });
      }

      let coupon;
      if (pool) {
        try {
          await ensureCouponsTable(pool);
          const [rows] = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1', [code]);
          coupon = rows[0];
        } catch (err) {
          console.error('Coupon validation database query failed:', err.message);
          return res.status(503).json({ success: false, valid: false, error: 'Coupon validation is temporarily unavailable. Please try again.' });
        }
      } else {
        coupon = readFallbackCoupons().find(item => String(item.code || '').trim().toUpperCase() === code);
        if (coupon) {
          coupon = {
            ...coupon,
            discount_type: coupon.discountType,
            discount_value: coupon.discountValue,
            min_order_value: coupon.minOrderValue,
            max_discount_amount: coupon.maxDiscountAmount,
            valid_until: coupon.validUntil,
            is_active: coupon.isActive,
            is_featured: coupon.isFeatured,
            applicable_for: coupon.applicableFor,
            usage_limit: coupon.usageLimit,
            used_count: coupon.usedCount,
            suggestion_mode: coupon.suggestionMode,
            target_platform: coupon.targetPlatform
          };
        }
      }

      const validation = validateCouponRecord(coupon, { subtotal, platform, customerType });
      if (!validation.valid) {
        return res.status(200).json({
          success: false,
          valid: false,
          message: `${validation.message.replace('This coupon', `Coupon code "${code}"`)}`
        });
      }
      return res.status(200).json({
        success: true,
        valid: true,
        message: `Offer applied. Saved ₹${validation.discount.toLocaleString('en-IN')}.`,
        data: {
          code,
          title: coupon.title || code,
          discount: validation.discount
        }
      });
    }

    const admin = await requireAdminSession(req, res);
    if (!admin) return;
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
