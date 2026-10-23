const mysql = require('mysql2/promise');
require('dotenv').config();

const CORE_CATEGORIES = [
  { id: 'home-kitchen', name: 'Home and Kitchen', slug: 'home-kitchen' },
  { id: 'household', name: 'Household', slug: 'household' },
  { id: 'textile', name: 'Textile', slug: 'textile' },
  { id: 'cotton-products', name: 'Cotton Products', slug: 'cotton-products' }
].map(category => ({ ...category, collectionId: `core-${category.id}` }));

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
  if (!host || !user || password === undefined) {
    throw new Error('Database connection settings are missing.');
  }

  return {
    host,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user,
    password,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mahalaxmi_db',
    connectionLimit: 2,
    connectTimeout: 3000,
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  };
}

async function main() {
  const pool = mysql.createPool(getDatabaseConfig());
  let connection;
  let transactionOpen = false;

  try {
    connection = await pool.getConnection();
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('categories', 'products', 'collections', 'product_collections')`
    );
    const tableNames = new Set(tables.map(table => table.TABLE_NAME));
    for (const table of ['categories', 'products', 'collections', 'product_collections']) {
      if (!tableNames.has(table)) throw new Error(`Required database table "${table}" does not exist.`);
    }

    const [categoryRows] = await connection.query(
      'SELECT id, name, description, image FROM categories WHERE id IN (?)',
      [CORE_CATEGORIES.map(category => category.id)]
    );
    const categoryRowsById = new Map(categoryRows.map(category => [category.id, category]));
    const missingCategories = CORE_CATEGORIES.filter(category => !categoryRowsById.has(category.id));
    if (missingCategories.length) {
      throw new Error(`Required core categories are missing: ${missingCategories.map(category => category.id).join(', ')}.`);
    }

    const [products] = await connection.query('SELECT id, category_id FROM products ORDER BY id');
    if (!products.length) throw new Error('No products were found; refusing to create empty collections.');
    const categoryIds = new Set(CORE_CATEGORIES.map(category => category.id));
    const unsupportedProducts = products.filter(product => !categoryIds.has(product.category_id));
    if (unsupportedProducts.length) {
      throw new Error(
        `${unsupportedProducts.length} products use unsupported categories; refusing to guess their assignments.`
      );
    }

    const [collectionCounts] = await connection.query(
      'SELECT COUNT(*) AS count FROM collections'
    );
    const [linkCounts] = await connection.query(
      'SELECT COUNT(*) AS count FROM product_collections'
    );
    const productCounts = Object.fromEntries(
      CORE_CATEGORIES.map(category => [
        category.id,
        products.filter(product => product.category_id === category.id).length
      ])
    );
    const summary = {
      mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
      currentCollections: Number(collectionCounts[0].count),
      currentProductCollectionLinks: Number(linkCounts[0].count),
      collectionsAfterSync: CORE_CATEGORIES.length,
      productsPreserved: products.length,
      linksAfterSync: products.length,
      productsPerCollection: productCounts,
      categories: CORE_CATEGORIES.map(({ id, name, collectionId }) => ({ id, name, collectionId }))
    };

    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify({ ...summary, databaseChanged: false }, null, 2));
      return;
    }

    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const collectionsBackup = `collections_backup_core_four_${stamp}`;
    const linksBackup = `product_collections_backup_core_four_${stamp}`;
    await connection.query(`CREATE TABLE \`${collectionsBackup}\` LIKE collections`);
    await connection.query(`INSERT INTO \`${collectionsBackup}\` SELECT * FROM collections`);
    await connection.query(`CREATE TABLE \`${linksBackup}\` LIKE product_collections`);
    await connection.query(`INSERT INTO \`${linksBackup}\` SELECT * FROM product_collections`);

    const [archivedCollections] = await connection.query(
      `SELECT COUNT(*) AS count FROM \`${collectionsBackup}\``
    );
    const [archivedLinks] = await connection.query(
      `SELECT COUNT(*) AS count FROM \`${linksBackup}\``
    );
    if (Number(archivedCollections[0].count) !== summary.currentCollections ||
        Number(archivedLinks[0].count) !== summary.currentProductCollectionLinks) {
      throw new Error('Collection backup verification failed; live data was not changed.');
    }

    await connection.beginTransaction();
    transactionOpen = true;

    for (const category of CORE_CATEGORIES) {
      await connection.query(
        'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
        [category.name, category.slug, category.id]
      );
    }
    await connection.query('DELETE FROM product_collections');
    await connection.query('DELETE FROM collections');

    for (const [index, category] of CORE_CATEGORIES.entries()) {
      const parent = categoryRowsById.get(category.id);
      await connection.query(
        `INSERT INTO collections (id, name, slug, parent_category_id, description, image, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          category.collectionId,
          category.name,
          category.slug,
          category.id,
          parent.description || `${category.name} products`,
          parent.image || '',
          index + 1
        ]
      );
    }

    const collectionIdByCategory = new Map(
      CORE_CATEGORIES.map(category => [category.id, category.collectionId])
    );
    for (const product of products) {
      await connection.query(
        'INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)',
        [product.id, collectionIdByCategory.get(product.category_id)]
      );
      await connection.query(
        'UPDATE products SET category_name = ? WHERE id = ?',
        [CORE_CATEGORIES.find(category => category.id === product.category_id).name, product.id]
      );
    }

    const [verifiedCollections] = await connection.query(
      'SELECT id, parent_category_id FROM collections ORDER BY display_order'
    );
    const [verifiedLinks] = await connection.query(
      'SELECT COUNT(*) AS count, COUNT(DISTINCT product_id) AS products FROM product_collections'
    );
    if (verifiedCollections.length !== CORE_CATEGORIES.length ||
        Number(verifiedLinks[0].count) !== products.length ||
        Number(verifiedLinks[0].products) !== products.length) {
      throw new Error('Post-sync verification failed; rolling back database changes.');
    }

    await connection.commit();
    transactionOpen = false;
    console.log(JSON.stringify({
      ...summary,
      mode: 'applied',
      databaseChanged: true,
      verifiedCollections: verifiedCollections.map(row => row.id),
      archivedCollections,
      archivedProductCollectionLinks: linksBackup,
      archivedCollectionTable: collectionsBackup
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
  console.error(`Core collection sync failed: ${error.message}`);
  process.exitCode = 1;
});
