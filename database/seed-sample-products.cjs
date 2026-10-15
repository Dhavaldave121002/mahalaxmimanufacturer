const { getDbPool } = require('../database/db.js');

async function seedSamplesIntoMySQL() {
  console.log('Connecting to MySQL to insert Sample Product & Sample Bundle...');
  const pool = getDbPool();
  if (!pool) {
    console.error('MySQL pool unavailable!');
    process.exit(1);
  }

  const sampleProducts = [
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
      is_direct_mill_deal: 1,
      is_trending: 1,
      is_app_exclusive: 0,
      hsn_code: '630790',
      gst_rate: 5.00,
      short_description: '12 curated fabric swatches including 300 TC Combed Cotton, 600 GSM Terry, Canvas & Microfiber with Mill Quality Certificate.',
      description: 'Designed specifically for B2B procurement managers, hotel executives, and retail shop owners. Feel the hand-touch, inspect GSM weights, test bleach tolerance, and verify weave density before committing to large commercial orders. Includes ₹199 discount code applicable on your first wholesale order.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop'
      ]),
      tags: JSON.stringify(['swatch', 'sample', 'fabric sample', 'mill kit', 'b2b testing']),
      specifications: JSON.stringify({
        'Contents': '12 Fabric Swatches (15x15 cm each)',
        'Included Materials': '300 TC Combed Sateen, 210 TC Percale, 600 GSM Combed Terry, 380 GSM Canvas, 350 GSM Microfiber',
        'Documentation': 'Mill Technical Test Report & Fabric Weight (GSM) Certificate',
        'Rebate Policy': '₹199 Cash Coupon included for your next order > ₹5,000'
      }),
      wholesale_tiers: JSON.stringify([
        { minQty: 1, maxQty: 5, pricePerUnit: 199, savingsPercent: 60, label: 'Standard Sample Box' },
        { minQty: 6, pricePerUnit: 149, savingsPercent: 70, label: 'Multi-Location Audit Kit' }
      ]),
      variants: JSON.stringify([
        { id: 'v-swatch-std', name: 'Standard 12 Swatches Set', priceModifier: 0 }
      ])
    },
    {
      id: 'prod-sample-bundle-all',
      name: 'Mahalaxmi Complete Commercial Sample Bundle (All 4 Categories Swatch & Product Minis Box)',
      slug: 'mill-commercial-sample-bundle',
      sku: 'MLE-BUNDLE-SMP-01',
      category_id: 'textile',
      category_name: 'Textile',
      subcategory: 'Sample Bundles',
      mrp: 999.00,
      retail_price: 299.00,
      stock: 200,
      moq: 1,
      rating: 5.00,
      review_count: 310,
      is_bestseller: 1,
      is_direct_mill_deal: 1,
      is_trending: 1,
      is_app_exclusive: 0,
      hsn_code: '630790',
      gst_rate: 5.00,
      short_description: 'The ultimate commercial evaluation box: 12 fabric swatches + 4 actual product minis across Home, Textile, Cotton & Household with ₹300 Rebate Voucher.',
      description: 'Procurement-grade sample bundle designed for corporate clients, hospitality chains, and garment retailers. Includes: (1) Full set of 12 luxury fabric swatches, (2) One 600 GSM Cotton Hand Towel, (3) One Heavy-Duty Microfiber Cloth, (4) One Chef-Grade Kitchen Wipe, and (5) Mill Technical Report & Lab Certification. Fully refundable via an included ₹300 coupon code on your first wholesale order.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop'
      ]),
      tags: JSON.stringify(['sample bundle', 'sample pack', 'swatch kit', 'commercial sample', 'b2b testing', 'bundle']),
      specifications: JSON.stringify({
        'Bundle Contents': '12 Swatches (15x15cm) + 1 Cotton Towel + 1 Microfiber + 1 Kitchen Wipe',
        'Quality Standard': 'ISO 9001:2015 & Oeko-Tex Standard 100 Certified',
        'Rebate Guarantee': '100% Refundable via ₹300 Instant Voucher on next bulk order',
        'Dispatch Speed': 'Same-Day Air Express Dispatch from Surat Mill'
      }),
      wholesale_tiers: JSON.stringify([
        { minQty: 1, maxQty: 3, pricePerUnit: 299, savingsPercent: 70, label: 'Single Sample Bundle' },
        { minQty: 4, pricePerUnit: 249, savingsPercent: 75, label: 'Multi-Branch Audit Pack' }
      ]),
      variants: JSON.stringify([
        { id: 'v-bundle-deluxe', name: 'All-4 Categories Deluxe Box', priceModifier: 0 }
      ])
    }
  ];

  for (const p of sampleProducts) {
    await pool.query(
      `INSERT INTO products (
        id, name, slug, sku, category_id, category_name, subcategory,
        mrp, retail_price, stock, moq, rating, review_count,
        is_bestseller, is_direct_mill_deal, is_trending, is_app_exclusive,
        hsn_code, gst_rate, short_description, description, images, tags, specifications, wholesale_tiers, variants
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), retail_price=VALUES(retail_price), mrp=VALUES(mrp),
        short_description=VALUES(short_description), description=VALUES(description),
        images=VALUES(images), tags=VALUES(tags), specifications=VALUES(specifications), wholesale_tiers=VALUES(wholesale_tiers)`,
      [
        p.id, p.name, p.slug, p.sku, p.category_id, p.category_name, p.subcategory,
        p.mrp, p.retail_price, p.stock, p.moq, p.rating, p.review_count,
        p.is_bestseller, p.is_direct_mill_deal, p.is_trending, p.is_app_exclusive,
        p.hsn_code, p.gst_rate, p.short_description, p.description, p.images, p.tags, p.specifications, p.wholesale_tiers, p.variants
      ]
    );
    console.log(`✅ Seeded/Updated in MySQL: ${p.name} (₹${p.retail_price})`);
  }

  const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM products');
  console.log(`Total products in MySQL database: ${totalRows[0].total}`);
  process.exit(0);
}

seedSamplesIntoMySQL().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
