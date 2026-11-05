import { getDbPool } from '../database/db.js';

async function migrateUserPaginationIndex() {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('MySQL credentials are required to add the users pagination index.');
  }

  try {
    const [indexes] = await pool.query(
      'SHOW INDEX FROM users WHERE Key_name = ?',
      ['idx_users_created_id']
    );
    if (indexes.length === 0) {
      await pool.query('CREATE INDEX idx_users_created_id ON users (created_at, id)');
      console.log('Created idx_users_created_id on users.');
    } else {
      console.log('idx_users_created_id already exists.');
    }
  } finally {
    await pool.end();
  }
}

migrateUserPaginationIndex().catch(error => {
  console.error('Failed to migrate users pagination index:', error.message);
  process.exitCode = 1;
});
