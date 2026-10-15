import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool = null;

export function getDbPool() {
  if (pool) return pool;

  const dbHost = process.env.MYSQL_HOST || process.env.DB_HOST;
  const dbUser = process.env.MYSQL_USER || process.env.DB_USER;
  const dbPassword = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
  const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'mahalaxmi_db';
  const dbPort = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

  // If running with connection URI (e.g., PlanetScale / Railway / AWS URI)
  const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (connectionUri) {
    pool = mysql.createPool({
      uri: connectionUri,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
    return pool;
  }

  // If host parameters exist
  if (dbHost && dbUser) {
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
    return pool;
  }

  return null;
}

export async function testDbConnection() {
  const p = getDbPool();
  if (!p) {
    return {
      connected: false,
      message: 'No MySQL credentials configured. Please set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in .env'
    };
  }

  try {
    const [rows] = await p.query('SELECT 1 + 1 AS solution');
    return {
      connected: true,
      message: 'MySQL Database Connected Successfully! Solution: ' + rows[0].solution,
      host: process.env.MYSQL_HOST || 'via DATABASE_URL',
      database: process.env.MYSQL_DATABASE || 'default'
    };
  } catch (err) {
    return {
      connected: false,
      message: 'MySQL Connection Error: ' + err.message
    };
  }
}
