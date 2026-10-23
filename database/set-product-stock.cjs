const mysql = require('mysql2/promise');
require('dotenv').config();

const TARGET_STOCK = 10000;

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
  if (!host || !user) {
    throw new Error('Database connection settings are missing.');
  }

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

async function main() {
  const pool = mysql.createPool(getDatabaseConfig());
  let connection;
  let transactionOpen = false;

  try {
    connection = await pool.getConnection();
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`
    );
    if (!tables.length) throw new Error('Required database table "products" does not exist.');

    const [counts] = await connection.query(
      `SELECT COUNT(*) AS total, SUM(stock <> ?) AS toUpdate
       FROM products`,
      [TARGET_STOCK]
    );
    const total = Number(counts[0].total);
    const toUpdate = Number(counts[0].toUpdate || 0);
    if (!total) throw new Error('No products were found; refusing to update an empty catalogue.');

    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify({
        mode: 'dry-run',
        products: total,
        productsToUpdate: toUpdate,
        targetStock: TARGET_STOCK,
        databaseChanged: false,
        nextStep: 'Run with --apply to back up existing stock values and update all products.'
      }, null, 2));
      return;
    }

    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const backupTable = `product_stock_backup_${stamp}`;
    await connection.query(
      `CREATE TABLE \`${backupTable}\` (
        product_id VARCHAR(50) NOT NULL PRIMARY KEY,
        previous_stock INT NOT NULL
      ) ENGINE=InnoDB`
    );

    await connection.beginTransaction();
    transactionOpen = true;

    await connection.query(
      `INSERT INTO \`${backupTable}\` (product_id, previous_stock)
       SELECT id, stock FROM products`
    );
    const [backupCounts] = await connection.query(
      `SELECT COUNT(*) AS count FROM \`${backupTable}\``
    );
    if (Number(backupCounts[0].count) !== total) {
      throw new Error('Stock backup verification failed; rolling back the update.');
    }

    await connection.query('UPDATE products SET stock = ?', [TARGET_STOCK]);
    const [verifiedCounts] = await connection.query(
      'SELECT COUNT(*) AS total, SUM(stock <> ?) AS notUpdated FROM products',
      [TARGET_STOCK]
    );
    if (Number(verifiedCounts[0].total) !== total || Number(verifiedCounts[0].notUpdated || 0) !== 0) {
      throw new Error('Post-update verification failed; rolling back the stock update.');
    }

    await connection.commit();
    transactionOpen = false;
    console.log(JSON.stringify({
      mode: 'apply',
      productsUpdated: total,
      stock: TARGET_STOCK,
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
  console.error('Product stock update failed:', error.message);
  process.exitCode = 1;
});
