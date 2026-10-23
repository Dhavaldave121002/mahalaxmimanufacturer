const mysql = require('mysql2/promise');
require('dotenv').config();

function getDatabaseConfig() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (url) {
    return {
      uri: url,
      connectionLimit: 2,
      connectTimeout: 3000,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };
  }

  const host = process.env.MYSQL_HOST || process.env.DB_HOST;
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
  if (!host || !user) throw new Error('Database connection settings are missing.');

  return {
    host,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user,
    password: password || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mahalaxmi_db',
    connectionLimit: 2,
    connectTimeout: 3000,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
}

function careInstructionsFor(product) {
  const name = `${product.name} ${product.subcategory}`.toLowerCase();
  const material = String(product.specifications?.['Material / Fabric'] || '').toLowerCase();

  if (name.includes('shower cap') || material.includes('pvc')) {
    return [
      'Rinse or wipe clean with cool water and mild soap after use.',
      'Air-dry fully inside out before storing.',
      'Do not machine-wash, iron, or expose to high heat.',
      'Check for cracks or damage and replace if the material deteriorates.'
    ];
  }

  if (name.includes('bamboo')) {
    return [
      'Wipe with a soft, lightly damp cloth; do not soak or put in a dishwasher.',
      'Dry immediately and let air circulate around the basket.',
      'Keep away from prolonged dampness and direct high heat.',
      'Do not use bleach or abrasive scouring pads.'
    ];
  }

  if (name.includes('oven glove')) {
    return [
      'Let the gloves cool completely before cleaning or storing.',
      'Follow the sewn-in care label; if none is provided, spot-clean gently with mild soap.',
      'Let dry completely before reuse; do not use gloves that are wet or damaged.',
      'Use only within the product’s stated heat rating; fabric gloves are not protection from open flames.'
    ];
  }

  if (name.includes('waterproof') && (name.includes('apron') || name.includes('cover'))) {
    return [
      'Wipe clean after use; hand-wash gently in cool water when needed.',
      'Use mild soap and avoid bleach, solvents, and abrasive cleaners.',
      'Air-dry fully; do not tumble-dry or iron the water-resistant surface.',
      'Follow the product label if it gives different coating-care instructions.'
    ];
  }

  if (
    name.includes('chapati') ||
    name.includes('roti') ||
    name.includes('idli') ||
    name.includes('papad') ||
    name.includes('food drying') ||
    name.includes('matka cover')
  ) {
    return [
      'Wash before first use and after each food-contact use.',
      'Wash gently in cool water with mild detergent; avoid bleach.',
      'Rinse thoroughly and air-dry completely before using or storing.',
      'Do not store damp; follow the care label if it specifies a different wash method.'
    ];
  }

  if (
    name.includes('vegetable') ||
    name.includes('fridge') ||
    name.includes('fruit') ||
    name.includes('storage bag') ||
    name.includes('mesh bag') ||
    name.includes('drying net')
  ) {
    if (material.includes('nylon') || material.includes('polyester') || material.includes('polypropylene') || material.includes(' pp')) {
      return [
        'Empty and rinse after use; hand-wash with cool water and mild soap.',
        'Rinse thoroughly and air-dry completely before reuse or storage.',
        'Avoid bleach, high heat, ironing, dishwashers, and hot liquids unless the product label permits them.',
        'Do not store food in the bag while it is damp or visibly soiled.'
      ];
    }
    return [
      'Empty and shake out crumbs or debris after use.',
      'Wash gently in cool water with mild detergent; avoid bleach.',
      'Air-dry completely before reuse or storing food.',
      'Follow the sewn-in care label if it specifies a different wash method.'
    ];
  }

  if (
    name.includes('organizer') ||
    name.includes('shoe bag') ||
    name.includes('pouch') ||
    name.includes('saree cover') ||
    name.includes('carry bag') ||
    name.includes('tote') ||
    name.includes('handbag')
  ) {
    if (material.includes('non woven') || material.includes('non-woven') || material.includes('pvc')) {
      return [
        'Wipe clean with a soft cloth and mild soapy water.',
        'Do not machine-wash, soak, bleach, or scrub the material.',
        'Air-dry fully before folding or storing.',
        'Keep away from high heat and follow any care label attached to the product.'
      ];
    }
    return [
      'Spot-clean or hand-wash in cool water with mild detergent.',
      'Turn printed items inside out and close zippers before washing.',
      'Do not bleach; air-dry in shade and reshape while damp.',
      'Iron on a low setting only if the care label permits; avoid direct heat on prints.'
    ];
  }

  if (material.includes('nylon') || material.includes('polyester') || material.includes('polypropylene')) {
    return [
      'Clean gently with cool water and mild soap.',
      'Rinse thoroughly and air-dry completely before storing.',
      'Avoid bleach, ironing, and high heat unless the product label says otherwise.',
      'Do not store while damp.'
    ];
  }

  return [
    'Wash gently in cool water with mild detergent; follow the product care label.',
    'Avoid bleach and harsh stain removers.',
    'Air-dry in shade and make sure the item is fully dry before storing.',
    'Iron on a low setting only if the product label permits.'
  ];
}

function parseJson(value, field, productId) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid ${field} JSON for product ${productId}; refusing to update.`);
  }
}

async function main() {
  const pool = mysql.createPool(getDatabaseConfig());
  let connection;
  let transactionOpen = false;

  try {
    connection = await pool.getConnection();
    const [products] = await connection.query(
      'SELECT id, name, subcategory, specifications, care_instructions FROM products ORDER BY id'
    );
    if (!products.length) throw new Error('No products found; refusing to seed an empty catalog.');

    const updates = products
      .map(product => {
        const careInstructions = parseJson(product.care_instructions, 'care instructions', product.id);
        if (Array.isArray(careInstructions) && careInstructions.length > 0) return null;
        const specifications = parseJson(product.specifications, 'specifications', product.id) || {};
        return {
          ...product,
          specifications,
          careInstructions: careInstructionsFor({ ...product, specifications })
        };
      })
      .filter(Boolean);

    const summary = {
      mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
      products: products.length,
      productsNeedingCare: updates.length,
      instructionsPerProduct: updates.length ? 4 : 0,
      databaseChanged: false
    };

    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }
    if (!updates.length) {
      console.log(JSON.stringify({ ...summary, verified: true, message: 'All products already have care instructions.' }, null, 2));
      return;
    }

    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const backupTable = `product_care_backup_${stamp}`;
    await connection.query(
      `CREATE TABLE \`${backupTable}\` AS
       SELECT id, care_instructions FROM products WHERE 1 = 0`
    );
    await connection.beginTransaction();
    transactionOpen = true;
    await connection.query(
      `INSERT INTO \`${backupTable}\` (id, care_instructions)
       SELECT id, care_instructions FROM products`
    );
    const [backupCount] = await connection.query(`SELECT COUNT(*) AS count FROM \`${backupTable}\``);
    if (Number(backupCount[0].count) !== products.length) {
      throw new Error('Care instructions backup verification failed; rolling back.');
    }

    for (const product of updates) {
      await connection.query(
        `UPDATE products SET care_instructions = ?
         WHERE id = ? AND (care_instructions IS NULL OR JSON_LENGTH(care_instructions) = 0)`,
        [JSON.stringify(product.careInstructions), product.id]
      );
    }

    const [verifiedProducts] = await connection.query(
      'SELECT id, care_instructions FROM products ORDER BY id'
    );
    const missing = verifiedProducts.filter(product => {
      const instructions = parseJson(product.care_instructions, 'care instructions', product.id);
      return !Array.isArray(instructions) || instructions.length === 0;
    });
    if (missing.length) {
      throw new Error(`${missing.length} products still lack care instructions; rolling back.`);
    }

    await connection.commit();
    transactionOpen = false;
    console.log(JSON.stringify({
      ...summary,
      databaseChanged: true,
      productsUpdated: updates.length,
      backupTable,
      verified: true
    }, null, 2));
  } catch (error) {
    if (transactionOpen) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Product care seeding failed:', error.message);
  process.exitCode = 1;
});
