const fs = require('fs');
const path = require('path');
const { getDbPool } = require('../database/db.js');

const COLOR_HEX_MAP = {
  'pink': '#EC4899',
  'blue': '#3B82F6',
  'orange': '#F97316',
  'green': '#10B981',
  'beige': '#D2B48C',
  'white': '#F8FAFC',
  'black': '#1E293B',
  'red': '#EF4444',
  'yellow': '#EAB308',
  'grey': '#64748B',
  'gray': '#64748B',
  'brown': '#854D0E',
  'purple': '#A855F7',
  'navy': '#1E3A8A',
  'maroon': '#881337',
  'cream': '#FFFDD0',
  'natural': '#E2D9C8',
  'multicolor': '#8B5CF6'
};

function getHexForColorName(name) {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#94A3B8';
}

function cleanProductVariants(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  const seen = new Set();
  const cleanedList = [];

  for (const v of variants) {
    let cleanName = (v.colorName || v.name || '').trim();
    let colorName = v.colorName ? v.colorName.trim() : '';

    // If name is like "Pink / 2", "Pink / 4", "Pink / 6", "Beige / 12", etc.
    if (cleanName.includes('/')) {
      const parts = cleanName.split('/').map(p => p.trim());
      
      // Check if one of the parts is a pure pack number or "pack of X"
      const nonNumberParts = parts.filter(p => !/^\d+$/.test(p) && !/^pack\s*of\s*\d+$/i.test(p));
      
      if (nonNumberParts.length === 1) {
        // e.g. "Pink / 2" -> "Pink"
        cleanName = nonNumberParts[0];
        colorName = cleanName;
      } else if (nonNumberParts.length === 2 && (parts.length === 3 || parts.length === 2)) {
        // e.g. "Pink / Small" or "26/40 / Beige / 1"
        cleanName = nonNumberParts.join(' - ');
        const foundColor = nonNumberParts.find(p => getHexForColorName(p) !== '#94A3B8');
        if (foundColor) colorName = foundColor;
      } else {
        // e.g. combo "Pink / Black"
        cleanName = nonNumberParts.join(' & ');
      }
    }

    // Strip any trailing " / 2", " Pack of 4" etc.
    cleanName = cleanName.replace(/\s*\/\s*\d+$/i, '').replace(/\s*\(?\s*pack\s+of\s+\d+\s*\)?/i, '').trim();

    if (!cleanName) continue;

    // Deduplicate by cleanName
    const dedupKey = cleanName.toLowerCase();
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const hex = v.colorHex || getHexForColorName(colorName || cleanName);

    cleanedList.push({
      id: v.id || `var-${Date.now()}-${cleanedList.length}`,
      name: cleanName,
      colorName: colorName || cleanName,
      colorHex: hex,
      sku: v.sku || '',
      priceDelta: 0, // In B2B, wholesale unit pricing is uniform across colors
      inStock: v.inStock !== false,
      stock: v.stock !== undefined ? v.stock : 500
    });
  }

  return cleanedList;
}

async function run() {
  console.log('--- Cleaning Product Variants for B2B Mill Direct ---');

  // 1. Clean public/products.json
  const pubPath = path.join(__dirname, '../public/products.json');
  if (fs.existsSync(pubPath)) {
    const products = JSON.parse(fs.readFileSync(pubPath, 'utf8'));
    let modifiedCount = 0;
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        const cleaned = cleanProductVariants(p.variants);
        if (JSON.stringify(cleaned) !== JSON.stringify(p.variants)) {
          p.variants = cleaned;
          modifiedCount++;
        }
      }
    }
    fs.writeFileSync(pubPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`Updated public/products.json: cleaned variants for ${modifiedCount} products`);
  }

  // 2. Clean dist/products.json if exists
  const distPath = path.join(__dirname, '../dist/products.json');
  if (fs.existsSync(distPath)) {
    const products = JSON.parse(fs.readFileSync(distPath, 'utf8'));
    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        p.variants = cleanProductVariants(p.variants);
      }
    }
    fs.writeFileSync(distPath, JSON.stringify(products, null, 2), 'utf8');
    console.log('Updated dist/products.json');
  }

  // 3. Update MySQL Database
  const pool = getDbPool();
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT id, slug, name, variants FROM products WHERE variants IS NOT NULL AND variants != "[]"');
      let dbUpdated = 0;
      for (const r of rows) {
        const rawVariants = typeof r.variants === 'string' ? JSON.parse(r.variants) : r.variants;
        if (Array.isArray(rawVariants) && rawVariants.length > 0) {
          const cleaned = cleanProductVariants(rawVariants);
          await pool.query('UPDATE products SET variants = ? WHERE id = ?', [JSON.stringify(cleaned), r.id]);
          dbUpdated++;
        }
      }
      console.log(`Successfully updated MySQL database: cleaned variants for ${dbUpdated} products`);
    } catch (dbErr) {
      console.error('MySQL update error:', dbErr.message);
    }
  }

  console.log('Variant cleaning completed successfully!');
  process.exit(0);
}

run();
