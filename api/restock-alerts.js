import { getDbPool } from '../database/db.js';
import {
  ensureRestockSubscriptionsTable,
  notifyRestockSubscribers
} from './_lib/restock-alerts.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const productId = String(body?.productId || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  if (!productId) {
    return res.status(400).json({ success: false, error: 'Product is required.' });
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
  }

  const pool = getDbPool();
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: 'Restock alerts are temporarily unavailable. Please try again later.'
    });
  }

  try {
    await ensureRestockSubscriptionsTable(pool);
    const connection = await pool.getConnection();
    let product;
    try {
      await connection.beginTransaction();
      const [products] = await connection.query(
        'SELECT id, stock FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
        [productId]
      );
      product = products[0];
      if (!product) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: 'This product could not be found.' });
      }

      await connection.query(
        `INSERT INTO product_restock_subscriptions (product_id, customer_email, status)
         VALUES (?, ?, 'PENDING')
         ON DUPLICATE KEY UPDATE
           status = IF(status = 'SENDING', 'SENDING', 'PENDING'),
           created_at = CURRENT_TIMESTAMP,
           notified_at = NULL`,
        [productId, email]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const deliveredNow = Number(product.stock) > 0
      ? await notifyRestockSubscribers(pool, productId)
      : 0;

    return res.status(200).json({
      success: true,
      message: Number(product.stock) > 0 && deliveredNow > 0
        ? 'This product is already back in stock. We sent the availability email just now.'
        : Number(product.stock) > 0
          ? 'This product is already back in stock. Please refresh the page to check availability.'
        : 'You are subscribed. We will email you when this product is back in stock.'
    });
  } catch (error) {
    console.error('Restock alert subscription failed:', error);
    return res.status(503).json({
      success: false,
      error: 'Could not save your restock alert. Please try again later.'
    });
  }
}
