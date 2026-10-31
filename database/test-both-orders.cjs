const { getDbPool, testDbConnection } = require('../database/db.js');

async function testBothOrdersEndToEnd() {
  console.log('================================================================');
  console.log('🛍️  MAHALAXMI ENTERPRISE - END-TO-END ORDERS VERIFICATION TEST');
  console.log('================================================================\n');

  // Verify DB
  const pool = getDbPool();
  if (!pool) {
    console.error('❌ Database pool unavailable!');
    process.exit(1);
  }

  // -------------------------------------------------------------
  // TEST 1: Place an Order from Website (WEB)
  // -------------------------------------------------------------
  console.log('▶ TEST 1: Simulating Order Placement from WEBSITE (WEB Storefront)...');
  const webOrderId = `ord-web-${Date.now()}`;
  const webOrderNumber = `MLE-WEB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const webOrderPayload = {
    id: webOrderId,
    orderNumber: webOrderNumber,
    source: 'WEB',
    deviceInfo: 'Chrome on Windows 11 (Web Storefront)',
    customer: {
      id: 'usr-buyer-001',
      name: 'Ramesh Patel',
      email: 'ramesh.patel@surattextile.in',
      phone: '+91 98250 12345',
      companyName: 'Patel Handloom & Sarees',
      gstNumber: '24AAACP1234M1Z5',
      isB2B: true
    },
    subtotal: 8990.00,
    taxBreakdown: {
      cgst: 224.75,
      sgst: 224.75,
      igst: 0.00,
      totalTax: 449.50
    },
    shippingCharge: 0.00,
    discount: 500.00,
    couponCode: 'BULK500',
    totalAmount: 8939.50,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'PLACED',
    shippingAddress: {
      fullName: 'Ramesh Patel',
      phone: '+91 98250 12345',
      street: 'Shop 42, New Textile Market, Ring Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395002'
    },
    billingAddress: {
      fullName: 'Ramesh Patel',
      phone: '+91 98250 12345',
      street: 'Shop 42, New Textile Market, Ring Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395002'
    },
    items: [
      {
        productId: 'prod-bedsheet-01',
        productName: 'Glance 300 TC 100% Combed Cotton Double Bedsheet',
        sku: 'MLE-TEX-BS-3001',
        hsnCode: '630221',
        quantity: 10,
        unitPrice: 899.00,
        totalPrice: 8990.00,
        variantDescription: 'Royal Ivory Cream (Pack of 10 wholesale)',
        gstRate: 5.00
      }
    ]
  };

  const webRes = await fetch('http://localhost:5173/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webOrderPayload)
  });

  const webResData = await webRes.json();
  console.log('Web Order API Response:', webResData);

  if (!webResData.success) {
    console.error('❌ Failed to place Web Order!');
    process.exit(1);
  }

  // Verify in MySQL
  const [webRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [webOrderId]);
  if (webRows.length === 0) {
    console.error('❌ Web order was not found in MySQL `orders` table!');
    process.exit(1);
  }
  console.log(`✅ [SUCCESS] Web Order confirmed in MySQL: ${webRows[0].order_number} | Source: ${webRows[0].source} | Customer: ${webRows[0].customer_name}`);

  const [webItemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [webOrderId]);
  console.log(`✅ [SUCCESS] Web Order Items confirmed in MySQL (${webItemRows.length} items):\n   -> Item: ${webItemRows[0]?.product_name} (Qty: ${webItemRows[0]?.quantity}, Total: ₹${webItemRows[0]?.total_price})\n`);

  // -------------------------------------------------------------
  // TEST 2: Place an Order from MOBILE APP (FLUTTER_APP)
  // -------------------------------------------------------------
  console.log('▶ TEST 2: Simulating Order Placement from FLUTTER MOBILE APP (Android Phone)...');
  const appOrderId = `ord-app-${Date.now()}`;
  const appOrderNumber = `MLE-APP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const appOrderPayload = {
    id: appOrderId,
    orderNumber: appOrderNumber,
    source: 'FLUTTER_APP',
    deviceInfo: 'Android 14 Physical Phone (Mahalaxmi Flutter App v1.0.3)',
    customer: {
      name: 'Dhaval Dave',
      email: 'dhavaldave121002@gmail.com',
      phone: '+91 85111 72099',
      isB2B: false
    },
    subtotal: 1396.00,
    totalAmount: 1396.00,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'PLACED',
    shippingAddress: {
      fullName: 'Dhaval Dave',
      phone: '+91 85111 72099',
      street: '102, Shivalik Plaza, Near C.G. Road, Ahmedabad 380009'
    },
    items: [
      {
        productId: 'prod-cotton-towel-01',
        productName: 'Mahalaxmi Super-Plush 600 GSM Cotton Bath Towel',
        sku: 'MLE-COT-TWL-600',
        hsnCode: '630260',
        quantity: 4,
        unitPrice: 349.00,
        totalPrice: 1396.00,
        variantDescription: 'Optic Hotel White (Pack of 4)',
        gstRate: 5.00
      }
    ]
  };

  const appRes = await fetch('http://localhost:5173/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appOrderPayload)
  });

  const appResData = await appRes.json();
  console.log('Mobile App Order API Response:', appResData);

  if (!appResData.success) {
    console.error('❌ Failed to place Mobile App Order!');
    process.exit(1);
  }

  // Verify in MySQL
  const [appRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [appOrderId]);
  if (appRows.length === 0) {
    console.error('❌ Mobile app order was not found in MySQL `orders` table!');
    process.exit(1);
  }
  console.log(`✅ [SUCCESS] Mobile App Order confirmed in MySQL: ${appRows[0].order_number} | Source: ${appRows[0].source} | Customer: ${appRows[0].customer_name}`);

  const [appItemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [appOrderId]);
  console.log(`✅ [SUCCESS] Mobile App Order Items confirmed in MySQL (${appItemRows.length} items):\n   -> Item: ${appItemRows[0]?.product_name} (Qty: ${appItemRows[0]?.quantity}, Total: ₹${appItemRows[0]?.total_price})\n`);

  // -------------------------------------------------------------
  // TEST 3: Unified Orders Feed (Admin & Orders Dashboard)
  // -------------------------------------------------------------
  console.log('▶ TEST 3: Calling GET /api/orders (Central Unified Orders Endpoint)...');
  const allOrdersRes = await fetch('http://localhost:5173/api/orders');
  const allOrdersData = await allOrdersRes.json();

  console.log(`Total live orders in MySQL database: ${allOrdersData.count}`);
  const webFound = allOrdersData.data?.find(o => o.id === webOrderId);
  const appFound = allOrdersData.data?.find(o => o.id === appOrderId);

  console.log(`- Web Order (${webOrderId}) present in feed:`, Boolean(webFound));
  console.log(`- Mobile App Order (${appOrderId}) present in feed:`, Boolean(appFound));

  if (!webFound || !appFound) {
    console.error('❌ One or more orders missing from central orders feed!');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 BOTH ORDERS (WEBSITE & MOBILE APP) ARE VERIFIED END-TO-END!');
  console.log('================================================================');
  process.exit(0);
}

testBothOrdersEndToEnd().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
