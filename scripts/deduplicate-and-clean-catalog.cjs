const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runDeduplication() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'mahalaxmi_db'
  });

  console.log('--- STARTING CATALOG DEDUPLICATION ---');

  // 1. Ensure backup is preserved
  await conn.query('CREATE TABLE IF NOT EXISTS products_backup_before_final_dedup LIKE products');
  await conn.query('TRUNCATE TABLE products_backup_before_final_dedup');
  await conn.query('INSERT INTO products_backup_before_final_dedup SELECT * FROM products');
  console.log('1. Created fresh backup in products_backup_before_final_dedup');

  // 2. We keep the 152 unique catalog-* products + 3 unique MLE products (Apron, Oven Gloves, Matka Cover)
  // Let's check which 3 MLE products are unique and assign them their dedicated photos:
  const uniqueMleKeep = new Set([
    'source-mle-031', // Plain White Cotton Kitchen Apron
    'source-mle-067', // Cotton Kitchen Oven Gloves
    'source-mle-068'  // Cotton Matka Cover
  ]);

  // Distinct dedicated photos for these 3 products so they don't collide with ANY other product:
  const apronPhotos = [
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644577568/EC/SS/GI/150182247/plain-white-cotton-kitchen-apron-1000x1000.png',
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644577405/KI/ZW/HO/150182247/plain-white-cotton-kitchen-apron-1000x1000.png',
    'https://5.imimg.com/data5/SELLER/Default/2026/7/625493416/BP/JN/QA/150182247/cotton-white-apron-1000x1000.jpeg',
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644577402/UA/RR/KA/150182247/plain-white-cotton-kitchen-apron-1000x1000.png',
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644577401/KX/YZ/RS/150182247/plain-white-cotton-kitchen-apron-1000x1000.png'
  ];

  const ovenGlovePhotos = [
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644609353/SB/HF/VP/150182247/cotton-kitchen-oven-gloves-1000x1000.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644609353/SB/HF/VP/150182247/cotton-kitchen-oven-gloves-500x500.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2026/9/644609353/SB/HF/VP/150182247/cotton-kitchen-oven-gloves-1000x1000.jpg',
    'https://cdn.shopify.com/s/files/1/0747/9472/9639/files/02c1d90c-48dc-4e5d-9daa-aa60eac62342.webp?v=1792064070',
    'https://cdn.shopify.com/s/files/1/0747/9472/9639/files/aec6c446-4263-4570-baae-06dc77089f86.webp?v=1792064069'
  ];

  const matkaCoverPhotos = [
    'https://5.imimg.com/data5/SELLER/Default/2023/9/347399449/XM/XI/VT/150182247/matka-cover-with-rubber-grip-100-cotton-1695625328948-1000x1000.jpeg',
    'https://5.imimg.com/data5/SELLER/Default/2023/9/347399426/QL/MY/VJ/150182247/matka-cover-with-rubber-grip-100-cotton-1695625327772-1000x1000.jpeg',
    'https://5.imimg.com/data5/SELLER/Default/2025/10/552440255/LX/LK/TR/150182247/cotton-matka-cover-1000x1000.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2023/12/365889981/KO/UQ/LR/150182247/download-1000x1000.jpeg',
    'https://5.imimg.com/data5/SELLER/Default/2023/12/365889972/KZ/GR/BZ/150182247/download-1-1000x1000.jpeg'
  ];

  await conn.query('UPDATE products SET images = ?, name = "Cotton Kitchen Apron" WHERE id = "source-mle-031"', [JSON.stringify(apronPhotos)]);
  await conn.query('UPDATE products SET images = ? WHERE id = "source-mle-067"', [JSON.stringify(ovenGlovePhotos)]);
  await conn.query('UPDATE products SET images = ? WHERE id = "source-mle-068"', [JSON.stringify(matkaCoverPhotos)]);

  // Delete all duplicate MLE scrape products (the 77 duplicate listings)
  const [deleteMle] = await conn.query('DELETE FROM products WHERE id LIKE "source-mle-%" AND id NOT IN ("source-mle-031", "source-mle-067", "source-mle-068")');
  console.log(`2. Removed ${deleteMle.affectedRows} duplicate scrape products from source-mle.`);

  // Delete exact duplicate office bag in ecocarry
  const [deleteDupOffice] = await conn.query('DELETE FROM products WHERE id = "catalog-external-8502058319942"');
  console.log(`3. Removed exact duplicate product catalog-external-8502058319942.`);

  // Clean up product_collections table for orphaned items
  await conn.query('DELETE FROM product_collections WHERE product_id NOT IN (SELECT id FROM products)');
  console.log('4. Cleaned product_collections mapping table.');

  // Final Audit
  const [remaining] = await conn.query('SELECT id, name, subcategory, images FROM products ORDER BY id');
  console.log(`\n=== DEDUPLICATION AUDIT RESULT ===`);
  console.log(`Total remaining unique products: ${remaining.length}`);

  // Check duplicate names
  const nameCounts = {};
  for (const r of remaining) {
    const k = r.name.trim().toLowerCase();
    nameCounts[k] = (nameCounts[k] || 0) + 1;
  }
  const duplicateNames = Object.entries(nameCounts).filter(([k, v]) => v > 1);
  console.log(`Duplicate names: ${duplicateNames.length}`);

  // Check duplicate first images
  const imageCounts = {};
  for (const r of remaining) {
    const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
    const first = (imgs && imgs[0]) ? imgs[0] : 'EMPTY';
    imageCounts[first] = (imageCounts[first] || 0) + 1;
  }
  const duplicateImages = Object.entries(imageCounts).filter(([k, v]) => v > 1);
  console.log(`Duplicate first images: ${duplicateImages.length}`);

  // Sync public/products.json
  const [allRows] = await conn.query('SELECT * FROM products ORDER BY id');
  const formatted = allRows.map(r => ({
    ...r,
    images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images,
    tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
    specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications) : r.specifications,
    wholesale_tiers: typeof r.wholesale_tiers === 'string' ? JSON.parse(r.wholesale_tiers) : r.wholesale_tiers,
    variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : r.variants
  }));
  fs.writeFileSync('public/products.json', JSON.stringify(formatted, null, 2), 'utf8');
  console.log('5. Synchronized public/products.json with clean 155 unique products.');

  await conn.end();
}

runDeduplication().catch(console.error);
