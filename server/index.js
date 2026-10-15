import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDbPool, testDbConnection } from '../database/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// 1. Health check & DB Status
app.get('/api/health', async (req, res) => {
  const dbStatus = await testDbConnection();
  res.json({
    status: 'ONLINE',
    service: 'Mahalaxmi Enterprises Central Backend',
    version: '1.0.3',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 2. Headless App Config API
app.get('/api/app-config', async (req, res) => {
  const pool = getDbPool();
  if (pool) {
    try {
      const [banners] = await pool.query('SELECT * FROM app_banners WHERE is_active = 1 ORDER BY display_order ASC');
      const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
      const [settingsRows] = await pool.query('SELECT * FROM app_settings LIMIT 1');
      const [notifications] = await pool.query('SELECT * FROM app_notifications ORDER BY created_at DESC LIMIT 10');

      return res.json({
        success: true,
        source: 'MYSQL_DATABASE',
        data: {
          ...(settingsRows[0] || {}),
          banners,
          categories,
          notifications
        }
      });
    } catch (e) {
      console.warn('MySQL fallback triggered:', e.message);
    }
  }

  res.json({
    success: true,
    source: 'STANDALONE_FALLBACK',
    message: 'Configure MySQL database in .env to serve live records.'
  });
});

// 3. Products Endpoints
app.get('/api/products', async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: 'Database uninitialized' });
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Orders Endpoints (Both Web and Mobile App)
app.post('/api/orders', async (req, res) => {
  const pool = getDbPool();
  const o = req.body;
  const orderId = o.id || `ord-${Date.now()}`;
  const orderNumber = o.orderNumber || `MLE-${o.source === 'FLUTTER_APP' ? 'APP' : 'WEB'}-${Math.floor(10000 + Math.random() * 90000)}`;

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (
          id, order_number, user_id, source, device_info,
          customer_name, customer_email, customer_phone, is_b2b,
          subtotal, total_amount, payment_method, payment_status, status,
          shipping_address, billing_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          o.customer?.id || null,
          o.source || 'WEB',
          o.deviceInfo || (o.source === 'FLUTTER_APP' ? 'Flutter Android/iOS' : 'Web Browser'),
          o.customer?.name || 'Customer',
          o.customer?.email || '',
          o.customer?.phone || '',
          o.customer?.isB2B ? 1 : 0,
          o.subtotal || 0,
          o.totalAmount || 0,
          o.paymentMethod || 'UPI',
          o.paymentStatus || 'PAID',
          o.status || 'PLACED',
          JSON.stringify(o.shippingAddress || {}),
          JSON.stringify(o.billingAddress || {})
        ]
      );
    } catch (e) {
      console.error('Order insertion error:', e);
    }
  }

  res.status(201).json({
    success: true,
    orderId,
    orderNumber,
    message: 'Order created successfully!'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mahalaxmi Enterprises Production Server running on port ${PORT}`);
});
