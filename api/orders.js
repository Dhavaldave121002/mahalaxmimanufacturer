import { getDbPool } from '../database/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  // 1. GET: Fetch all live orders
  if (req.method === 'GET') {
    if (!pool) {
      return res.status(200).json({ success: true, source: 'LOCAL_FALLBACK', count: 0, data: [] });
    }
    try {
      const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. POST: Insert new order from Website or Mobile App
  if (req.method === 'POST') {
    let o = req.body;
    if (typeof o === 'string') {
      try {
        o = JSON.parse(o);
      } catch (e) {
        o = {};
      }
    }
    o = o || {};

    const orderId = o.id || `ord-${Date.now()}`;
    const source = o.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
    const orderNumber =
      o.orderNumber ||
      `MLE-${source === 'FLUTTER_APP' ? 'APP' : 'WEB'}-${new Date().getFullYear()}-${Math.floor(
        10000 + Math.random() * 90000
      )}`;

    const customer = o.customer || {};
    const customerName = customer.name || o.customerName || 'Customer';
    const customerEmail = customer.email || o.customerEmail || 'customer@mahalaxmi.in';
    const customerPhone = customer.phone || o.customerPhone || '+91 98765 00000';
    const companyName = customer.companyName || o.companyName || null;
    const gstNumber = customer.gstNumber || o.gstNumber || null;
    const isB2B = customer.isB2B || o.isB2B ? 1 : 0;

    const subtotal = Number(o.subtotal || o.totalAmount || 0);
    const totalAmount = Number(o.totalAmount || o.subtotal || 0);
    const paymentMethod = ['UPI', 'COD', 'NET_BANKING', 'CREDIT_30_DAYS'].includes(o.paymentMethod)
      ? o.paymentMethod
      : 'UPI';
    const paymentStatus = ['PAID', 'PENDING', 'REFUNDED', 'CREDIT_APPROVED'].includes(o.paymentStatus)
      ? o.paymentStatus
      : paymentMethod === 'COD'
      ? 'PENDING'
      : 'PAID';
    const status = o.status || 'PLACED';

    const shippingAddress = typeof o.shippingAddress === 'object' ? JSON.stringify(o.shippingAddress) : String(o.shippingAddress || '{}');
    const billingAddress = typeof o.billingAddress === 'object' ? JSON.stringify(o.billingAddress) : String(o.billingAddress || shippingAddress);
    const timeline = Array.isArray(o.timeline)
      ? JSON.stringify(o.timeline)
      : JSON.stringify([
          {
            status: 'PLACED',
            timestamp: new Date().toISOString(),
            description: `Order successfully booked via ${source === 'FLUTTER_APP' ? 'Mobile App' : 'Web Store'}.`
          }
        ]);

    if (!pool) {
      return res.status(201).json({
        success: true,
        orderId,
        orderNumber,
        source,
        message: 'Order created in local fallback (MySQL pool unavailable).'
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
          customer.id || o.userId || null,
          source,
          o.deviceInfo || (source === 'FLUTTER_APP' ? 'Flutter Android/iOS App' : 'Desktop/Mobile Web Browser'),
          customerName,
          customerEmail,
          customerPhone,
          companyName,
          gstNumber,
          isB2B,
          subtotal,
          o.taxBreakdown?.cgst || 0,
          o.taxBreakdown?.sgst || 0,
          o.taxBreakdown?.igst || 0,
          o.taxBreakdown?.totalTax || 0,
          o.shippingCharge || 0,
          o.discount || 0,
          o.couponCode || null,
          totalAmount,
          paymentMethod,
          paymentStatus,
          status,
          shippingAddress,
          billingAddress,
          timeline
        ]
      );

      // Insert Order Items if provided
      if (Array.isArray(o.items) && o.items.length > 0) {
        for (const item of o.items) {
          const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const unitPrice = Number(item.unitPrice || item.price || 0);
          const quantity = Number(item.quantity || 1);
          const totalPrice = Number(item.totalPrice || unitPrice * quantity);

          await pool.query(
            `INSERT INTO order_items (
              id, order_id, product_id, product_name, sku, hsn_code, quantity, unit_price, total_price, variant_description, image, gst_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itemId,
              orderId,
              item.productId || item.id || 'prod-1',
              item.productName || item.name || 'Textile Product',
              item.sku || 'MLE-SKU',
              item.hsnCode || '630221',
              quantity,
              unitPrice,
              totalPrice,
              item.variantDescription || item.selectedVariant?.name || 'Standard Pack',
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
        source,
        message: `Order ${orderNumber} successfully booked and stored in MySQL database!`
      });
    } catch (err) {
      console.error('MySQL order insert error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
