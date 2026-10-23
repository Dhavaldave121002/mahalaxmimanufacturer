import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDbPool } from '../database/db.js';
import { ensureCouponsTable } from '../api/coupons.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultCoupons = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'public', 'coupons.json'), 'utf8')
);
const pool = getDbPool();

if (!pool) {
  console.error('Coupon seeding requires a configured MySQL database.');
  process.exitCode = 1;
} else {
  try {
    await ensureCouponsTable(pool);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const coupon of defaultCoupons) {
        const secret = coupon.suggestionMode === 'SECRET_MANUAL_ONLY' ||
          coupon.code.trim().toUpperCase() === 'LAUNCH150';
        await connection.query(
          `INSERT IGNORE INTO coupons (
            id, code, title, description, discount_type, discount_value,
            min_order_value, max_discount_amount, valid_until, is_active,
            is_featured, applicable_for, usage_limit, used_count,
            suggestion_mode, target_platform, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          [
            coupon.id,
            coupon.code.trim().toUpperCase(),
            coupon.title,
            coupon.description || '',
            coupon.discountType,
            Number(coupon.discountValue),
            Number(coupon.minOrderValue || 0),
            coupon.maxDiscountAmount == null ? null : Number(coupon.maxDiscountAmount),
            coupon.validUntil || null,
            coupon.isActive === false ? 0 : 1,
            !secret && coupon.isFeatured !== false ? 1 : 0,
            coupon.applicableFor || 'ALL',
            coupon.usageLimit == null ? null : Number(coupon.usageLimit),
            secret ? 'SECRET_MANUAL_ONLY' : coupon.suggestionMode || 'PUBLIC_1CLICK',
            coupon.targetPlatform || 'ALL',
            coupon.createdAt ? new Date(coupon.createdAt) : new Date()
          ]
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    const [rows] = await pool.query('SELECT code FROM coupons ORDER BY code');
    console.log(`Default coupons are present in MySQL (${rows.length} total coupon records).`);
  } catch (error) {
    console.error('Failed to seed default coupons:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
