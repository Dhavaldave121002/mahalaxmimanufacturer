const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('Connecting to MySQL on 127.0.0.1:3306...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    multipleStatements: true
  });

  console.log('Creating database mahalaxmi_db if not exists...');
  await conn.query('CREATE DATABASE IF NOT EXISTS `mahalaxmi_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
  await conn.changeUser({ database: 'mahalaxmi_db' });

  console.log('Reading schema.sql...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  console.log('Executing schema.sql on mahalaxmi_db...');
  await conn.query(sqlContent);
  console.log('✅ schema.sql executed successfully!');

  // Now seed full products from mock data
  console.log('Seeding products...');
  const sampleProducts = [
    {
      id: 'prod-bedsheet-01',
      name: 'Glance 300 TC 100% Pure Combed Cotton Double Bedsheet with 2 Pillow Covers',
      slug: 'glance-300-tc-cotton-double-bedsheet',
      sku: 'MLE-TEX-BS-3001',
      category_id: 'textile',
      category_name: 'Textile',
      subcategory: 'Double Bedsheets',
      mrp: 1899,
      retail_price: 899,
      stock: 480,
      moq: 1,
      rating: 4.8,
      review_count: 312,
      is_bestseller: 1,
      is_direct_mill_deal: 1,
      is_trending: 1,
      is_app_exclusive: 1,
      hsn_code: '630221',
      gst_rate: 5.0,
      short_description: 'Direct mill woven 300 Thread Count sateen weave double bedsheet engineered for 500+ commercial wash cycles.',
      description: 'Crafted at our Surat weaving unit using long-staple Gujarat combed cotton. Comes with 2 matching Oxford pillow covers.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1000&auto=format&fit=crop'
      ]),
      tags: JSON.stringify(['bedsheet', 'cotton', 'hotel linen', 'double bedsheet', '300 tc']),
      specifications: JSON.stringify({ 'Fabric Composition': '100% Combed Cotton', 'Thread Count': '300 TC' }),
      wholesale_tiers: JSON.stringify([
        { minQty: 1, maxQty: 9, pricePerUnit: 899, savingsPercent: 0, label: 'Standard Retail' },
        { minQty: 10, maxQty: 49, pricePerUnit: 649, savingsPercent: 28, label: 'Wholesale Tier 1' },
        { minQty: 50, pricePerUnit: 489, savingsPercent: 46, label: 'Direct Mill Contract' }
      ]),
      variants: JSON.stringify([
        { id: 'v1', name: 'Royal Ivory Cream', sku: 'MLE-BS-IVY-SK', inStock: true },
        { id: 'v2', name: 'Navy Indigo Stripe', sku: 'MLE-BS-NVY-SK', inStock: true }
      ])
    },
    {
      id: 'prod-cotton-towel-01',
      name: 'Mahalaxmi Super-Plush 600 GSM 100% Cotton Bath Towel (Large Bath Sheet)',
      slug: 'mahalaxmi-600-gsm-cotton-bath-towel',
      sku: 'MLE-COT-TWL-600',
      category_id: 'cotton-products',
      category_name: 'Cotton products',
      subcategory: 'Bath Towels',
      mrp: 699,
      retail_price: 349,
      stock: 650,
      moq: 2,
      rating: 4.9,
      review_count: 420,
      is_bestseller: 1,
      is_direct_mill_deal: 1,
      is_trending: 1,
      is_app_exclusive: 1,
      hsn_code: '630260',
      gst_rate: 5.0,
      short_description: 'Hotel & Luxury Spa grade 600 GSM zero-twist terry cotton bath towel.',
      description: 'Manufactured on high-speed Sulzer terry looms at Surat textile cluster.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=1000&auto=format&fit=crop'
      ]),
      tags: JSON.stringify(['towel', 'bath towel', 'cotton towel', '600 gsm']),
      specifications: JSON.stringify({ 'GSM Weight': '600 GSM', 'Material': '100% Zero-Twist Ring-Spun Cotton' }),
      wholesale_tiers: JSON.stringify([
        { minQty: 2, maxQty: 19, pricePerUnit: 349, savingsPercent: 0, label: 'Standard Retail' },
        { minQty: 20, maxQty: 99, pricePerUnit: 265, savingsPercent: 24, label: 'Bulk Pack Tier' },
        { minQty: 100, pricePerUnit: 215, savingsPercent: 38, label: 'Mill Direct Wholesale' }
      ]),
      variants: JSON.stringify([
        { id: 'v1', name: 'Optic Hotel White', sku: 'MLE-TWL-WHT-70140', inStock: true }
      ])
    },
    {
      id: 'prod-kitchen-towel-01',
      name: 'Heavy-Duty Commercial Cotton Kitchen Cleaning Towels (Pack of 6)',
      slug: 'commercial-cotton-kitchen-towels-pack-6',
      sku: 'MLE-KIT-TWL-WAF',
      category_id: 'home-kitchen',
      category_name: 'Home and kitchen',
      subcategory: 'Kitchen Linen',
      mrp: 499,
      retail_price: 249,
      stock: 900,
      moq: 1,
      rating: 4.7,
      review_count: 184,
      is_bestseller: 1,
      is_direct_mill_deal: 1,
      is_trending: 0,
      is_app_exclusive: 1,
      hsn_code: '630291',
      gst_rate: 5.0,
      short_description: 'Lint-free waffle weave 100% cotton kitchen dish towels for restaurants and homes.',
      description: 'Absorbs 4x its weight in water, commercial grade hemmed edges to prevent fraying.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop'
      ]),
      tags: JSON.stringify(['kitchen towel', 'cotton wipes', 'waffle weave', 'restaurant towel']),
      specifications: JSON.stringify({ 'Weave': 'Honeycomb Waffle Weave', 'Pack Size': '6 Pieces' }),
      wholesale_tiers: JSON.stringify([
        { minQty: 1, maxQty: 9, pricePerUnit: 249, savingsPercent: 0, label: 'Standard Retail' },
        { minQty: 10, maxQty: 49, pricePerUnit: 179, savingsPercent: 28, label: 'Catering / Cafe Tier' },
        { minQty: 50, pricePerUnit: 139, savingsPercent: 44, label: 'Commercial Mill Carton' }
      ]),
      variants: JSON.stringify([])
    },
    {
      id: 'prod-microfiber-01',
      name: 'Ultra-Fine 350 GSM Multipurpose Household Cleaning Cloths (Pack of 4)',
      slug: 'ultrafine-350-gsm-microfiber-cleaning-cloths',
      sku: 'MLE-HSD-MF-350',
      category_id: 'household',
      category_name: 'Household',
      subcategory: 'Cleaning Supplies',
      mrp: 399,
      retail_price: 189,
      stock: 1200,
      moq: 1,
      rating: 4.8,
      review_count: 245,
      is_bestseller: 1,
      is_direct_mill_deal: 1,
      is_trending: 1,
      is_app_exclusive: 1,
      hsn_code: '630710',
      gst_rate: 12.0,
      short_description: 'Streak-free, scratch-free 80/20 microfiber wipes for glass, kitchen slabs, and furniture.',
      description: 'Over 200,000 micro-fibers per sq. inch to grab fine dust and grease without harsh chemicals.',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=1000&auto=format&fit=crop'
      ]),
      tags: JSON.stringify(['microfiber', 'cleaning cloth', 'household', 'dusting cloth']),
      specifications: JSON.stringify({ 'Composition': '80% Polyester / 20% Polyamide', 'GSM': '350 GSM' }),
      wholesale_tiers: JSON.stringify([
        { minQty: 1, maxQty: 9, pricePerUnit: 189, savingsPercent: 0, label: 'Retail Pack' },
        { minQty: 10, maxQty: 49, pricePerUnit: 129, savingsPercent: 32, label: 'Facility Management Tier' },
        { minQty: 50, pricePerUnit: 99, savingsPercent: 48, label: 'Direct Mill Bale' }
      ]),
      variants: JSON.stringify([])
    }
  ];

  for (const p of sampleProducts) {
    await conn.query(
      `INSERT INTO products (
        id, name, slug, sku, category_id, category_name, subcategory,
        mrp, retail_price, stock, moq, rating, review_count,
        is_bestseller, is_direct_mill_deal, is_trending, is_app_exclusive,
        hsn_code, gst_rate, short_description, description,
        images, tags, specifications, wholesale_tiers, variants
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), retail_price=VALUES(retail_price), stock=VALUES(stock)`,
      [
        p.id, p.name, p.slug, p.sku, p.category_id, p.category_name, p.subcategory,
        p.mrp, p.retail_price, p.stock, p.moq, p.rating, p.review_count,
        p.is_bestseller, p.is_direct_mill_deal, p.is_trending, p.is_app_exclusive,
        p.hsn_code, p.gst_rate, p.short_description, p.description,
        p.images, p.tags, p.specifications, p.wholesale_tiers, p.variants
      ]
    );
  }
  console.log(`✅ Seeded ${sampleProducts.length} core products into MySQL!`);

  // Seed sample order from Flutter App
  console.log('Seeding sample mobile order...');
  await conn.query(
    `INSERT INTO orders (
      id, order_number, user_id, source, device_info, customer_name, customer_email, customer_phone,
      company_name, is_b2b, subtotal, cgst, sgst, igst, total_tax, shipping_charge, discount, coupon_code,
      total_amount, payment_method, payment_status, status, shipping_address, billing_address, timeline
    ) VALUES (
      'ord-app-77102', 'MLE-APP-2026-77102', 'usr-flutter-dhaval', 'FLUTTER_APP',
      'Android 14 (Mahalaxmi Flutter App v1.0.3)', 'Dhaval Dave', 'dhavaldave121002@gmail.com', '8511172099',
      'Mahalaxmi Enterprise Client Hub', 0, 3194.00, 79.85, 79.85, 0.00, 159.70, 0.00, 150.00, 'LAUNCH150',
      3203.70, 'UPI', 'PAID', 'MILL_PROCESSING',
      '{"fullName":"Dhaval Dave","phone":"8511172099","street":"102, Shivalik Plaza, Near C.G. Road","city":"Ahmedabad","state":"Gujarat","pincode":"380009"}',
      '{"fullName":"Dhaval Dave","phone":"8511172099","street":"102, Shivalik Plaza, Near C.G. Road","city":"Ahmedabad","state":"Gujarat","pincode":"380009"}',
      '[{"status":"PLACED","description":"Order placed from Android Flutter App v1.0.3 via UPI GPay."},{"status":"MILL_PROCESSING","description":"Surat Central Dispatch Unit 1 allocated."}]'
    ) ON DUPLICATE KEY UPDATE status=VALUES(status)`
  );
  console.log('✅ Mobile app sample order seeded!');

  // Check table list
  const [tables] = await conn.query('SHOW TABLES');
  console.log('--- ALL TABLES IN mahalaxmi_db ---');
  tables.forEach(t => console.log('TABLE:', Object.values(t)[0]));

  await conn.end();
  console.log('🎉 ALL DONE! MySQL Database is 100% Ready and Populated!');
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
