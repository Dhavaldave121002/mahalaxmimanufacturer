import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';

function getFallbackFile() {
  return path.join(process.cwd(), 'private-data', 'fixtures', 'user-wishlists.json');
}

function readFallbackWishlists() {
  try {
    const file = getFallbackFile();
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {}
  return {};
}

function saveFallbackWishlists(data) {
  try {
    const file = getFallbackFile();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({
      success: false,
      error: 'Wishlist synchronization is unavailable until customer authentication is configured.'
    });
  }

  const pool = getDbPool();

  // Ensure user_wishlists table in MySQL
  if (pool) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_wishlists (
          email VARCHAR(150) PRIMARY KEY,
          product_ids JSON NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (err) {
      console.warn('MySQL user_wishlists table check warning:', err.message);
    }
  }

  // GET: Retrieve user wishlist by email
  if (req.method === 'GET') {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(200).json({ success: true, productIds: [] });
    }

    if (pool) {
      try {
        const [rows] = await pool.query(
          'SELECT product_ids FROM user_wishlists WHERE email = ?',
          [email]
        );
        if (rows && rows.length > 0) {
          let ids = rows[0].product_ids;
          if (typeof ids === 'string') {
            try { ids = JSON.parse(ids); } catch { ids = []; }
          }
          return res.status(200).json({ success: true, email, productIds: Array.isArray(ids) ? ids : [] });
        }
      } catch (err) {
        console.warn('MySQL get wishlist error:', err.message);
      }
    }

    // Fallback file lookup
    const fallback = readFallbackWishlists();
    const ids = fallback[email] || [];
    return res.status(200).json({ success: true, email, productIds: ids });
  }

  // POST: Sync user wishlist
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const email = (body.email || '').trim().toLowerCase();
    const productIds = Array.isArray(body.productIds) ? Array.from(new Set(body.productIds)) : [];

    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    // Save in MySQL
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO user_wishlists (email, product_ids) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE product_ids = VALUES(product_ids)`,
          [email, JSON.stringify(productIds)]
        );
      } catch (err) {
        console.warn('MySQL save wishlist error:', err.message);
      }
    }

    // Save in Fallback file
    const fallback = readFallbackWishlists();
    fallback[email] = productIds;
    saveFallbackWishlists(fallback);

    return res.status(200).json({
      success: true,
      message: 'Wishlist synced successfully',
      email,
      productIds,
      count: productIds.length
    });
  }

  return res.status(405).json({ success: false, message: 'Method Not Allowed' });
}
