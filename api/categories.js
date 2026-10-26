import { getDbPool } from '../database/db.js';
import { requireAdminSession } from './_lib/admin-session.js';

const CATEGORY_IDS = new Set(['home-kitchen', 'roti-covers', 'household', 'textile', 'cotton-products']);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Categories are unavailable because the database is not configured.' });
    }

    try {
      const [rows] = await pool.query(
        `SELECT id, name, image, description, theme_color, icon_name, display_order
         FROM categories
         ORDER BY display_order, name`
      );
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ success: true, categories: rows });
    } catch (error) {
      console.error('Category database read failed:', error);
      return res.status(503).json({ success: false, error: 'Categories are unavailable because the database could not be read.' });
    }
  }

  if (req.method === 'PUT') {
    if (!await requireAdminSession(req, res)) return;

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid category update request.' });
      }
    }

    const id = String(body?.id || '').trim();
    const image = String(body?.image || '').trim();
    const isAllowedImage = image.startsWith('https://') || (image.startsWith('/') && !image.startsWith('//'));
    if (!CATEGORY_IDS.has(id) || !isAllowedImage || image.length > 255) {
      return res.status(400).json({ success: false, error: 'Choose a supported category and a valid HTTPS or local image URL (maximum 255 characters).' });
    }

    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Category changes require a configured database.' });
    }

    try {
      const [result] = await pool.query('UPDATE categories SET image = ? WHERE id = ?', [image, id]);
      if (!result.affectedRows) {
        const [rows] = await pool.query('SELECT id FROM categories WHERE id = ? LIMIT 1', [id]);
        if (!rows.length) {
          return res.status(404).json({ success: false, error: 'Category not found.' });
        }
      }
      return res.status(200).json({ success: true, category: { id, image } });
    } catch (error) {
      console.error('Category image update failed:', error);
      return res.status(503).json({ success: false, error: 'The category image could not be saved.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
