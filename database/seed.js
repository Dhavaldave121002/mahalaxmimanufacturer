import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbPool, testDbConnection } from './db.js';
import { INITIAL_PRODUCTS } from '../src/data/mockProducts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  console.log('--- Mahalaxmi Enterprises MySQL Auto-Migration & Seed ---');
  const connTest = await testDbConnection();
  if (!connTest.connected) {
    console.error('❌ Connection Failed:', connTest.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL successfully!');

  const pool = getDbPool();
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

  // Split multiple SQL statements
  const statements = schemaSql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (e) {
      console.warn('Notice executing statement:', e.message);
    }
  }
  console.log('✅ MySQL Tables Created & Base Config Seeded!');

  // Seed Products
  for (const p of INITIAL_PRODUCTS) {
    try {
      await pool.query(
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
          p.id,
          p.name,
          p.slug,
          p.sku,
          p.category,
          p.categoryName,
          p.subcategory,
          p.mrp,
          p.retailPrice,
          p.stock,
          p.moq,
          p.rating,
          p.reviewCount,
          p.isBestSeller ? 1 : 0,
          p.isDirectMillDeal ? 1 : 0,
          p.isTrending ? 1 : 0,
          1,
          p.hsnCode,
          p.gstRate,
          p.shortDescription,
          p.description,
          JSON.stringify(p.images),
          JSON.stringify(p.tags),
          JSON.stringify(p.specifications),
          JSON.stringify(p.wholesaleTiers),
          JSON.stringify(p.variants || [])
        ]
      );
    } catch (err) {
      console.error(`Error inserting product ${p.name}:`, err.message);
    }
  }

  console.log('🎉 Full Migration & Seed Complete! Total products seeded:', INITIAL_PRODUCTS.length);
  process.exit(0);
}

runSeed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
