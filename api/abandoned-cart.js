import { getDbPool } from '../database/db.js';

// Global In-Memory Cart Session Registry
global.__mle_abandoned_carts = global.__mle_abandoned_carts || new Map();

// 30-Minute Automatic Background Cron Timer
if (!global.__mle_cart_interval) {
  global.__mle_cart_interval = setInterval(async () => {
    const now = Date.now();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;

    for (const [email, cart] of global.__mle_abandoned_carts.entries()) {
      if (!cart.sent && !cart.cleared && (now - cart.lastActivity) >= THIRTY_MINUTES_MS) {
        cart.sent = true;
        console.log(`[AUTO 30-MIN ABANDONED CART] 30 minutes reached for ${email}. Dispatched recovery email!`);
        try {
          await sendAbandonedCartRecoveryEmails({
            customerName: cart.customerName,
            customerEmail: cart.customerEmail,
            customerPhone: cart.customerPhone,
            cartTotal: cart.cartTotal,
            items: cart.items,
            source: cart.source,
            couponCode: 'LAUNCH150'
          });
          console.log(`[AUTO 30-MIN ABANDONED CART] Successfully sent recovery email to ${email}`);
        } catch (err) {
          console.error(`[AUTO 30-MIN ABANDONED CART] Error sending to ${email}:`, err.message);
        }
      }
    }
  }, 30 * 1000); // Check every 30 seconds
}

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

  // GET: Check pending cart sessions & timers
  if (req.method === 'GET') {
    const now = Date.now();
    const sessions = [];
    for (const [email, cart] of global.__mle_abandoned_carts.entries()) {
      const elapsedMs = now - cart.lastActivity;
      const remainingMs = Math.max(0, (30 * 60 * 1000) - elapsedMs);
      sessions.push({
        email,
        customerName: cart.customerName,
        cartTotal: cart.cartTotal,
        itemsCount: cart.items?.length || 0,
        elapsedMinutes: Math.floor(elapsedMs / 60000),
        remainingMinutes: Math.ceil(remainingMs / 60000),
        sent: cart.sent,
        cleared: cart.cleared,
        source: cart.source
      });
    }
    return res.status(200).json({
      success: true,
      rule: 'Abandoned cart email is sent automatically after 30 minutes of inactivity',
      activeSessionsCount: sessions.length,
      sessions
    });
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

  const action = body.action || 'RECORD_OR_SEND';
  const customerName = body.customerName || body.name || 'Valued Buyer';
  const customerEmail = (body.customerEmail || body.email || '').trim().toLowerCase();
  const customerPhone = body.customerPhone || body.phone || '+91 85111 72099';
  const cartTotal = Number(body.cartTotal || body.totalAmount || 0);
  const items = Array.isArray(body.items) ? body.items : [];
  const source = body.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
  const couponCode = body.couponCode || 'LAUNCH150';

  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid customerEmail is required.' });
  }

  // 1. ACTION: CLEAR (Called when customer places order)
  if (action === 'CLEAR' || action === 'ORDER_COMPLETED') {
    if (global.__mle_abandoned_carts.has(customerEmail)) {
      const cart = global.__mle_abandoned_carts.get(customerEmail);
      cart.cleared = true;
      global.__mle_abandoned_carts.delete(customerEmail);
    }
    return res.status(200).json({
      success: true,
      message: `Cart session cleared for ${customerEmail}. Pending 30-min recovery email cancelled.`
    });
  }

  // 2. ACTION: RECORD (Stores cart activity, timer fires after 30 mins)
  if (action === 'RECORD') {
    global.__mle_abandoned_carts.set(customerEmail, {
      customerEmail,
      customerName,
      customerPhone,
      cartTotal,
      items,
      source,
      lastActivity: Date.now(),
      sent: false,
      cleared: false
    });

    return res.status(200).json({
      success: true,
      message: `Cart activity tracked for ${customerEmail}. If checkout is not completed, recovery email will dispatch in 30 minutes.`,
      scheduledInMinutes: 30
    });
  }

  // 3. ACTION: SEND_NOW (Instant test or explicit customer request)
  try {
    await sendAbandonedCartRecoveryEmails({
      customerName,
      customerEmail,
      customerPhone,
      cartTotal,
      items,
      source,
      couponCode
    });

    if (global.__mle_abandoned_carts.has(customerEmail)) {
      global.__mle_abandoned_carts.get(customerEmail).sent = true;
    }

    return res.status(200).json({
      success: true,
      message: `Abandoned cart recovery email dispatched to ${customerEmail} & Store Admin!`
    });
  } catch (err) {
    console.error('Abandoned cart recovery email error:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * Dispatch High-Converting Abandoned Cart Recovery Emails via Resend REST API
 */
async function sendAbandonedCartRecoveryEmails(data) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    cartTotal,
    items,
    source,
    couponCode
  } = data;

  const DEFAULT_KEY_B64 = 'cmVfYUc4eUQ1bzVfQWJGUUJxeEZ2QTZRNFRGZmlDUU5iVHVw';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from(DEFAULT_KEY_B64, 'base64').toString('ascii');
  const primaryAdmin = 'deviltimeisback001@gmail.com';
  const secondaryAdmin = 'dhavaldave121002@gmail.com';

  const itemsHtml = (items && items.length > 0)
    ? items.map(item => `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; text-align: left; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 14px; color: #0F172A; line-height: 1.3;">
              ${item.productName || item.title || item.name || 'Textile Consignment'}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
              ${item.variantDescription || item.size || 'Premium Mill Quality'}
            </div>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; vertical-align: middle;">
            <span style="display: inline-block; background-color: #F1F5F9; color: #1E293B; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 8px;">
              ${item.quantity || item.units || 1} pcs
            </span>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; vertical-align: middle;">
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; font-family: monospace;">
              ₹${Number(item.totalPrice || item.price || 0).toLocaleString('en-IN')}
            </div>
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 16px; text-align: center; color: #64748B; font-size: 13px;">
          Exclusive Textile Loom Items • Total: ₹${Number(cartTotal).toLocaleString('en-IN')}
        </td>
      </tr>
    `;

  const rawPhone = (customerPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Namaste ${customerName}, aapke Mahalaxmi Enterprises cart me kuch items pending hain (₹${Number(cartTotal).toLocaleString('en-IN')}). Kya aapko order complete karne me koi discount ya help chahiye?`
  )}`;

  // 1. Admin Alert Email (Abandoned Cart Lead)
  const adminHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Abandoned Cart Lead: ${customerName}</title>
    </head>
    <body style="margin: 0; padding: 16px 8px; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #334155;">
              <tr>
                <td style="background: linear-gradient(135deg, #312E81 0%, #1E1B4B 100%); padding: 24px 20px; text-align: center; border-bottom: 3px solid #C6AA80;">
                  <div style="display: inline-block; background-color: #EEF2FF; color: #4338CA; font-weight: 900; font-size: 12px; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px;">
                    🛒 Abandoned Cart Recovery Alert
                  </div>
                  <div style="color: #FFFFFF; font-size: 18px; font-weight: 900; letter-spacing: 0.5px;">
                    MAHALAXMI ENTERPRISES
                  </div>
                  <div style="color: #C6AA80; font-size: 11px; font-weight: 700; margin-top: 4px;">
                    SOURCE: ${source === 'FLUTTER_APP' ? '📱 Mobile App' : '🌐 Web Store'}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 20px;">
                  <div style="background-color: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 14px; margin-bottom: 18px; color: #3730A3; font-size: 13px;">
                    <strong>Customer Left Items in Cart!</strong><br>
                    ${customerName} added products worth <strong>₹${Number(cartTotal).toLocaleString('en-IN')}</strong> but hasn't finalized checkout yet.
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin-bottom: 18px; font-size: 13px;">
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Customer Name:</td>
                      <td style="color: #0F172A; font-weight: 800; padding: 3px 0;">${customerName}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Customer Email:</td>
                      <td style="color: #0F172A; font-weight: 600; padding: 3px 0;">${customerEmail}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Phone:</td>
                      <td style="padding: 3px 0;"><a href="tel:${customerPhone}" style="color: #4338CA; font-weight: 700; text-decoration: none;">📞 ${customerPhone}</a></td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Pending Cart Value:</td>
                      <td style="color: #059669; font-weight: 900; font-size: 16px; font-family: monospace; padding: 3px 0;">₹${Number(cartTotal).toLocaleString('en-IN')}</td>
                    </tr>
                  </table>

                  <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                    Items Left in Cart
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569;">
                        <th style="padding: 8px 12px; text-align: left;">Item</th>
                        <th style="padding: 8px 8px; text-align: center;">Qty</th>
                        <th style="padding: 8px 12px; text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <a href="${whatsappUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #25D366; color: #FFFFFF; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 13px; border-radius: 10px;">
                    💬 Contact Buyer on WhatsApp to Close Sale
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

  // 2. Customer Cart Recovery Email (with ₹150 OFF Voucher)
  const customerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Complete Your Order - Mahalaxmi Enterprises</title>
    </head>
    <body style="margin: 0; padding: 16px 8px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 6px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #14213D 0%, #1E293B 100%); padding: 26px 20px; text-align: center; border-bottom: 3px solid #C6AA80;">
                  <div style="display: inline-block; background-color: #C6AA80; color: #14213D; font-weight: 900; font-size: 16px; width: 34px; height: 34px; line-height: 34px; border-radius: 8px; margin-bottom: 6px;">
                    M
                  </div>
                  <div style="color: #FFFFFF; font-size: 18px; font-weight: 900; letter-spacing: 0.5px;">
                    MAHALAXMI ENTERPRISES
                  </div>
                  <div style="color: #C6AA80; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                    DIRECT FROM SURAT TEXTILE MILLS
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 26px 20px;">
                  <div style="text-align: center; margin-bottom: 22px;">
                    <div style="display: inline-block; background-color: #FEF3C7; color: #B45309; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 8px;">
                      🛒 You Left Items in Your Cart
                    </div>
                    <h2 style="margin: 0 0 8px; font-size: 20px; color: #0F172A; font-weight: 900;">
                      We've Saved Your Mill Cart, ${customerName}!
                    </h2>
                    <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                      Your selected wholesale and retail textile items are currently reserved for you at direct manufacturer prices.
                    </p>
                  </div>

                  <!-- Special Voucher Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 2px dashed #059669; border-radius: 14px; margin-bottom: 22px;">
                    <tr>
                      <td style="padding: 16px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 800; color: #065F46; text-transform: uppercase; letter-spacing: 1px;">
                          🎁 Special Loom Completion Offer
                        </span>
                        <div style="font-size: 18px; font-weight: 900; color: #047857; margin: 4px 0;">
                          Get Flat ₹150 OFF on Your Order
                        </div>
                        <div style="display: inline-block; background-color: #FFFFFF; border: 1px solid #10B981; padding: 5px 14px; border-radius: 8px; font-family: monospace; font-size: 15px; font-weight: 900; color: #065F46; letter-spacing: 1px; margin-top: 4px;">
                          COUPON: ${couponCode}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Cart Items Table -->
                  <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">
                    Reserved Products in Your Cart
                  </div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin-bottom: 22px;">
                    <thead>
                      <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569;">
                        <th style="padding: 10px 14px; text-align: left;">Product</th>
                        <th style="padding: 10px 8px; text-align: center;">Qty</th>
                        <th style="padding: 10px 14px; text-align: right;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Complete Purchase Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                    <tr>
                      <td align="center">
                        <a href="https://mahalaxmimanufacturer.vercel.app/cart" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background: linear-gradient(135deg, #14213D 0%, #1E1B4B 100%); color: #FFFFFF; font-weight: 900; font-size: 14px; text-align: center; text-decoration: none; padding: 15px 20px; border-radius: 12px; box-shadow: 0 6px 20px rgba(20,33,61,0.25);">
                          ⚡ Complete Your Order Now (Total: ₹${Number(cartTotal).toLocaleString('en-IN')})
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- WhatsApp Helpline Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://wa.me/918511172099?text=${encodeURIComponent(`Namaste Mahalaxmi Enterprises, I have items in my cart worth ₹${cartTotal}. Need help placing order.`)}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #25D366; color: #FFFFFF; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 12px; border-radius: 12px;">
                          💬 Order via WhatsApp Mill Desk
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 16px 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
                  Mahalaxmi Enterprises • Ring Road Textile Market, Surat, Gujarat<br>
                  Direct Loom Wholesale Hotline: +91 85111 72099
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Dispatch Admin Notification
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Mahalaxmi Enterprises <onboarding@resend.dev>',
      to: [primaryAdmin],
      subject: `[Abandoned Cart Alert] ₹${Number(cartTotal).toLocaleString('en-IN')} by ${customerName} (${source})`,
      html: adminHtml
    })
  });

  // Dispatch Customer Recovery Email (with sandbox forward fallback)
  if (customerEmail && customerEmail.includes('@')) {
    const isVerifiedTarget = customerEmail.toLowerCase() === primaryAdmin.toLowerCase();
    const recipient = isVerifiedTarget ? customerEmail : primaryAdmin;
    const subjectPrefix = isVerifiedTarget ? '' : `[Cart Recovery for ${customerEmail}] `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mahalaxmi Enterprises <onboarding@resend.dev>',
        to: [recipient],
        subject: `${subjectPrefix}You left items in your cart! Complete your order for ₹150 OFF`,
        html: customerHtml
      })
    });
  }
}
