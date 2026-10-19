const mysql = require('mysql2/promise');

async function migrate() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'mahalaxmi_db'
    });
    console.log('Connected to MySQL mahalaxmi_db...');
    const [cols] = await conn.query('SHOW COLUMNS FROM users');
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes('wallet_balance')) {
      console.log('Adding wallet_balance column to users table...');
      await conn.query('ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12,2) DEFAULT 0.00 AFTER available_credit');
      console.log('✅ Added wallet_balance column successfully.');
    } else {
      console.log('wallet_balance column already exists.');
    }

    if (!colNames.includes('wallet_transactions')) {
      console.log('Adding wallet_transactions column to users table...');
      await conn.query('ALTER TABLE users ADD COLUMN wallet_transactions JSON AFTER wallet_balance');
      console.log('✅ Added wallet_transactions column successfully.');
    } else {
      console.log('wallet_transactions column already exists.');
    }

    await conn.end();
    console.log('🎉 Wallet migration completed successfully!');
  } catch (err) {
    console.warn('MySQL connection/migration warning:', err.message);
  }
}

migrate();
