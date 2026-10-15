import { getDbPool } from '../database/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const pool = getDbPool();

  if (req.method === 'GET') {
    if (!pool) {
      // If no DB configured yet, return status message
      return res.status(200).json({
        source: 'FALLBACK_STATIC',
        message: 'MySQL pool uninitialized. Configure MYSQL_HOST in .env for live query.'
      });
    }

    try {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      const formatted = rows.map(r => ({
        ...r,
        images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
        specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications) : r.specifications,
        wholesaleTiers: typeof r.wholesale_tiers === 'string' ? JSON.parse(r.wholesale_tiers) : r.wholesale_tiers,
        variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : r.variants
      }));
      return res.status(200).json({ source: 'MYSQL_DATABASE', count: formatted.length, data: formatted });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (!pool) {
      return res.status(503).json({ error: 'MySQL not connected' });
    }

    const p = req.body;
    try {
      await pool.query(
        `INSERT INTO products (
          id, name, slug, sku, category_id, category_name, subcategory,
          mrp, retail_price, stock, moq, rating, review_count,
          hsn_code, gst_rate, short_description, description,
          images, tags, specifications, wholesale_tiers, variants
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id || `prod-${Date.now()}`,
          p.name,
          p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          p.sku,
          p.category,
          p.categoryName,
          p.subcategory,
          p.mrp,
          p.retailPrice,
          p.stock,
          p.moq || 1,
          p.rating || 4.8,
          p.reviewCount || 0,
          p.hsnCode || '630221',
          p.gstRate || 5.0,
          p.shortDescription || '',
          p.description || '',
          JSON.stringify(p.images || []),
          JSON.stringify(p.tags || []),
          JSON.stringify(p.specifications || {}),
          JSON.stringify(p.wholesaleTiers || []),
          JSON.stringify(p.variants || [])
        ]
      );
      return res.status(201).json({ success: true, message: 'Product inserted into MySQL successfully!' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
