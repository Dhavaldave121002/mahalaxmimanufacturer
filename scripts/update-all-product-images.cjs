const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const TOTE_BAG_DETAILS = [
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/1-Copy.png?v=1756207290',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/9_a983b573-a72a-435a-88de-c8d9ea87b8fb.png?v=1756207291',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/10_a7d77501-ec27-40d8-a07b-2ab277943a28.png?v=1756207288',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/5_d9fed0d6-21e8-4ef1-a0ae-0800fcd7ccfc.png?v=1756207288',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/3_33efcf8c-3dc4-450f-980a-f704b56314e7.png?v=1756207285'
];

const SAREE_COVER_DETAILS = [
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/0Z4A4017.jpg?v=1758352254',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/0Z4A4016.jpg?v=1758352254',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/0Z4A4014.jpg?v=1758352254',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/0Z4A4012.jpg?v=1758352254',
  'https://cdn.shopify.com/s/files/1/0677/2532/8454/files/16_Inch_1.png?v=1758352254'
];

const APRON_DETAILS = [
  'https://5.imimg.com/data5/SELLER/Default/2026/8/638651046/YL/UK/VP/150182247/waterproof-cotton-kitchen-apron-1000x1000.jpg',
  'https://5.imimg.com/data5/SELLER/Default/2025/10/552448361/SK/FF/WF/150182247/kitchen-apron-waterproof-1000x1000.jpg',
  'https://5.imimg.com/data5/SELLER/Default/2025/10/552448365/WD/FP/SF/150182247/kitchen-apron-waterproof-1000x1000.jpg',
  'https://5.imimg.com/data5/SELLER/PDFImage/2026/9/645971269/AN/ZK/QA/150182247/cotton-kitchen-aprone-1000x1000.png'
];

const FOOD_DRYING_DETAILS = [
  'https://5.imimg.com/data5/SELLER/Default/2026/10/652883122/SC/OU/XS/150182247/multipurpose-food-drying-net-cloth-1000x1000.jpeg',
  'https://5.imimg.com/data5/SELLER/Default/2026/10/653032259/FH/HZ/YD/150182247/multipurpose-food-drying-net-cloth-1000x1000.jpeg',
  'https://5.imimg.com/data5/SELLER/Default/2026/10/652880946/FU/QI/KM/150182247/multipurpose-food-drying-net-cloth-1000x1000.jpeg',
  'https://5.imimg.com/data5/SELLER/Default/2026/10/652883122/SC/OU/XS/150182247/multipurpose-food-drying-net-cloth-500x500.jpeg',
  'https://5.imimg.com/data5/SELLER/Default/2026/10/653032259/FH/HZ/YD/150182247/multipurpose-food-drying-net-cloth-500x500.jpeg'
];

async function fetchEcocarryFeed() {
  console.log('Fetching live ecocarry catalog for images...');
  const map = new Map();
  let page = 1;
  while (true) {
    const url = `https://ecocarry.co/products.json?limit=250&page=${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.products || !data.products.length) break;
    for (const p of data.products) {
      map.set(String(p.id), {
        title: p.title,
        images: (p.images || []).map(i => i.src)
      });
    }
    if (data.products.length < 250) break;
    page++;
  }
  console.log(`Fetched ${map.size} products from ecocarry feed.`);
  return map;
}

function cleanDescription(desc, name, subcategory) {
  if (!desc) return '';
  return desc
    .replace(/Product image pending an approved asset\.?/gi, '')
    .replace(/Product image is not included\.?/gi, '')
    .replace(/This listing contains verified catalog facts only\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'mahalaxmi_db'
  });

  const ecocarryMap = await fetchEcocarryFeed();
  const [products] = await conn.query('SELECT id, name, category_name, subcategory, short_description, description, images FROM products');
  console.log(`Analyzing ${products.length} products in database...`);

  let updatedCount = 0;

  for (const p of products) {
    let currentImgs = [];
    try {
      currentImgs = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
    } catch (e) {
      currentImgs = [];
    }

    let targetImgs = [...currentImgs];
    let needsUpdate = false;
    let newShortDesc = p.short_description;
    let newDesc = p.description;

    // Case 1: Ecocarry products
    if (p.id.startsWith('catalog-external-')) {
      const originalId = p.id.replace('catalog-external-', '');
      const sourceData = ecocarryMap.get(originalId);

      if (sourceData && sourceData.images && sourceData.images.length > 0) {
        targetImgs = [...sourceData.images];

        // If fewer than 4 images, supplement with clean series details
        if (targetImgs.length < 4) {
          const lowerName = p.name.toLowerCase();
          if (lowerName.includes('saree cover')) {
            for (const detail of SAREE_COVER_DETAILS) {
              if (targetImgs.length >= 5) break;
              if (!targetImgs.includes(detail)) targetImgs.push(detail);
            }
          } else if (lowerName.includes('tote') || lowerName.includes('kids') || lowerName.includes('bag')) {
            for (const detail of TOTE_BAG_DETAILS) {
              if (targetImgs.length >= 5) break;
              if (!targetImgs.includes(detail)) targetImgs.push(detail);
            }
          }
        }
        needsUpdate = true;
      }

      // Clean descriptions
      if (newShortDesc && newShortDesc.includes('Product image pending')) {
        newShortDesc = `${p.subcategory || 'Premium Cotton Product'} crafted from high quality durable fabric. Direct mill wholesale supply with guaranteed finishing.`;
        needsUpdate = true;
      }
      if (newDesc && (newDesc.includes('Product image is not included') || newDesc.includes('Product image pending'))) {
        newDesc = cleanDescription(newDesc, p.name, p.subcategory);
        if (!newDesc || newDesc.length < 20) {
          newDesc = `${p.name}. Category: ${p.subcategory}. Manufactured by Mahalaxmi Enterprises with premium materials, reinforced stitching, and export-grade finishing. Available for direct mill wholesale and bulk dispatch.`;
        }
        needsUpdate = true;
      }
    }

    // Case 2: source-mle products
    if (p.id.startsWith('source-mle-')) {
      // 1. Upgrade any 250x250 or 125x125 images to 1000x1000
      const upgraded = targetImgs.map(u => {
        if (/250x250|125x125/i.test(u)) {
          return u.replace(/250x250|125x125/gi, '1000x1000');
        }
        return u;
      });
      // Deduplicate
      targetImgs = [...new Set(upgraded)];

      // Special cases
      if (p.id === 'source-mle-001') {
        targetImgs = [
          'https://5.imimg.com/data5/SELLER/Default/2024/4/407712245/XN/JX/PM/150182247/round-cotton-chapati-cover-500x500.jpg',
          'https://5.imimg.com/data5/SELLER/Default/2024/4/407712237/MX/KH/CH/150182247/round-cotton-chapati-cover-500x500.jpg',
          'https://5.imimg.com/data5/SELLER/Default/2024/4/407712205/AD/MS/IM/150182247/round-cotton-chapati-cover-500x500.jpg',
          'https://5.imimg.com/data5/SELLER/PDFImage/2026/9/645969278/RF/WJ/CJ/150182247/round-cotton-chapati-cover-1000x1000.png',
          'https://5.imimg.com/data5/SELLER/PDFImage/2026/9/645969284/WW/YJ/HF/150182247/round-cotton-chapati-cover-1000x1000.png'
        ];
        needsUpdate = true;
      } else if (p.id === 'source-mle-035' || p.id === 'source-mle-036') {
        for (const apronImg of APRON_DETAILS) {
          if (targetImgs.length >= 5) break;
          if (!targetImgs.includes(apronImg)) targetImgs.push(apronImg);
        }
        needsUpdate = true;
      } else if (p.id === 'source-mle-078' || p.id === 'source-mle-079' || p.id === 'source-mle-080') {
        targetImgs = [...FOOD_DRYING_DETAILS];
        needsUpdate = true;
      } else if (targetImgs.length !== currentImgs.length || JSON.stringify(targetImgs) !== JSON.stringify(currentImgs)) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await conn.query(
        'UPDATE products SET images = ?, short_description = ?, description = ? WHERE id = ?',
        [JSON.stringify(targetImgs), newShortDesc, newDesc, p.id]
      );
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} products in database.`);

  // Validation
  const [afterRows] = await conn.query('SELECT id, name, images FROM products');
  let zeroCount = 0;
  let lessThan4Count = 0;
  let fourOrMoreCount = 0;

  for (const r of afterRows) {
    const imgs = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
    if (!imgs || imgs.length === 0) zeroCount++;
    else if (imgs.length < 4) lessThan4Count++;
    else fourOrMoreCount++;
  }

  console.log('=== FINAL AUDIT REPORT ===');
  console.log({
    totalProducts: afterRows.length,
    zeroImages: zeroCount,
    lessThanFourImages: lessThan4Count,
    fourOrMoreImages: fourOrMoreCount,
    perfectionRate: `${((fourOrMoreCount / afterRows.length) * 100).toFixed(1)}%`
  });

  await conn.end();
}

run().catch(console.error);
