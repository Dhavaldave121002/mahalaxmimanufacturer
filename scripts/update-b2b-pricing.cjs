const fs = require('fs');
const path = require('path');
const { getDbPool } = require('../database/db.js');

function calculateB2BPricing(product) {
  const sub = (product.subcategory || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const cat = (product.category_name || product.category_id || '').toLowerCase();

  let mrp = 399;
  let basePrice = 119;
  let moq = 50;
  let unitText = 'per piece';

  // 1. Roti Covers / Chapati Covers / Casserole
  if (
    sub.includes('roti') ||
    name.includes('roti') ||
    sub.includes('chapati') ||
    name.includes('chapati') ||
    sub.includes('casserole') ||
    name.includes('pot cover') ||
    name.includes('tiffin')
  ) {
    mrp = 199;
    basePrice = 45;
    moq = 50;
    unitText = 'per piece';
  }
  // 2. Vegetable / Net / Mesh Bags / Produce Bags / Idli cloth / Cheese cloth / Drying cloth
  else if (
    sub.includes('vegetable') ||
    name.includes('vegetable') ||
    name.includes('net bag') ||
    name.includes('mesh bag') ||
    sub.includes('drying net') ||
    name.includes('drying cloth') ||
    name.includes('idli cloth') ||
    name.includes('cheese cloth') ||
    name.includes('dry')
  ) {
    mrp = 149;
    basePrice = 24;
    moq = 100;
    unitText = 'per piece';
  }
  // 3. Saree Covers / Organizers / Hamper Bags / Shoe Bags / Paper Bags / Drawstring
  else if (
    sub.includes('saree') ||
    name.includes('saree') ||
    sub.includes('organizer') ||
    sub.includes('hamper') ||
    name.includes('hamper') ||
    sub.includes('shoe bag') ||
    sub.includes('paper bag') ||
    sub.includes('drawstring') ||
    name.includes('drawstring')
  ) {
    mrp = 249;
    basePrice = 65;
    moq = 50;
    unitText = 'per piece';
  }
  // 4. Aprons, Oven Gloves, Lunch Bags, Baskets
  else if (
    sub.includes('apron') ||
    name.includes('apron') ||
    sub.includes('glove') ||
    name.includes('glove') ||
    sub.includes('lunch') ||
    name.includes('lunch') ||
    sub.includes('basket')
  ) {
    mrp = 349;
    basePrice = 85;
    moq = 25;
    unitText = 'per piece';
  }
  // 5. Bundles & Sets
  else if (
    sub.includes('bundle') ||
    name.includes('bundle') ||
    sub.includes('set') ||
    name.includes('set of') ||
    sub.includes('bundles')
  ) {
    mrp = 799;
    basePrice = 240;
    moq = 20;
    unitText = 'per set';
  }
  // 6. Heavy Canvas Tote / Hand Bags
  else if (
    name.includes('canvas') ||
    sub.includes('canvas') ||
    sub.includes('hand bag') ||
    name.includes('hand bag') ||
    name.includes('peacock') ||
    name.includes('premium')
  ) {
    mrp = 499;
    basePrice = 139;
    moq = 50;
    unitText = 'per piece';
  }
  // 7. Standard / Printed / Botanical / Floral Tote Bags (Majority of textile catalog)
  else if (sub.includes('tote') || name.includes('tote') || cat.includes('textile')) {
    mrp = 399;
    basePrice = 119;
    moq = 50;
    unitText = 'per piece';
  }
  // 8. General / Fallback
  else {
    mrp = 299;
    basePrice = 75;
    moq = 50;
    unitText = 'per piece';
  }

  // Sample Products special handling (MOQ = 1)
  if (product.id.includes('sample') || product.id.includes('swatch')) {
    mrp = 299;
    basePrice = 99;
    moq = 1;
    unitText = 'per kit';
  }

  // Volume Tiers based on MOQ
  let t1Min, t1Max, t2Min, t2Max, t3Min, t3Max, t4Min;

  if (moq >= 100) {
    t1Min = 100; t1Max = 249;
    t2Min = 250; t2Max = 499;
    t3Min = 500; t3Max = 999;
    t4Min = 1000;
  } else if (moq >= 50) {
    t1Min = 50; t1Max = 99;
    t2Min = 100; t2Max = 249;
    t3Min = 250; t3Max = 499;
    t4Min = 500;
  } else if (moq >= 20) {
    t1Min = moq; t1Max = 49;
    t2Min = 50; t2Max = 99;
    t3Min = 100; t3Max = 249;
    t4Min = 250;
  } else {
    t1Min = 1; t1Max = 9;
    t2Min = 10; t2Max = 49;
    t3Min = 50; t3Max = 99;
    t4Min = 100;
  }

  const t1Price = Math.round(basePrice);
  const t2Price = Math.max(1, Math.round(basePrice * 0.90));
  const t2Savings = Math.round(((t1Price - t2Price) / t1Price) * 100);

  const t3Price = Math.max(1, Math.round(basePrice * 0.81));
  const t3Savings = Math.round(((t1Price - t3Price) / t1Price) * 100);

  const t4Price = Math.max(1, Math.round(basePrice * 0.72));
  const t4Savings = Math.round(((t1Price - t4Price) / t1Price) * 100);

  const wholesaleTiers = [
    {
      minQty: t1Min,
      maxQty: t1Max,
      pricePerUnit: t1Price,
      savingsPercent: 0,
      label: `Base B2B (${t1Min}-${t1Max} pcs)`
    },
    {
      minQty: t2Min,
      maxQty: t2Max,
      pricePerUnit: t2Price,
      savingsPercent: t2Savings,
      label: `Bulk Wholesale (${t2Min}-${t2Max} pcs)`
    },
    {
      minQty: t3Min,
      maxQty: t3Max,
      pricePerUnit: t3Price,
      savingsPercent: t3Savings,
      label: `Super Bulk (${t3Min}-${t3Max} pcs)`
    },
    {
      minQty: t4Min,
      pricePerUnit: t4Price,
      savingsPercent: t4Savings,
      label: `Direct Mill Deal (${t4Min}+ pcs)`
    }
  ];

  return { mrp, retail_price: t1Price, moq, wholesaleTiers, unitText };
}

async function run() {
  console.log('--- Starting B2B Pricing Update ---');
  const productsPath = path.join(__dirname, '..', 'public', 'products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  const pool = getDbPool();

  let updatedCount = 0;
  for (const p of products) {
    const pricing = calculateB2BPricing(p);
    p.mrp = pricing.mrp.toFixed(2);
    p.retail_price = pricing.retail_price.toFixed(2);
    p.moq = pricing.moq;
    p.wholesale_tiers = pricing.wholesaleTiers;
    p.wholesaleTiers = pricing.wholesaleTiers;
    p.unitText = pricing.unitText;

    if (pool) {
      try {
        await pool.query(
          `UPDATE products SET mrp = ?, retail_price = ?, moq = ?, wholesale_tiers = ? WHERE id = ?`,
          [
            pricing.mrp,
            pricing.retail_price,
            pricing.moq,
            JSON.stringify(pricing.wholesaleTiers),
            p.id
          ]
        );
      } catch (err) {
        console.warn(`DB update error for ${p.id}:`, err.message);
      }
    }
    updatedCount++;
  }

  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
  console.log(`✅ Updated ${updatedCount} products in public/products.json and MySQL database!`);

  // Sample check
  console.log('Sample updated products:');
  console.log(
    products.slice(0, 4).map(x => ({
      name: x.name,
      mrp: x.mrp,
      wholesaleRate: x.retail_price,
      moq: x.moq,
      tiers: x.wholesale_tiers.map(t => `${t.label}: ₹${t.pricePerUnit}`)
    }))
  );

  if (pool) {
    await pool.end();
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
