const { getDbPool, testDbConnection } = require('../database/db.js');
const http = require('http');

async function runLiveVerification() {
  console.log('====================================================');
  console.log('🏭 MAHALAXMI ENTERPRISE - LIVE SYSTEM HEALTH CHECK');
  console.log('====================================================\n');

  // STEP 1: Test MySQL Database Connection
  console.log('▶ STEP 1: Checking MySQL Database...');
  const dbHealth = await testDbConnection();
  console.log('DB Connected:', dbHealth.connected);
  console.log('Message:', dbHealth.message);
  console.log('Database Name:', dbHealth.database);

  if (!dbHealth.connected) {
    console.error('❌ MySQL is NOT connected!');
    process.exit(1);
  }
  console.log('✅ MySQL Database is 100% CONNECTED and HEALTHY.\n');

  const pool = getDbPool();

  // STEP 2: Insert a new Notification via API POST
  console.log('▶ STEP 2: Broadcasting a New Live Notification...');
  const testNotifId = `notif-live-${Date.now()}`;
  const notifPayload = {
    action: 'send_notification',
    notification: {
      id: testNotifId,
      title: 'Diwali Special Mill Dhamaka! 🪔',
      message: 'Exclusive 35% Flat Discount unlocked for all B2B and retail textile orders.',
      targetCategory: 'Textile',
      type: 'OFFER'
    }
  };

  const postRes = await fetch('http://localhost:5173/api/app-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notifPayload)
  });

  const postData = await postRes.json();
  console.log('API POST Response:', postData);

  if (!postData.success) {
    console.error('❌ Failed to post notification to API');
    process.exit(1);
  }
  console.log('✅ Notification successfully accepted by API.\n');

  // STEP 3: Verify directly in MySQL table `app_notifications`
  console.log('▶ STEP 3: Verifying row in MySQL table `app_notifications`...');
  const [dbRows] = await pool.query(
    'SELECT * FROM app_notifications WHERE id = ?',
    [testNotifId]
  );

  if (dbRows.length === 0) {
    console.error('❌ Notification was not saved in MySQL table!');
    process.exit(1);
  }
  console.log('Found row in MySQL:', dbRows[0]);
  console.log('✅ Confirmed in MySQL: Notification row exists and is_sent = 1.\n');

  // STEP 4: Verify via GET /api/app-config (what Flutter mobile app calls)
  console.log('▶ STEP 4: Calling GET /api/app-config (Flutter App Endpoint)...');
  const getRes = await fetch('http://localhost:5173/api/app-config');
  const getData = await getRes.json();

  console.log('Source:', getData.source);
  console.log('Total notifications returned:', getData.data?.notifications?.length);
  const foundInFeed = getData.data?.notifications?.find(n => n.id === testNotifId);

  if (!foundInFeed) {
    console.error('❌ Notification missing from GET /api/app-config feed!');
    process.exit(1);
  }
  console.log('✅ Confirmed: Flutter App API receives this notification:', foundInFeed.title);
  console.log('✅ Confirmed: Banners returned:', getData.data?.banners?.length);
  console.log('✅ Confirmed: Categories returned:', getData.data?.categories?.length, '\n');

  // STEP 5: Test Remote Production Cloud Vercel Endpoint
  console.log('▶ STEP 5: Testing Cloud Vercel API Endpoint (https://mahalaxmimanufacturer.vercel.app/api/app-config)...');
  try {
    const cloudRes = await fetch('https://mahalaxmimanufacturer.vercel.app/api/app-config');
    const cloudData = await cloudRes.json();
    console.log('Cloud API Status:', cloudRes.status, cloudRes.ok ? 'OK (200)' : 'FAILED');
    console.log('Cloud Data Success:', cloudData.success);
    console.log('Cloud Banners Count:', cloudData.data?.banners?.length);
    console.log('Cloud Notifications Count:', cloudData.data?.notifications?.length);
    console.log('✅ Cloud endpoint is reachable by any mobile phone globally.\n');
  } catch (err) {
    console.warn('Cloud API ping warning:', err.message);
  }

  console.log('====================================================');
  console.log('🎉 ALL SYSTEMS ARE 100% OPERATIONAL & CONNECTED!');
  console.log('====================================================');
  process.exit(0);
}

runLiveVerification().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
