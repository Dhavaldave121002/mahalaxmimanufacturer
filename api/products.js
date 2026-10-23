import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession, requirePersistentDatabase } from './_lib/admin-session.js';

const CATEGORY_NAMES = {
  'home-kitchen': 'Home and Kitchen',
  household: 'Household',
  textile: 'Textile',
  'cotton-products': 'Cotton Products'
};

function readFallbackProducts() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'products.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Fallback products read failed:', e.message);
  }
  return [];
}

function saveFallbackProducts(products) {
  try {
    const pubDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
    const filePath = path.join(pubDir, 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.warn('Fallback products write skipped (read-only):', e.message);
    return false;
  }
}


let reviewsTableEnsured = false;
async function ensureReviewsTable(pool) {
  if (!pool || reviewsTableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        product_title VARCHAR(255) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        customer_email VARCHAR(150),
        rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
        comment TEXT NOT NULL,
        image_url LONGTEXT,
        status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'PENDING',
        verified_buyer TINYINT(1) DEFAULT 1,
        source VARCHAR(32) DEFAULT 'WEB',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rev_prod (product_id),
        INDEX idx_rev_email (customer_email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try {
      await pool.query(`ALTER TABLE product_reviews ADD COLUMN image_url LONGTEXT;`);
    } catch (_) {}
    reviewsTableEnsured = true;
  } catch (e) {
    console.warn('ensureReviewsTable warning:', e.message);
  }
}

function loadFallbackReviews() {
  try {
    const fPath = path.join(process.cwd(), 'private-data', 'fixtures', 'reviews.json');
    if (fs.existsSync(fPath)) {
      return JSON.parse(fs.readFileSync(fPath, 'utf8'));
    }
  } catch (_) {}
  return [
    {
      id: 'rev-01',
      product_id: 'cotton-bath-towels',
      product_title: 'Soft Cotton Bath Towels',
      customer_name: 'Harish M.',
      customer_email: 'harish@grandheritage.com',
      rating: 5.0,
      comment: 'Outstanding fabric quality and dimensional stability. Surpassed 40 industrial wash cycles with zero shrinkage. Direct mill rates saved our property over ₹45,000.',
      status: 'APPROVED',
      verified_buyer: 1,
      source: 'WEB',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString()
    },
    {
      id: 'rev-02',
      product_id: 'cotton-double-bedsheet',
      product_title: 'Cotton Double Bedsheet',
      customer_name: 'Sanjay K. (Kalyan Handlooms)',
      customer_email: 'sanjay@kalyan.in',
      rating: 5.0,
      comment: 'Packaging is clean and presentation is very premium for our retail shelves. Customers love the combed cotton hand-feel. Reordering another 50 packs today.',
      status: 'APPROVED',
      verified_buyer: 1,
      source: 'FLUTTER_APP',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    }
  ];
}

function saveFallbackReviews(revs) {
  try {
    const fPath = path.join(process.cwd(), 'private-data', 'fixtures', 'reviews.json');
    fs.writeFileSync(fPath, JSON.stringify(revs, null, 2), 'utf8');
  } catch (_) {}
}

let tableEnsured = false;
async function ensureProductsTable(pool) {
  if (!pool || tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        sku VARCHAR(64) NOT NULL UNIQUE,
        category_id VARCHAR(64) NOT NULL,
        category_name VARCHAR(64) NOT NULL,
        subcategory VARCHAR(100) NOT NULL,
        mrp DECIMAL(10,2) NOT NULL,
        retail_price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 100,
        moq INT NOT NULL DEFAULT 1,
        rating DECIMAL(3,2) DEFAULT 4.80,
        review_count INT DEFAULT 0,
        is_bestseller TINYINT(1) DEFAULT 0,
        is_direct_mill_deal TINYINT(1) DEFAULT 1,
        is_trending TINYINT(1) DEFAULT 0,
        hsn_code VARCHAR(32) DEFAULT '630221',
        gst_rate DECIMAL(4,2) DEFAULT 5.00,
        short_description TEXT,
        description TEXT,
        images JSON,
        tags JSON,
        specifications JSON,
        care_instructions JSON,
        b2b_policy JSON,
        wholesale_tiers JSON,
        variants JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sku (sku),
        INDEX idx_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    const [columns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
    );
    const columnNames = new Set(columns.map(column => column.COLUMN_NAME));
    if (!columnNames.has('care_instructions')) {
      await pool.query('ALTER TABLE products ADD COLUMN care_instructions JSON NULL');
    }
    if (!columnNames.has('b2b_policy')) {
      await pool.query('ALTER TABLE products ADD COLUMN b2b_policy JSON NULL');
    }
    if (columnNames.has('category') && !columnNames.has('category_id')) {
      await pool.query('ALTER TABLE products CHANGE COLUMN category category_id VARCHAR(64) NOT NULL');
    }
    if (columnNames.has('is_direct_mill') && !columnNames.has('is_direct_mill_deal')) {
      await pool.query('ALTER TABLE products CHANGE COLUMN is_direct_mill is_direct_mill_deal TINYINT(1) DEFAULT 1');
    }
    tableEnsured = true;
  } catch (e) {
    console.warn('ensureProductsTable warning:', e.message);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
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
  // GET: Fetch all active products
  // ----------------------------------------------------
  
  // ----------------------------------------------------
  // GET: Reviews Query Support
  // ----------------------------------------------------
  if (req.method === 'GET' && (req.query?.action === 'reviews' || req.query?.type === 'reviews')) {
    const productId = req.query?.productId || req.query?.product_id;
    const email = req.query?.email ? req.query.email.trim().toLowerCase() : null;
    const includePrivateReviews = req.query?.all === 'true' || Boolean(email);
    if (includePrivateReviews) {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      if (!requirePersistentDatabase(pool, res)) return;
    }

    if (pool) {
      try {
        await ensureReviewsTable(pool);
        let query = 'SELECT * FROM product_reviews WHERE status = "APPROVED"';
        const params = [];
        if (productId) {
          query += ' AND product_id = ?';
          params.push(productId);
        } else if (email) {
          query = 'SELECT * FROM product_reviews WHERE LOWER(customer_email) = ?';
          params.push(email);
        } else if (req.query?.all === 'true') {
          query = 'SELECT * FROM product_reviews';
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await pool.query(query, params);
        const visibleRows = includePrivateReviews
          ? rows
          : rows.map(({ customer_email: _customerEmail, ...review }) => review);
        return res.status(200).json({ success: true, count: visibleRows.length, reviews: visibleRows });
      } catch (e) {
        console.warn('MySQL reviews fetch warning:', e.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ success: false, error: 'Product reviews are unavailable.' });
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Product reviews are unavailable.' });
    }

    const fallback = loadFallbackReviews();
    const slug = req.query?.slug;
    let filtered = fallback;
    if (productId || slug) {
      filtered = fallback.filter(f =>
        (productId && (f.product_id === productId || f.productId === productId)) ||
        (slug && (f.slug === slug || f.product_id === slug)) ||
        (productId === 'prod-bedsheet-01' && (f.product_id === 'cotton-double-bedsheet' || f.slug === 'glance-300-tc-cotton-double-bedsheet')) ||
        (productId === 'prod-cotton-towel-01' && (f.product_id === 'cotton-bath-towels'))
      );
    } else if (email) {
      filtered = fallback.filter(f => (f.customer_email || '').toLowerCase() === email);
    }
    const visibleReviews = includePrivateReviews
      ? filtered
      : filtered.filter(review => review.status === 'APPROVED').map(({ customer_email: _customerEmail, ...review }) => review);
    return res.status(200).json({ success: true, count: visibleReviews.length, reviews: visibleReviews });
  }

  if (req.method === 'GET') {
    if (pool) {
      try {
        await ensureProductsTable(pool);
        const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        if (Array.isArray(rows)) {
          const formatted = rows.map(r => {
            const specifications = typeof r.specifications === 'string'
              ? JSON.parse(r.specifications)
              : (r.specifications || {});
            return {
              id: r.id,
              name: r.name,
              slug: r.slug,
              sku: r.sku,
              category: r.category_id,
              categoryName: CATEGORY_NAMES[r.category_id] || r.category_name,
              subcategory: r.subcategory,
              mrp: Number(r.mrp),
              retailPrice: Number(r.retail_price),
              stock: Number(r.stock),
              moq: Number(r.moq || 1),
              rating: Number(r.rating ?? 0),
              reviewCount: Number(r.review_count || 0),
              isBestSeller: Boolean(r.is_bestseller),
              isDirectMillDeal: Boolean(r.is_direct_mill_deal),
              isTrending: Boolean(r.is_trending),
              hsnCode: r.hsn_code || '',
              gstRate: Number(r.gst_rate ?? 0),
              shortDescription: r.short_description || '',
              description: r.description || '',
              images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
              tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
              specifications,
              careInstructions: typeof r.care_instructions === 'string'
                ? JSON.parse(r.care_instructions)
                : (r.care_instructions || []),
              b2bPolicy: typeof r.b2b_policy === 'string'
                ? JSON.parse(r.b2b_policy)
                : (r.b2b_policy || []),
              wholesaleTiers: typeof r.wholesale_tiers === 'string' ? JSON.parse(r.wholesale_tiers) : (r.wholesale_tiers || []),
              variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : (r.variants || [])
            };
          });
          return res.status(200).json({ success: true, source: 'MYSQL_DATABASE', count: formatted.length, data: formatted });
        }
      } catch (err) {
        console.warn('MySQL products query failed:', err.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ success: false, error: 'Product database is unavailable.' });
        }
      }
    }

    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Product database is unavailable.' });
    }

    const fallback = readFallbackProducts();
    return res.status(200).json({
      success: true,
      source: 'VERIFIED_STORAGE',
      count: fallback.length,
      data: fallback.map(product => ({
        ...product,
        categoryName: CATEGORY_NAMES[product.category] || product.categoryName
      }))
    });
  }

  // ----------------------------------------------------
  // POST / PUT: Create or Edit Product
  // ----------------------------------------------------
  if (req.method === 'POST' || req.method === 'PUT') {
    let p = req.body;
    if (typeof p === 'string') {
      try { p = JSON.parse(p); } catch { p = {}; }
    }
    p = p || {};

    
    // ----------------------------------------------------
    // POST ACTION: ADD REVIEW
    // ----------------------------------------------------
    if (p.action === 'add_review' || p.action === 'ADD_REVIEW') {
      if (!requirePersistentDatabase(pool, res)) return;
      const reviewId = p.id || ('rev-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
      const productId = (p.productId || p.product_id || '').trim();
      const productTitle = (p.productTitle || p.product_title || 'Direct Mill Product').trim();
      const customerName = (p.customerName || p.name || 'Valued Buyer').trim();
      const customerEmail = (p.customerEmail || p.email || '').trim().toLowerCase();
      const rating = Number(p.rating || 5.0);
      const comment = (p.comment || p.notes || '').trim();
      const imageUrl = (p.imageUrl || p.image_url || p.image || '').trim() || null;
      const source = p.source || 'WEB';

      if (!productId || !comment) {
        return res.status(400).json({ success: false, error: 'Product ID and review comment are required.' });
      }

      if (pool) {
        try {
          await ensureReviewsTable(pool);
          await pool.query(
            `INSERT INTO product_reviews 
              (id, product_id, product_title, customer_name, customer_email, rating, comment, image_url, status, verified_buyer, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)`,
            [reviewId, productId, productTitle, customerName, customerEmail, rating, comment, imageUrl, source]
          );
        } catch (dbErr) {
          console.warn('MySQL review insert warning:', dbErr.message);
          if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({ success: false, error: 'Review submission is unavailable.' });
          }
        }
      }

      const newRev = {
        id: reviewId,
        product_id: productId,
        product_title: productTitle,
        customer_name: customerName,
        customer_email: customerEmail,
        rating,
        comment,
        image_url: imageUrl,
        status: 'PENDING',
        verified_buyer: 0,
        source,
        created_at: new Date().toISOString()
      };
      if (process.env.NODE_ENV !== 'production') {
        const revList = loadFallbackReviews();
        revList.unshift(newRev);
        saveFallbackReviews(revList);
      }

      return res.status(201).json({
        success: true,
        message: 'Review submitted for moderation. Thank you for your feedback.',
        review: newRev
      });
    }

    // ----------------------------------------------------
    // POST ACTION: DELETE REVIEW (Admin)
    // ----------------------------------------------------
    if (p.action === 'delete_review') {
      const admin = await requireAdminSession(req, res);
      if (!admin) return;
      if (!requirePersistentDatabase(pool, res)) return;
      const targetId = p.id || p.reviewId;
      if (pool && targetId) {
        try {
          await pool.query('DELETE FROM product_reviews WHERE id = ?', [targetId]);
        } catch (err) {
          console.warn('MySQL review delete failed:', err.message);
          if (process.env.NODE_ENV === 'production') {
            return res.status(503).json({ success: false, error: 'Review deletion is unavailable.' });
          }
        }
      }
      if (process.env.NODE_ENV !== 'production') {
        const revList = loadFallbackReviews();
        const filtered = revList.filter(r => r.id !== targetId);
        saveFallbackReviews(filtered);
      }
      return res.status(200).json({ success: true, message: 'Review removed successfully.' });
    }

    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    if (!requirePersistentDatabase(pool, res)) return;

    if (!p.name || !p.sku) {
      return res.status(400).json({ success: false, error: 'Product name and SKU are required.' });
    }

    const id = p.id || `prod-${Date.now()}`;
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = p.category || 'textile';
    if (!Object.hasOwn(CATEGORY_NAMES, category)) {
      return res.status(400).json({ success: false, error: 'Choose one of the four supported product categories.' });
    }
    const categoryName = CATEGORY_NAMES[category];
    const subcategory = p.subcategory || 'General';
    const mrp = Number(p.mrp) || 999;
    const retailPrice = Number(p.retailPrice) || 499;
    const stock = Number.isFinite(Number(p.stock)) ? Number(p.stock) : 100;
    const rating = p.rating ?? 4.8;
    const moq = p.moq === undefined ? 1 : Number(p.moq);
    if (!Number.isSafeInteger(moq) || moq < 1) {
      return res.status(400).json({ success: false, error: 'Minimum order quantity must be a whole number of at least 1.' });
    }
    const hsnCode = p.hsnCode || '630221';
    const gstRate = Number(p.gstRate) || 5;
    const shortDescription = p.shortDescription || '';
    const description = p.description || '';
    const isBestSeller = Boolean(p.isBestSeller);
    const images = p.images || [];
    const tags = p.tags || [category];
    const specifications = p.specifications || {};
    const careInstructions = Array.isArray(p.careInstructions) ? p.careInstructions : [];
    const b2bPolicy = Array.isArray(p.b2bPolicy) ? p.b2bPolicy : [];
    const wholesaleTiers = p.wholesaleTiers || [];
    const variants = p.variants || [];

    let dbSaved = false;
    if (pool) {
      try {
        await ensureProductsTable(pool);
        await pool.query(
          `INSERT INTO products (
            id, name, slug, sku, category_id, category_name, subcategory,
            mrp, retail_price, stock, moq, rating, review_count,
            is_bestseller, hsn_code, gst_rate, short_description, description,
            images, tags, specifications, care_instructions, b2b_policy, wholesale_tiers, variants
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name=VALUES(name), slug=VALUES(slug), category_id=VALUES(category_id), category_name=VALUES(category_name),
            subcategory=VALUES(subcategory), mrp=VALUES(mrp), retail_price=VALUES(retail_price),
            stock=VALUES(stock), moq=VALUES(moq), is_bestseller=VALUES(is_bestseller),
            hsn_code=VALUES(hsn_code), gst_rate=VALUES(gst_rate),
            short_description=VALUES(short_description), description=VALUES(description),
            images=VALUES(images), tags=VALUES(tags), specifications=VALUES(specifications),
            care_instructions=VALUES(care_instructions), b2b_policy=VALUES(b2b_policy),
            wholesale_tiers=VALUES(wholesale_tiers), variants=VALUES(variants)`,
          [
            id, p.name, slug, p.sku, category, categoryName, subcategory,
            mrp, retailPrice, stock, moq, rating, p.reviewCount ?? 0, isBestSeller,
            hsnCode, gstRate, shortDescription, description,
            JSON.stringify(images), JSON.stringify(tags), JSON.stringify(specifications),
            JSON.stringify(careInstructions), JSON.stringify(b2bPolicy),
            JSON.stringify(wholesaleTiers), JSON.stringify(variants)
          ]
        );
        dbSaved = true;
      } catch (err) {
        console.warn('MySQL product save warning:', err.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ success: false, error: 'Product changes could not be saved to the database.' });
        }
      }
    }
    if (!dbSaved && process.env.NODE_ENV === 'production') {
      return res.status(503).json({ success: false, error: 'Product changes were not persisted.' });
    }

    // Persist to fallback JSON
    const existing = readFallbackProducts();
    const cleanProd = {
      ...p,
      id,
      slug,
      category,
      categoryName,
      subcategory,
      mrp,
      retailPrice,
      stock,
      moq,
      isBestSeller,
      hsnCode,
      gstRate,
      shortDescription,
      description,
      images,
      tags,
      specifications,
      careInstructions,
      b2bPolicy,
      wholesaleTiers,
      variants
    };

    const updated = [cleanProd, ...existing.filter(item => item.id !== id && item.sku !== p.sku)];
    saveFallbackProducts(updated);

    return res.status(200).json({
      success: true,
      message: dbSaved ? 'Product saved into MySQL database successfully!' : 'Product saved to verified storage successfully!',
      dbSaved,
      data: cleanProd
    });
  }

  // ----------------------------------------------------
  // PATCH: Quick Stock Adjustment
  // ----------------------------------------------------
  if (req.method === 'PATCH') {
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    if (!requirePersistentDatabase(pool, res)) return;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { id, delta } = body || {};
    if (!id || typeof delta !== 'number') {
      return res.status(400).json({ success: false, error: 'id and numeric delta are required.' });
    }

    if (pool) {
      try {
        await pool.query('UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id = ?', [delta, id]);
      } catch (e) {
        console.warn('MySQL stock adjust warning:', e.message);
        return res.status(503).json({ success: false, error: 'Stock adjustment could not be saved.' });
      }
    }

    const existing = readFallbackProducts();
    const updated = existing.map(item => item.id === id ? { ...item, stock: Math.max(0, (item.stock || 0) + delta) } : item);
    saveFallbackProducts(updated);

    return res.status(200).json({ success: true, message: 'Product stock adjusted successfully.' });
  }

  // ----------------------------------------------------
  // DELETE: Remove Product
  // ----------------------------------------------------
  if (req.method === 'DELETE') {
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    if (!requirePersistentDatabase(pool, res)) return;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const targetId = (req.query?.id || body?.id || '').trim();
    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Product id is required for deletion.' });
    }

    if (pool) {
      try {
        await pool.query('DELETE FROM products WHERE id = ?', [targetId]);
      } catch (e) {
        console.warn('MySQL product delete warning:', e.message);
        return res.status(503).json({ success: false, error: 'Product deletion could not be saved.' });
      }
    }

    const existing = readFallbackProducts();
    const filtered = existing.filter(item => item.id !== targetId);
    saveFallbackProducts(filtered);

    return res.status(200).json({ success: true, message: 'Product deleted successfully.', remaining: filtered.length });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
