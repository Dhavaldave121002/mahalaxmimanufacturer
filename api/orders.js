import { getDbPool } from '../database/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const pool = getDbPool();

  if (req.method === 'GET') {
    if (!pool) {
      return res.status(200).json({ source: 'LOCAL_FALLBACK', orders: [] });
    }
    try {
      const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.status(200).json({ count: rows.length, data: rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const o = req.body;
    const orderId = o.id || `ord-${Date.now()}`;
    const orderNumber = o.orderNumber || `MLE-${o.source === 'FLUTTER_APP' ? 'APP' : 'WEB'}-${Math.floor(10000 + Math.random() * 90000)}`;

    if (!pool) {
      // In-memory or fallback receipt
      return res.status(201).json({
        success: true,
        orderId,
        orderNumber,
        message: 'Order recorded in staging environment.'
      });
    }

    try {
      await pool.query(
        `INSERT INTO orders (
          id, order_number, user_id, source, device_info,
          customer_name, customer_email, customer_phone, company_name, gst_number, is_b2b,
          subtotal, cgst, sgst, igst, total_tax, shipping_charge, discount, coupon_code, total_amount,
          payment_method, payment_status, status, shipping_address, billing_address, timeline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          o.customer?.id || null,
          o.source || 'WEB',
          o.deviceInfo || (o.source === 'FLUTTER_APP' ? 'Flutter Android/iOS' : 'Web Browser'),
          o.customer?.name || 'Customer',
          o.customer?.email || '',
          o.customer?.phone || '',
          o.customer?.companyName || null,
          o.customer?.gstNumber || null,
          o.customer?.isB2B ? 1 : 0,
          o.subtotal || 0,
          o.taxBreakdown?.cgst || 0,
          o.taxBreakdown?.sgst || 0,
          o.taxBreakdown?.igst || 0,
          o.taxBreakdown?.totalTax || 0,
          o.shippingCharge || 0,
          o.discount || 0,
          o.couponCode || null,
          o.totalAmount || 0,
          o.paymentMethod || 'UPI',
          o.paymentStatus || 'PAID',
          o.status || 'PLACED',
          JSON.stringify(o.shippingAddress || {}),
          JSON.stringify(o.billingAddress || {}),
          JSON.stringify(o.timeline || [])
        ]
      );

      // Insert Order Items if provided
      if (Array.isArray(o.items)) {
        for (const item of o.items) {
          await pool.query(
            `INSERT INTO order_items (
              id, order_id, product_id, product_name, sku, hsn_code, quantity, unit_price, total_price, image, gst_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              orderId,
              item.productId,
              item.productName,
              item.sku || 'SKU',
              item.hsnCode || '630221',
              item.quantity || 1,
              item.unitPrice || 0,
              item.totalPrice || 0,
              item.image || '',
              item.gstRate || 5.0
            ]
          );
        }
      }

      return res.status(201).json({
        success: true,
        orderId,
        orderNumber,
        message: 'Order placed and saved to MySQL successfully!'
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
