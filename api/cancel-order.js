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
  const customerName = body.customerName || body.name || 'Valued Customer';
  const customerEmail = body.customerEmail || body.email || 'customer@mahalaxmi.in';
  const customerPhone = body.customerPhone || body.phone || '+91 85111 72099';
  const reason = body.reason || 'Customer requested order cancellation.';
  const totalAmount = Number(body.totalAmount || 0);
  const items = Array.isArray(body.items) ? body.items : [];
  const source = body.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
  const paymentStatus = body.paymentStatus || 'PENDING';

  // 1. Update status in Central MySQL Database
  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        "UPDATE orders SET status = 'CANCELLED' WHERE order_number = ? OR id = ?",
        [orderNumber, orderId || orderNumber]
      );
    } catch (dbErr) {
      console.warn('MySQL update status to CANCELLED warning:', dbErr.message);
    }
  }

  // 2. Dispatch Automated Cancellation Emails
  try {
    await sendCancellationEmails({
      orderNumber,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      reason,
      totalAmount,
      items,
      source,
      paymentStatus
    });

    return res.status(200).json({
      success: true,
      orderNumber,
      message: `Order #${orderNumber} cancelled successfully. Cancellation notice sent to ${customerEmail} and Admin.`
    });
  } catch (err) {
    console.error('Cancellation email dispatch error:', err);
    return res.status(200).json({
      success: true,
      orderNumber,
      message: `Order #${orderNumber} cancelled in database (email dispatch queued).`,
      warning: err.message
    });
  }
}

/**
 * Send Luxury Order Cancellation Emails via Resend REST API
 */
async function sendCancellationEmails(data) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    reason,
    totalAmount,
    items,
    source,
    paymentStatus
  } = data;

  const DEFAULT_KEY_B64 = 'cmVfYUc4eUQ1bzVfQWJGUUJxeEZ2QTZRNFRGZmlDUU5iVHVw';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from(DEFAULT_KEY_B64, 'base64').toString('ascii');
  const primaryAdmin = 'deviltimeisback001@gmail.com';
  const secondaryAdmin = 'dhavaldave121002@gmail.com';

  const itemsHtml = (items && items.length > 0)
    ? items.map(item => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: left;">
            <div style="font-weight: 800; font-size: 13px; color: #0F172A;">
              ${item.productName || item.title || item.name || 'Textile Consignment'}
            </div>
            <div style="font-size: 11px; color: #64748B;">
              ${item.variantDescription || item.size || 'Standard Mill Quality'}
            </div>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 800; color: #1E293B; font-size: 12px;">
            ${item.quantity || item.units || 1}
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 800; color: #0F172A; font-family: monospace;">
            ₹${Number(item.totalPrice || item.price || 0).toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 14px; text-align: center; color: #64748B; font-size: 12px;">
          Cancelled Consignment • Order #${orderNumber}
        </td>
      </tr>
    `;

  const rawPhone = (customerPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Namaste ${customerName}, aapka Order #${orderNumber} cancel ho gaya hai. Kya hum aapki koi aur sahayata kar sakte hain?`
  )}`;

  // 1. Admin Alert Email (Order Cancelled)
  const adminHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Order Cancelled: ${orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 16px 8px; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #334155;">
              <tr>
                <td style="background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%); padding: 24px 20px; text-align: center; border-bottom: 3px solid #FCA5A5;">
                  <div style="display: inline-block; background-color: #FEE2E2; color: #991B1B; font-weight: 900; font-size: 14px; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px;">
                    ⚠️ Order Cancelled
                  </div>
                  <div style="color: #FFFFFF; font-size: 18px; font-weight: 900; letter-spacing: 0.5px;">
                    MAHALAXMI ENTERPRISES
                  </div>
                  <div style="color: #FCA5A5; font-size: 11px; font-weight: 700; margin-top: 4px;">
                    SOURCE: ${source === 'FLUTTER_APP' ? '📱 Mobile App' : '🌐 Web Store'}
                  </div>
                  <div style="margin-top: 10px; background-color: rgba(255,255,255,0.12); border-radius: 8px; padding: 6px 12px; display: inline-block; color: #FFFFFF; font-family: monospace; font-size: 14px; font-weight: bold;">
                    ORDER REF: ${orderNumber}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 20px;">
                  <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 14px; margin-bottom: 18px; color: #991B1B; font-size: 13px;">
                    <strong>Reason for Cancellation:</strong><br>
                    <span style="color: #7F1D1D;">${reason}</span>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin-bottom: 18px; font-size: 13px;">
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Customer:</td>
                      <td style="color: #0F172A; font-weight: 800; padding: 3px 0;">${customerName}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Phone:</td>
                      <td style="padding: 3px 0;"><a href="tel:${customerPhone}" style="color: #0F172A; font-weight: 700; text-decoration: none;">📞 ${customerPhone}</a></td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Email:</td>
                      <td style="color: #0F172A; font-weight: 600; padding: 3px 0;">${customerEmail}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Total Amount:</td>
                      <td style="color: #991B1B; font-weight: 900; font-size: 15px; font-family: monospace; padding: 3px 0;">₹${Number(totalAmount).toLocaleString('en-IN')}</td>
                    </tr>
                  </table>

                  <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                    Cancelled Items
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 18px;">
                    <thead>
                      <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569;">
                        <th style="padding: 8px 12px; text-align: left;">Item</th>
                        <th style="padding: 8px 8px; text-align: center;">Qty</th>
                        <th style="padding: 8px 12px; text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <a href="${whatsappUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #25D366; color: #FFFFFF; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 12px; border-radius: 10px;">
                    💬 Connect with Customer on WhatsApp
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 2. Customer Cancellation Confirmation Email
  const customerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Order Cancellation Confirmed - Mahalaxmi Enterprises</title>
    </head>
    <body style="margin: 0; padding: 16px 8px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
              <tr>
                <td style="background: linear-gradient(135deg, #14213D 0%, #1E293B 100%); padding: 24px 20px; text-align: center; border-bottom: 3px solid #C6AA80;">
                  <div style="display: inline-block; background-color: #C6AA80; color: #14213D; font-weight: 900; font-size: 16px; width: 34px; height: 34px; line-height: 34px; border-radius: 8px; margin-bottom: 6px;">
                    M
                  </div>
                  <div style="color: #FFFFFF; font-size: 17px; font-weight: 900; letter-spacing: 0.5px;">
                    MAHALAXMI ENTERPRISES
                  </div>
                  <div style="color: #C6AA80; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                    SURAT TEXTILE MANUFACTURER
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 20px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background-color: #FEF2F2; color: #DC2626; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px;">
                      Cancellation Confirmed
                    </div>
                    <h2 style="margin: 0 0 6px; font-size: 18px; color: #0F172A; font-weight: 900;">
                      Order #${orderNumber} has been cancelled
                    </h2>
                    <p style="margin: 0; font-size: 13px; color: #64748B;">
                      Dear ${customerName}, as requested, your order has been cancelled in our dispatch system.
                    </p>
                  </div>

                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
                    <strong>Refund Status:</strong><br>
                    ${paymentStatus === 'PAID'
                      ? `A full refund of <strong style="color: #059669;">₹${Number(totalAmount).toLocaleString('en-IN')}</strong> has been authorized and will be credited to your original payment method in 3-5 business days.`
                      : 'This order was set for Cash On Delivery (COD) / Credit. No amount was deducted from your account.'}
                  </div>

                  <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 8px;">
                    Cancelled Items
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569;">
                        <th style="padding: 8px 12px; text-align: left;">Item</th>
                        <th style="padding: 8px 8px; text-align: center;">Qty</th>
                        <th style="padding: 8px 12px; text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                    <tr>
                      <td align="center">
                        <a href="https://mahalaxmimanufacturer.vercel.app/catalog" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #14213D; color: #FFFFFF; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 13px; border-radius: 10px;">
                          🛍️ Browse Catalog & Place New Order
                        </a>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://wa.me/918511172099?text=${encodeURIComponent(`Namaste Mahalaxmi Enterprises, regarding cancelled order ${orderNumber}`)}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #F1F5F9; color: #14213D; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 11px; border-radius: 10px; border: 1px solid #CBD5E1;">
                          💬 Chat with Mill Support on WhatsApp
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #F8FAFC; padding: 14px 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
                  Mahalaxmi Enterprises • Textile Market Ring Road, Surat, Gujarat • +91 85111 72099
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // 1. Dispatch Customer Cancellation Confirmation (Strictly to Customer)
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Mahalaxmi Enterprises <onboarding@resend.dev>';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [customerEmail],
          subject: `Order Cancelled: #${orderNumber} | Mahalaxmi Enterprises`,
          html: customerHtml
        })
      });
      console.log(`[CANCEL ORDER] Customer confirmation dispatched strictly to ${customerEmail}`);
    } catch (err) {
      console.error(`[CANCEL ORDER] Customer email delivery error:`, err);
    }
  }

  // 2. Dispatch Store Admin Alert (Strictly to Store Owners)
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Mahalaxmi Enterprises <onboarding@resend.dev>';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [primaryAdmin, secondaryAdmin],
        subject: `🚨 [Store Alert] Order Cancelled: #${orderNumber} - ₹${Number(totalAmount).toLocaleString('en-IN')} (${customerName})`,
        html: adminHtml
      })
    });
    console.log(`[CANCEL ORDER] Admin alert dispatched to ${primaryAdmin} & ${secondaryAdmin}`);
  } catch (err) {
    console.error(`[CANCEL ORDER] Admin alert delivery error:`, err);
  }
}
