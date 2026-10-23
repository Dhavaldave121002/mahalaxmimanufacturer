import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from './_lib/admin-session.js';

// Subscriber File Storage Helper
function loadSubscribers() {
  try {
    const filePath = path.join(process.cwd(), 'private-data', 'fixtures', 'subscribers.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.warn('Subscribers read error:', err.message);
  }
  return [];
}

function saveSubscribers(list) {
  try {
    const filePath = path.join(process.cwd(), 'private-data', 'fixtures', 'subscribers.json');
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('Subscribers write error:', err.message);
  }
}

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

          // Update subscriber status in file
          const subs = loadSubscribers();
          const target = subs.find(s => s.customerEmail === email);
          if (target) {
            target.status = 'Voucher Emailed';
            saveSubscribers(subs);
          }
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

  if (process.env.NODE_ENV === 'production') {
    return res.status(503).json({
      success: false,
      error: 'Abandoned-cart tracking is unavailable until durable database storage is configured.'
    });
  }

  // GET: Return all subscriber leads and cart sessions for Admin Dashboard
  if (req.method === 'GET') {
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    const subscribers = loadSubscribers();
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
      sessions,
      subscribers
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
  const action = body.action || 'RECORD_OR_SEND';
  const customerEmail = (body.customerEmail || body.email || '').trim().toLowerCase();
  let customerName = (body.customerName || body.name || '').trim();
  if (!customerName || customerName.toLowerCase() === 'valued buyer' || customerName.toLowerCase() === 'valued customer' || customerName.toLowerCase() === 'customer') {
    if (customerEmail && customerEmail.includes('@')) {
      const raw = customerEmail.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
      if (raw.length > 1) {
        customerName = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  if (!customerName) customerName = 'Valued Buyer';
  const customerPhone = body.customerPhone || body.phone || '+91 85111 72099';
  const cartTotal = Number(body.cartTotal || body.totalAmount || 0);
  const items = Array.isArray(body.items) ? body.items : [];
  const source = body.source === 'FLUTTER_APP' ? 'FLUTTER_APP' : 'WEB';
  const couponCode = body.couponCode || 'LAUNCH150';

  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid customerEmail is required.' });
  }

  // 0. ACTION: DELETE (Admin deletes lead from subscribers table)
  if (action === 'DELETE') {
    const targetId = body.id || body.subscriberId;
    let subs = loadSubscribers();
    subs = subs.filter(s => s.id !== targetId && s.customerEmail !== customerEmail);
    saveSubscribers(subs);
    return res.status(200).json({ success: true, message: 'Subscriber lead deleted successfully.' });
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

  // Helper to persist subscriber into subscribers.json
  const persistSubscriberLead = (status) => {
    try {
      const subs = loadSubscribers();
      const existingIdx = subs.findIndex(s => s.customerEmail === customerEmail);
      const leadRecord = {
        id: existingIdx >= 0 ? subs[existingIdx].id : `sub-${Date.now()}`,
        customerName,
        customerEmail,
        customerPhone,
        cartTotal,
        itemsCount: items.length,
        itemsSummary: items.length > 0
          ? items.map(i => `${i.quantity || 1}x ${i.productName || i.name || 'Textile'}`).slice(0, 3).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '')
          : 'Active Cart Items',
        couponCode: couponCode || 'LAUNCH150',
        source: source === 'FLUTTER_APP' ? 'Mobile App' : 'Website',
        status: status || 'Voucher Emailed',
        createdAt: existingIdx >= 0 ? subs[existingIdx].createdAt : new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        subs[existingIdx] = { ...subs[existingIdx], ...leadRecord };
      } else {
        subs.unshift(leadRecord);
      }
      saveSubscribers(subs);
    } catch (err) {
      console.warn('Failed to update subscriber record:', err.message);
    }
  };

  // 2. ACTION: RECORD (Stores cart activity, timer fires after 30 mins)
  if (action === 'RECORD') {
    persistSubscriberLead('Pending (30-Min)');

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
    persistSubscriberLead('Voucher Emailed');

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
                    ${item.variantDescription || item.size || 'Premium Mill Quality'}
                  </div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; vertical-align: middle;">
            <span style="display: inline-block; background-color: #F1F5F9; color: #1E293B; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 8px;">
              ${item.quantity || item.units || 1} pcs
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
                        <a href="https://wa.me/919033598639?text=${encodeURIComponent(`Namaste Mahalaxmi Enterprises, I have items in my cart worth ₹${cartTotal}. Need help placing order.`)}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #25D366; color: #FFFFFF; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 12px; border-radius: 12px;">
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
                  Direct Loom Wholesale Hotline: +91 90335 98639
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const cartItemsBlock = `
    <div style="margin: 20px 0 16px; text-align: left; background-color: #FFFFFF; border: 1px solid #DBEAFE; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      <div style="background-color: #EFF6FF; padding: 12px 16px; font-weight: 900; font-size: 11px; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #DBEAFE;">
        🛒 Reserved Items In Your Cart
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <thead>
          <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">
            <th style="padding: 10px 14px; text-align: left; border-bottom: 1px solid #E2E8F0;">Product Item</th>
            <th style="padding: 10px 8px; text-align: center; border-bottom: 1px solid #E2E8F0; width: 55px;">Qty</th>
            <th style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #E2E8F0; width: 95px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="background-color: #F8FAFC; padding: 12px 16px; font-size: 12px; color: #059669; font-weight: 800; border-top: 1px solid #E2E8F0;">
        🎁 Use Coupon Code: LAUNCH150 for Extra Flat ₹150 Instant Off!
      </div>
    </div>
  `;

  // 1. Dispatch Customer Recovery Email via EmailJS
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
      let EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
      if (EMAILJS_TEMPLATE_ID === 'rn6jeir' || !EMAILJS_TEMPLATE_ID) {
        EMAILJS_TEMPLATE_ID = 'template_rxzob8r';
      }
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
            subject: `Flat ₹150 OFF on items waiting in your cart! | Mahalaxmi Enterprises`,
            headline: 'Mill Voucher: LAUNCH150',
            code_box: 'LAUNCH150',
            subtext: `Cart Value: ₹${Number(cartTotal).toLocaleString('en-IN')} • Valid Today`,
            cart_total: Number(cartTotal).toLocaleString('en-IN'),
            items_block: cartItemsBlock,
            message: `Items in your cart are waiting! Complete your order today and get instant flat ₹150 discount.`
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
      console.error(`[ABANDONED CART] Customer email delivery error:`, err);
    }
  }

  // 2. Dispatch Admin Notification via EmailJS
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
          subject: `🛒 Store Alert: Abandoned Cart (₹${Number(cartTotal).toLocaleString('en-IN')})`,
          headline: 'Abandoned Cart Lead',
          code_box: `₹${Number(cartTotal).toLocaleString('en-IN')}`,
          subtext: `Customer: ${customerName} (${source})`,
          items_block: cartItemsBlock,
          message: `Store Alert: Abandoned Cart Lead of ₹${Number(cartTotal).toLocaleString('en-IN')} by ${customerName} (${source})`
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
    console.error(`[ABANDONED CART] Admin lead alert delivery error:`, err);
  }
}
