const { getDbPool } = require('../database/db.js');

async function seedNotification() {
  const pool = getDbPool();
  if (!pool) {
    console.error('No DB pool available');
    process.exit(1);
  }

  const sampleNotifications = [
    {
      id: 'notif-1',
      title: 'Diwali Mill Sale is Live! 🎉',
      message: 'Direct factory rates now active across all 300 TC Combed Cotton Double Bedsheets and Towels.',
      target_category: 'Textile',
      type: 'OFFER'
    },
    {
      id: 'notif-2',
      title: 'Real-Time Mill Database Connected ⚡',
      message: 'Mobile app and web store are now linked directly to central inventory.',
      target_category: 'All',
      type: 'SYSTEM'
    }
  ];

  for (const n of sampleNotifications) {
    await pool.query(
      `INSERT INTO app_notifications (id, title, message, target_category, type, is_sent)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE title=VALUES(title), message=VALUES(message)`,
      [n.id, n.title, n.message, n.target_category, n.type]
    );
  }

  const [rows] = await pool.query('SELECT * FROM app_notifications');
  console.log('Seeded notifications successfully! Total count:', rows.length);
  console.log(rows);
  process.exit(0);
}

seedNotification().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
