import { getDbPool } from '../database/db.js';
import { requireAdminSession } from './_lib/admin-session.js';

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
  const admin = await requireAdminSession(req, res);
  if (!admin) return;
  const pool = getDbPool();
  if (!pool) {
    return res.status(503).json({ success: false, error: 'Order cancellation requires a configured database.' });
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
  const reason = body.reason || 'Customer requested order cancellation.';
  const totalAmount = Number(body.totalAmount || 0);
  const items = Array.isArray(body.items) ? body.items : [];
  const source = body.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
  const paymentStatus = body.paymentStatus || 'PENDING';

  // 1. Update status in Central MySQL Database
  let updateResult;
  try {
    [updateResult] = await pool.query(
      "UPDATE orders SET status = 'CANCELLED' WHERE order_number = ? OR id = ?",
      [orderNumber, orderId || orderNumber]
    );
  } catch (dbErr) {
    console.error('Order cancellation persistence failed:', dbErr);
    return res.status(503).json({ success: false, error: 'The order could not be cancelled in the database.' });
  }
  if (!updateResult.affectedRows) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
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


  const primaryAdmin = process.env.ADMIN_EMAIL || 'mahalaxmienterpriseuk@gmail.com';
  const secondaryAdmin = 'deviltimeisback001@gmail.com';

  const itemsHtml = (items && items.length > 0)
    ? items.map(item => {
        let itemImg = item.image || item.imageUrl || item.thumbnail || item.productImage || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&auto=format&fit=crop&q=80';
        if (typeof itemImg === 'string' && itemImg.startsWith('/')) {
          itemImg = `https://mahalaxmimanufacturer.vercel.app${itemImg}`;
        }
        return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: left; vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align: middle; padding-right: 12px; width: 48px;">
                  <img src="${itemImg}" alt="${item.productName || item.title || item.name || 'Textile'}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #CBD5E1; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-weight: 800; font-size: 13px; color: #0F172A; line-height: 1.3;">
                    ${item.productName || item.title || item.name || 'Textile Consignment'}
                  </div>
                  <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
                    ${item.variantDescription || item.size || 'Standard Mill Quality'}
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; vertical-align: middle;">
            <span style="display: inline-block; background-color: #F1F5F9; color: #1E293B; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 8px;">
              ${item.quantity || item.units || 1}
            </span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; vertical-align: middle;">
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; font-family: monospace;">
              ₹${Number(item.totalPrice || item.price || 0).toLocaleString('en-IN')}
            </div>
          </td>
        </tr>
      `;
      }).join('')
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
                    MAHALAXMI ENTERPRISE
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
      <title>Order Cancellation Confirmed - Mahalaxmi Enterprise</title>
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
                    MAHALAXMI ENTERPRISE
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
                        <a href="https://wa.me/919033598639?text=${encodeURIComponent(`Namaste Mahalaxmi Enterprise, regarding cancelled order ${orderNumber}`)}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #F1F5F9; color: #14213D; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 11px; border-radius: 10px; border: 1px solid #CBD5E1;">
                          💬 Chat with Mill Support on WhatsApp
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #F8FAFC; padding: 14px 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
                  Mahalaxmi Enterprise • Direct Mill Rates & Wholesale Essentials • +91 90335 98639
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const cancelItemsBlock = `
    <div style="margin: 20px 0 16px; text-align: left; background-color: #FFFFFF; border: 1px solid #FECACA; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      <div style="background-color: #FEF2F2; padding: 12px 16px; font-weight: 900; font-size: 11px; color: #991B1B; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #FECACA;">
        ❌ Cancelled Consignment Items
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <thead>
          <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">
            <th style="padding: 10px 14px; text-align: left; border-bottom: 1px solid #E2E8F0;">Product Item</th>
            <th style="padding: 10px 8px; text-align: center; border-bottom: 1px solid #E2E8F0; width: 55px;">Qty</th>
            <th style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #E2E8F0; width: 95px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="background-color: #F8FAFC; padding: 12px 16px; font-size: 12px; color: #475569; border-top: 1px solid #E2E8F0; line-height: 1.5;">
        📝 <strong style="color: #0F172A;">Reason:</strong> ${reason || 'Customer requested cancellation'}<br>
        💰 <strong style="color: #0F172A;">Refund Total:</strong> ₹${Number(totalAmount).toLocaleString('en-IN')} (Credited in 2-4 working days)
      </div>
    </div>
  `;

  // 1. Dispatch Customer Cancellation Confirmation via EmailJS
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
      const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
      const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || 'G6gT9XDN4SFBz6oqW';
      const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        const payload = {
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: customerEmail,
            to_name: customerName,
            subject: `Order #${orderNumber} Cancelled | Mahalaxmi Enterprise`,
            headline: 'Order Cancelled',
            code_box: `#${orderNumber}`,
            subtext: `Total: ₹${Number(totalAmount).toLocaleString('en-IN')} • Refund in 2-4 days`,
            order_number: orderNumber,
            items_block: cancelItemsBlock,
            message: `Your order #${orderNumber} has been cancelled successfully as requested.`
          }
        };
        if (EMAILJS_PRIVATE_KEY) payload.accessToken = EMAILJS_PRIVATE_KEY;
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://mahalaxmimanufacturer.com'
          },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.error(`[CANCEL ORDER] Customer email delivery error:`, err);
    }
  }

  // 2. Dispatch Store Admin Alert via EmailJS
  try {
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
    const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || 'G6gT9XDN4SFBz6oqW';
    const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

    if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: primaryAdmin,
          to_name: 'Mahalaxmi Admin',
          subject: `🚨 Store Alert: Order #${orderNumber} Cancelled`,
          headline: 'Order Cancellation',
          code_box: `#${orderNumber}`,
          subtext: `Customer: ${customerName} (${customerEmail})`,
          order_number: orderNumber,
          items_block: cancelItemsBlock,
          message: `Store Alert: Order #${orderNumber} was cancelled by ${customerName} (₹${Number(totalAmount).toLocaleString('en-IN')})`
        }
      };
      if (EMAILJS_PRIVATE_KEY) payload.accessToken = EMAILJS_PRIVATE_KEY;
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://mahalaxmimanufacturer.com'
        },
        body: JSON.stringify(payload)
      });
    }
  } catch (err) {
    console.error(`[CANCEL ORDER] Admin email delivery error:`, err);
  }
}
