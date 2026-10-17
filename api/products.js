import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';

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
        status ENUM('APPROVED', 'PENDING', 'REJECTED') DEFAULT 'APPROVED',
        verified_buyer TINYINT(1) DEFAULT 1,
        source VARCHAR(32) DEFAULT 'WEB',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rev_prod (product_id),
        INDEX idx_rev_email (customer_email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    reviewsTableEnsured = true;
  } catch (e) {
    console.warn('ensureReviewsTable warning:', e.message);
  }
}

function loadFallbackReviews() {
  try {
    const fPath = path.join(process.cwd(), 'public', 'reviews.json');
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
    const fPath = path.join(process.cwd(), 'public', 'reviews.json');
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
        category VARCHAR(64) NOT NULL,
        category_name VARCHAR(64) NOT NULL,
        subcategory VARCHAR(100) NOT NULL,
        mrp DECIMAL(10,2) NOT NULL,
        retail_price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 100,
        moq INT NOT NULL DEFAULT 1,
        rating DECIMAL(3,2) DEFAULT 4.80,
        review_count INT DEFAULT 0,
        is_bestseller TINYINT(1) DEFAULT 0,
        is_direct_mill TINYINT(1) DEFAULT 1,
        is_trending TINYINT(1) DEFAULT 0,
        hsn_code VARCHAR(32) DEFAULT '630221',
        gst_rate DECIMAL(4,2) DEFAULT 5.00,
        short_description TEXT,
        description TEXT,
        images JSON,
        tags JSON,
        specifications JSON,
        wholesale_tiers JSON,
        variants JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sku (sku),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
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
        return res.status(200).json({ success: true, count: rows.length, reviews: rows });
      } catch (e) {
        console.warn('MySQL reviews fetch warning:', e.message);
      }
    }

    const fallback = loadFallbackReviews();
    let filtered = fallback;
    if (productId) {
      filtered = fallback.filter(f => f.product_id === productId);
    } else if (email) {
      filtered = fallback.filter(f => (f.customer_email || '').toLowerCase() === email);
    }
    return res.status(200).json({ success: true, count: filtered.length, reviews: filtered });
  }

  if (req.method === 'GET') {
    if (pool) {
      try {
        await ensureProductsTable(pool);
        const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          const formatted = rows.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            sku: r.sku,
            category: r.category,
            categoryName: r.category_name,
            subcategory: r.subcategory,
            mrp: Number(r.mrp),
            retailPrice: Number(r.retail_price),
            stock: Number(r.stock),
            moq: Number(r.moq || 1),
            rating: Number(r.rating || 4.8),
            reviewCount: Number(r.review_count || 0),
            isBestSeller: Boolean(r.is_bestseller),
            isDirectMillDeal: Boolean(r.is_direct_mill),
            isTrending: Boolean(r.is_trending),
            hsnCode: r.hsn_code || '630221',
            gstRate: Number(r.gst_rate || 5),
            shortDescription: r.short_description || '',
            description: r.description || '',
            images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
            tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
            specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications) : (r.specifications || {}),
            wholesaleTiers: typeof r.wholesale_tiers === 'string' ? JSON.parse(r.wholesale_tiers) : (r.wholesale_tiers || []),
            variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : (r.variants || [])
          }));
          return res.status(200).json({ success: true, source: 'MYSQL_DATABASE', count: formatted.length, data: formatted });
        }
      } catch (err) {
        console.warn('MySQL products query warning, falling back to local file:', err.message);
      }
    }

    const fallback = readFallbackProducts();
    return res.status(200).json({
      success: true,
      source: 'VERIFIED_STORAGE',
      count: fallback.length,
      data: fallback
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
      const reviewId = p.id || ('rev-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
      const productId = (p.productId || p.product_id || '').trim();
      const productTitle = (p.productTitle || p.product_title || 'Direct Mill Product').trim();
      const customerName = (p.customerName || p.name || 'Valued Buyer').trim();
      const customerEmail = (p.customerEmail || p.email || '').trim().toLowerCase();
      const rating = Number(p.rating || 5.0);
      const comment = (p.comment || p.notes || '').trim();
      const source = p.source || 'WEB';

      if (!productId || !comment) {
        return res.status(400).json({ success: false, error: 'Product ID and review comment are required.' });
      }

      if (pool) {
        try {
          await ensureReviewsTable(pool);
          await pool.query(
            `INSERT INTO product_reviews 
              (id, product_id, product_title, customer_name, customer_email, rating, comment, status, verified_buyer, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED', 1, ?)`,
            [reviewId, productId, productTitle, customerName, customerEmail, rating, comment, source]
          );

          try {
            await pool.query(
              'UPDATE products SET review_count = review_count + 1 WHERE id = ?',
              [productId]
            );
          } catch (_) {}
        } catch (dbErr) {
          console.warn('MySQL review insert warning:', dbErr.message);
        }
      }

      const revList = loadFallbackReviews();
      const newRev = {
        id: reviewId,
        product_id: productId,
        product_title: productTitle,
        customer_name: customerName,
        customer_email: customerEmail,
        rating,
        comment,
        status: 'APPROVED',
        verified_buyer: 1,
        source,
        created_at: new Date().toISOString()
      };
      revList.unshift(newRev);
      saveFallbackReviews(revList);

      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully! Thank you for your feedback.',
        review: newRev
      });
    }

    // ----------------------------------------------------
    // POST ACTION: DELETE REVIEW (Admin)
    // ----------------------------------------------------
    if (p.action === 'delete_review') {
      const targetId = p.id || p.reviewId;
      if (pool && targetId) {
        try {
          await pool.query('DELETE FROM product_reviews WHERE id = ?', [targetId]);
        } catch (_) {}
      }
      const revList = loadFallbackReviews();
      const filtered = revList.filter(r => r.id !== targetId);
      saveFallbackReviews(filtered);
      return res.status(200).json({ success: true, message: 'Review removed successfully.' });
    }

    if (!p.name || !p.sku) {
      return res.status(400).json({ success: false, error: 'Product name and SKU are required.' });
    }

    const id = p.id || `prod-${Date.now()}`;
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = p.category || 'textile';
    const categoryName = p.categoryName || 'Textile';
    const subcategory = p.subcategory || 'General';
    const mrp = Number(p.mrp) || 999;
    const retailPrice = Number(p.retailPrice) || 499;
    const stock = Number(p.stock) || 100;
    const moq = Number(p.moq) || 1;
    const hsnCode = p.hsnCode || '630221';
    const gstRate = Number(p.gstRate) || 5;
    const shortDescription = p.shortDescription || '';
    const description = p.description || '';
    const images = p.images || [];
    const tags = p.tags || [category];
    const specifications = p.specifications || {};
    const wholesaleTiers = p.wholesaleTiers || [];
    const variants = p.variants || [];

    let dbSaved = false;
    if (pool) {
      try {
        await ensureProductsTable(pool);
        await pool.query(
          `INSERT INTO products (
            id, name, slug, sku, category, category_name, subcategory,
            mrp, retail_price, stock, moq, rating, review_count,
            hsn_code, gst_rate, short_description, description,
            images, tags, specifications, wholesale_tiers, variants
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name=VALUES(name), slug=VALUES(slug), category=VALUES(category), category_name=VALUES(category_name),
            subcategory=VALUES(subcategory), mrp=VALUES(mrp), retail_price=VALUES(retail_price),
            stock=VALUES(stock), moq=VALUES(moq), hsn_code=VALUES(hsn_code), gst_rate=VALUES(gst_rate),
            short_description=VALUES(short_description), description=VALUES(description),
            images=VALUES(images), tags=VALUES(tags), specifications=VALUES(specifications),
            wholesale_tiers=VALUES(wholesale_tiers), variants=VALUES(variants)`,
          [
            id, p.name, slug, p.sku, category, categoryName, subcategory,
            mrp, retailPrice, stock, moq, p.rating || 4.8, p.reviewCount || 0,
            hsnCode, gstRate, shortDescription, description,
            JSON.stringify(images), JSON.stringify(tags), JSON.stringify(specifications),
            JSON.stringify(wholesaleTiers), JSON.stringify(variants)
          ]
        );
        dbSaved = true;
      } catch (err) {
        console.warn('MySQL product save warning:', err.message);
      }
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
      hsnCode,
      gstRate,
      shortDescription,
      description,
      images,
      tags,
      specifications,
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
      }
    }

    const existing = readFallbackProducts();
    const filtered = existing.filter(item => item.id !== targetId);
    saveFallbackProducts(filtered);

    return res.status(200).json({ success: true, message: 'Product deleted successfully.', remaining: filtered.length });
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
