import { getDbPool } from '../database/db.js';

const STATIC_FALLBACK_PRODUCTS = [
  {
    id: 'prod-swatch-box-01',
    name: 'Mahalaxmi Official Mill Fabric Swatch & Quality Assurance Sample Kit (100% Refundable)',
    slug: 'mill-fabric-swatch-sample-kit',
    sku: 'MLE-SWATCH-KIT-01',
    category_id: 'textile',
    category_name: 'Textile',
    subcategory: 'Fabrics & Swatches',
    mrp: 499.00,
    retail_price: 199.00,
    stock: 150,
    moq: 1,
    rating: 4.90,
    review_count: 420,
    is_bestseller: 1,
    is_direct_mill: 1,
    hsn_code: '630221',
    gst_rate: 5.00,
    short_description: 'Examine authentic mill fabric GSM weight, weaving density, and color fastness before bulk orders. 100% credited back on first wholesale order!',
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800'],
    tags: ['Sample', 'Swatch Kit', 'Quality Assurance', 'Refundable'],
    specifications: { 'Kit Contents': '20+ Authentic Fabric Swatches', 'Return Policy': '100% Refundable via Coupon' },
    wholesale_tiers: [{ minQuantity: 1, price: 199 }, { minQuantity: 5, price: 179 }]
  },
  {
    id: 'prod-sample-bundle-01',
    name: 'Mahalaxmi Complete Commercial Sample Bundle (All 4 Categories Swatch & Product Minis Box)',
    slug: 'commercial-sample-bundle-all-categories',
    sku: 'MLE-BUNDLE-SAMPLE-01',
    category_id: 'sample-bundles',
    category_name: 'Sample Bundles',
    subcategory: 'Commercial Kits',
    mrp: 799.00,
    retail_price: 299.00,
    stock: 100,
    moq: 1,
    rating: 4.95,
    review_count: 512,
    is_bestseller: 1,
    is_direct_mill: 1,
    hsn_code: '630221',
    gst_rate: 5.00,
    short_description: 'Complete commercial sample kit covering Bedding, Towels, Corporate Uniforms, and Custom Fabrics. 100% credited back on bulk order.',
    images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800'],
    tags: ['Sample Bundle', 'Wholesale Review', 'All Categories', 'Refundable'],
    specifications: { 'Categories Included': 'Bedding, Towels, Uniforms, Fabrics', 'Guarantee': '100% Credited Back' },
    wholesale_tiers: [{ minQuantity: 1, price: 299 }, { minQuantity: 3, price: 269 }]
  },
  {
    id: 'prod-bedsheet-01',
    name: 'Glance 300 TC 100% Pure Combed Cotton Double Bedsheet with 2 Pillow Covers',
    slug: 'glance-300tc-cotton-double-bedsheet',
    sku: 'MLE-BED-300TC-01',
    category_id: 'bedding',
    category_name: 'Bedding',
    subcategory: 'Bedsheets',
    mrp: 1499.00,
    retail_price: 699.00,
    stock: 500,
    moq: 10,
    rating: 4.80,
    review_count: 128,
    is_bestseller: 1,
    is_direct_mill: 1,
    hsn_code: '630221',
    gst_rate: 5.00,
    short_description: 'Luxury hotel quality 300 thread count combed cotton bedsheet. Breathable, durable and color-fast.',
    images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'],
    tags: ['Bedsheet', '300 TC', 'Cotton', 'Hospitality Grade'],
    specifications: { 'Fabric': '100% Pure Combed Cotton', 'Thread Count': '300 TC', 'Size': 'Double (90x100 inches)' },
    wholesale_tiers: [{ minQuantity: 10, price: 549 }, { minQuantity: 50, price: 499 }, { minQuantity: 200, price: 449 }]
  },
  {
    id: 'prod-towel-01',
    name: 'Premium 500 GSM Zero Twist Extra Absorbent Cotton Bath Towels',
    slug: 'premium-500-gsm-bath-towels',
    sku: 'MLE-TWL-500GSM-01',
    category_id: 'towels',
    category_name: 'Towels',
    subcategory: 'Bath Towels',
    mrp: 699.00,
    retail_price: 349.00,
    stock: 800,
    moq: 20,
    rating: 4.90,
    review_count: 245,
    is_bestseller: 1,
    is_direct_mill: 1,
    hsn_code: '630260',
    gst_rate: 5.00,
    short_description: 'Plush, quick-drying 500 GSM ring-spun cotton towels for luxury hotels and retail.',
    images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800'],
    tags: ['Towels', '500 GSM', 'Hotel Collection'],
    specifications: { 'Material': '100% Ring-Spun Cotton', 'GSM': '500 GSM', 'Dimensions': '70x140 cm' },
    wholesale_tiers: [{ minQuantity: 20, price: 279 }, { minQuantity: 100, price: 249 }, { minQuantity: 500, price: 219 }]
  }
];

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
      // If no DB configured yet, return rich fallback products list with 200 OK
      return res.status(200).json({
        success: true,
        source: 'FALLBACK_STATIC',
        count: STATIC_FALLBACK_PRODUCTS.length,
        data: STATIC_FALLBACK_PRODUCTS
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
      return res.status(200).json({ success: true, source: 'MYSQL_DATABASE', count: formatted.length, data: formatted });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    if (!pool) {
      return res.status(503).json({ success: false, error: 'MySQL not connected' });
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
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
