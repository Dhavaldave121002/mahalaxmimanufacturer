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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const orderNumber = body.orderNumber || body.orderNo || `MLE-ORD-${Date.now()}`;
  const orderId = body.orderId || body.id || '';
  const requestType = (body.type || body.requestType || 'RETURN').toUpperCase(); // 'RETURN' or 'EXCHANGE'
  const reason = body.reason || 'Item size/quality issue reported by customer';
  const comment = body.comment || body.notes || '';
  const customerEmail = (body.customerEmail || body.email || 'customer@mahalaxmi.in').trim();
  let customerName = (body.customerName || body.name || '').trim();
  if (!customerName || customerName.toLowerCase() === 'valued customer' || customerName.toLowerCase() === 'customer') {
    if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('customer@mahalaxmi.in')) {
      const raw = customerEmail.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
      if (raw.length > 1) {
        customerName = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  if (!customerName) customerName = 'Valued Customer';
  const customerPhone = body.customerPhone || body.phone || '+91 85111 72099';
  const totalAmount = Number(body.totalAmount || 0);
  const items = Array.isArray(body.items) ? body.items : [];
  const source = body.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
  const newStatus = requestType === 'EXCHANGE' ? 'EXCHANGE_REQUESTED' : 'RETURN_REQUESTED';

  // 1. Update in Central MySQL Database
  const pool = getDbPool();
  if (pool) {
    try {
      // Create order_returns table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_returns (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_number VARCHAR(100) NOT NULL,
          order_id VARCHAR(100),
          request_type ENUM('RETURN', 'EXCHANGE') DEFAULT 'RETURN',
          reason VARCHAR(255) NOT NULL,
          comments TEXT,
          customer_name VARCHAR(150),
          customer_email VARCHAR(150),
          customer_phone VARCHAR(50),
          status ENUM('PENDING', 'APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED') DEFAULT 'PENDING',
          refund_amount DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_ret_ord (order_number),
          INDEX idx_ret_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Insert return request record
      await pool.query(
        `INSERT INTO order_returns 
         (order_number, order_id, request_type, reason, comments, customer_name, customer_email, customer_phone, status, refund_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
        [orderNumber, orderId || orderNumber, requestType, reason, comment, customerName, customerEmail, customerPhone, totalAmount]
      );

      // Attempt to update orders table status if column supports it
      try {
        await pool.query(
          "UPDATE orders SET status = ? WHERE order_number = ? OR id = ?",
          [newStatus, orderNumber, orderId || orderNumber]
        );
      } catch {
        // If enum doesn't include RETURN_REQUESTED, fallback or ignore gracefully
      }
    } catch (dbErr) {
      console.warn('MySQL return-exchange warning:', dbErr.message);
    }
  }

  // 2. Dispatch Automated Notification Emails (Customer & Admin)
  try {
    await sendReturnEmails({
      orderNumber,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      requestType,
      reason,
      comment,
      totalAmount,
      items,
      source
    });
  } catch (emailErr) {
    console.warn('Return email dispatch warning:', emailErr.message);
  }

  return res.status(200).json({
    success: true,
    message: `${requestType === 'EXCHANGE' ? 'Exchange' : 'Return'} request submitted successfully. Our operations team will arrange reverse pickup within 24-48 business hours.`,
    orderNumber,
    newStatus,
    timestamp: new Date().toISOString()
  });
}

async function sendReturnEmails(data) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    requestType,
    reason,
    comment,
    totalAmount,
    items,
    source
  } = data;

  const adminEmail = process.env.ADMIN_EMAIL || 'dhavaldave121002@gmail.com';
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

  const typeLabel = requestType === 'EXCHANGE' ? 'Exchange (સાઇઝ / ડિફેક્ટ બદલી)' : 'Return & Refund (રીટર્ન અને રિફંડ)';
  const badgeColor = requestType === 'EXCHANGE' ? '#2563EB' : '#DC2626';

  const itemsHtml = items.length > 0
    ? items.map(item => `
      <tr style="border-bottom: 1px solid #E2E8F0; font-size: 13px;">
        <td style="padding: 10px 12px; color: #1E293B;">
          <strong>${item.name || item.product_name || 'Textile Item'}</strong>
          ${item.variant_description ? `<br><span style="color: #64748B; font-size: 11px;">${item.variant_description}</span>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; color: #475569;">${item.quantity || item.qty || 1}</td>
        <td style="padding: 10px 12px; text-align: right; color: #0F172A; font-weight: 700;">₹${Number(item.total_price || item.price || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 12px; text-align: center; color: #64748B; font-size: 13px;">All items in consignment ${orderNumber}</td>
      </tr>
    `;

  // Admin Notification Email
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>New ${requestType} Request - ${orderNumber}</title></head>
    <body style="margin: 0; padding: 20px; background-color: #F8FAFC; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">
        <div style="background: ${badgeColor}; padding: 20px; color: #FFFFFF; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">📦 New ${requestType} Request Received</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Order: <strong>${orderNumber}</strong> (${source})</p>
        </div>
        <div style="padding: 24px;">
          <div style="background: #FEF2F2; border-left: 4px solid ${badgeColor}; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
            <strong style="color: #991B1B;">Type:</strong> ${typeLabel}<br>
            <strong style="color: #991B1B;">Reason:</strong> ${reason}<br>
            ${comment ? `<strong style="color: #991B1B;">Customer Notes:</strong> ${comment}` : ''}
          </div>
          <table width="100%" style="font-size: 13px; margin-bottom: 20px;">
            <tr><td style="color: #64748B;">Customer:</td><td style="font-weight: 700;">${customerName}</td></tr>
            <tr><td style="color: #64748B;">Phone:</td><td style="font-weight: 700;"><a href="tel:${customerPhone}">${customerPhone}</a></td></tr>
            <tr><td style="color: #64748B;">Email:</td><td style="font-weight: 700;">${customerEmail}</td></tr>
            <tr><td style="color: #64748B;">Order Value:</td><td style="font-weight: 700; color: #059669;">₹${Number(totalAmount).toLocaleString('en-IN')}</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 20px;">
            <thead><tr style="background: #F1F5F9; font-size: 11px; text-transform: uppercase;"><th style="padding: 8px 12px; text-align: left;">Item</th><th style="padding: 8px; text-align: center;">Qty</th><th style="padding: 8px 12px; text-align: right;">Amount</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <a href="https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(customerName)},%20we%20received%20your%20${requestType}%20request%20for%20order%20${orderNumber}." style="display: block; background: #25D366; color: white; text-align: center; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            💬 Contact Customer on WhatsApp
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  // Customer Confirmation Email
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${requestType} Request Received - Mahalaxmi Enterprises</title></head>
    <body style="margin: 0; padding: 20px; background-color: #F8FAFC; font-family: sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">
        <div style="background: #14213D; padding: 20px; color: #FFFFFF; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">Mahalaxmi Enterprises</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #FCA311; font-weight: 700;">${typeLabel} Confirmation</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #1E293B;">Dear <strong>${customerName}</strong>,</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            We have received your <strong>${requestType === 'EXCHANGE' ? 'Exchange' : 'Return'}</strong> request for order <strong>#${orderNumber}</strong>.
            Our logistics partner will arrange a reverse pickup within <strong>24 to 48 business hours</strong>.
          </p>
          <div style="background: #F1F5F9; padding: 14px; border-radius: 8px; margin: 18px 0; font-size: 13px;">
            <strong>Request Details:</strong><br>
            • Type: ${requestType === 'EXCHANGE' ? 'Exchange' : 'Return & Refund'}<br>
            • Reason: ${reason}<br>
            • Status: <span style="color: #D97706; font-weight: 700;">Reverse Pickup Pending</span>
          </div>
          <p style="font-size: 12px; color: #64748B;">
            Please keep the items in original packaging with tags intact for the courier executive.
            For any urgent assistance, call us at <a href="tel:+918511172099">+91 85111 72099</a>.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!apiKey) return;

  try {
    // Send to Admin
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Mahalaxmi Alerts <orders@mahalaxmimanufacturer.com>',
        to: [adminEmail],
        subject: `[${requestType}] Request for Order #${orderNumber} - ${customerName}`,
        html: adminHtml
      })
    });

    // Send to Customer
    if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('customer@mahalaxmi.in')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Mahalaxmi Customer Care <orders@mahalaxmimanufacturer.com>',
          to: [customerEmail],
          subject: `${requestType === 'EXCHANGE' ? 'Exchange' : 'Return'} Request Acknowledged - Order #${orderNumber}`,
          html: customerHtml
        })
      });
    }
  } catch (err) {
    console.warn('Resend email error in return-exchange:', err.message);
  }
}
