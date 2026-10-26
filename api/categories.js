import { getDbPool } from '../database/db.js';
import { requireAdminSession } from './_lib/admin-session.js';

function parseCategoryBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' ? body : null;
}

function validateCategory(body, { requireId = true } = {}) {
  const id = String(body?.id || '').trim().toLowerCase();
  const name = String(body?.name || '').trim();
  const image = String(body?.image || '').trim();
  const description = String(body?.description || '').trim();
  const color = String(body?.color || '#1E293B').trim();
  const tagline = String(body?.tagline || '').trim();
  const validImage = image.startsWith('https://') || (image.startsWith('/') && !image.startsWith('//'));

  if (
    (requireId && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 50)) ||
    !name ||
    name.length > 100 ||
    !validImage ||
    image.length > 255 ||
    description.length > 5000 ||
    tagline.length > 255 ||
    !/^#[0-9A-Fa-f]{6}$/.test(color)
  ) {
    return null;
  }

  return { id, name, image, description, color, tagline };
}

function categoryResponse(row) {
  return {
    id: row.id,
    name: row.name,
    image: row.image || '',
    description: row.description || '',
    tagline: row.tagline || '',
    color: row.theme_color || '#1E293B',
    iconName: row.icon_name || 'layers',
    isFeaturedInApp: Boolean(row.is_featured_in_app),
    displayOrder: Number(row.display_order || 1)
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Categories are unavailable because the database is not configured.' });
    }

    try {
      const [rows] = await pool.query(
        `SELECT id, name, image, description, theme_color, icon_name, is_featured_in_app, display_order
         FROM categories
         ORDER BY display_order, name`
      );
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=60');
      return res.status(200).json({ success: true, categories: rows.map(categoryResponse) });
    } catch (error) {
      console.error('Category database read failed:', error);
      return res.status(503).json({ success: false, error: 'Categories are unavailable because the database could not be read.' });
    }
  }

  if (req.method === 'PUT') {
    if (!await requireAdminSession(req, res)) return;

    const body = parseCategoryBody(req.body);
    const category = validateCategory(body);
    if (!category) {
      return res.status(400).json({ success: false, error: 'Enter a valid category name and HTTPS or local image URL.' });
    }

    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Category changes require a configured database.' });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [result] = await connection.query(
        `UPDATE categories
         SET name = ?, slug = ?, image = ?, description = ?, theme_color = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          category.name,
          category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          category.image,
          category.description || null,
          category.color,
          category.id
        ]
      );
      if (!result.affectedRows) {
        const [rows] = await connection.query('SELECT id FROM categories WHERE id = ? LIMIT 1', [category.id]);
        if (!rows.length) {
          await connection.rollback();
          return res.status(404).json({ success: false, error: 'Category not found.' });
        }
      }
      await connection.query(
        'UPDATE products SET category_name = ? WHERE category_id = ?',
        [category.name, category.id]
      );
      await connection.commit();
      return res.status(200).json({ success: true, category });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'A category with that name already exists.' });
      }
      console.error('Category update failed:', error);
      return res.status(503).json({ success: false, error: 'The category could not be saved.' });
    } finally {
      connection?.release();
    }
  }

  if (req.method === 'POST') {
    if (!await requireAdminSession(req, res)) return;
    const body = parseCategoryBody(req.body);
    const category = validateCategory(body);
    if (!category) {
      return res.status(400).json({ success: false, error: 'Enter a valid category name and HTTPS or local image URL.' });
    }

    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Category changes require a configured database.' });
    }
    try {
      const [[nextOrder]] = await pool.query(
        'SELECT COALESCE(MAX(display_order), 0) + 1 AS display_order FROM categories'
      );
      const [result] = await pool.query(
        `INSERT INTO categories
         (id, name, slug, description, image, theme_color, icon_name, product_count_text, is_featured_in_app, display_order)
         VALUES (?, ?, ?, ?, ?, ?, 'layers', '0 Products', 1, ?)`,
        [
          category.id,
          category.name,
          category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          category.description || null,
          category.image,
          category.color,
          nextOrder.display_order
        ]
      );
      if (!result.affectedRows) {
        return res.status(503).json({ success: false, error: 'The category could not be created.' });
      }
      return res.status(201).json({ success: true, category });
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, error: 'A category with that name or ID already exists.' });
      }
      console.error('Category creation failed:', error);
      return res.status(503).json({ success: false, error: 'The category could not be created.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!await requireAdminSession(req, res)) return;
    const body = parseCategoryBody(req.body);
    const id = String(body?.id || '').trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 50) {
      return res.status(400).json({ success: false, error: 'Choose a valid category.' });
    }

    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Category changes require a configured database.' });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [categoryRows] = await connection.query(
        'SELECT id FROM categories WHERE id = ? FOR UPDATE',
        [id]
      );
      if (!categoryRows.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }
      const [[productCount]] = await connection.query(
        'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
        [id]
      );
      const [[collectionCount]] = await connection.query(
        'SELECT COUNT(*) AS count FROM collections WHERE parent_category_id = ?',
        [id]
      );
      if (Number(productCount.count) > 0 || Number(collectionCount.count) > 0) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          error: 'Move or remove this category’s products and collections before deleting it.'
        });
      }
      const [result] = await connection.query('DELETE FROM categories WHERE id = ?', [id]);
      if (!result.affectedRows) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }
      await connection.commit();
      return res.status(200).json({ success: true, id });
    } catch (error) {
      await connection.rollback();
      console.error('Category deletion failed:', error);
      return res.status(503).json({ success: false, error: 'The category could not be deleted.' });
    } finally {
      connection.release();
    }
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
