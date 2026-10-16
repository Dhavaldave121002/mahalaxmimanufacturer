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

  // 2. POST: Insert new order, cancel order, or send abandoned cart recovery
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

    // 2A. Cancel Order Action Delegation
    if (o.action === 'CANCEL' || o.action === 'CANCEL_ORDER') {
      try {
        const cancelMod = await import('./cancel-order.js');
        return await cancelMod.default(req, res);
      } catch (cancelErr) {
        return res.status(500).json({ success: false, error: cancelErr.message });
      }
    }

    // 2B. Abandoned Cart Action Delegation
    if (o.action === 'ABANDONED_CART') {
      try {
        const cartMod = await import('./abandoned-cart.js');
        return await cartMod.default(req, res);
      } catch (cartErr) {
        return res.status(500).json({ success: false, error: cartErr.message });
      }
    }

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

    let shippingAddress = '{}';
    if (typeof o.shippingAddress === 'object' && o.shippingAddress !== null) {
      shippingAddress = JSON.stringify(o.shippingAddress);
    } else if (typeof o.shippingAddress === 'string' && o.shippingAddress.trim()) {
      try {
        JSON.parse(o.shippingAddress);
        shippingAddress = o.shippingAddress;
      } catch (e) {
        shippingAddress = JSON.stringify({ fullAddress: o.shippingAddress });
      }
    }

    let billingAddress = shippingAddress;
    if (typeof o.billingAddress === 'object' && o.billingAddress !== null) {
      billingAddress = JSON.stringify(o.billingAddress);
    } else if (typeof o.billingAddress === 'string' && o.billingAddress.trim()) {
      try {
        JSON.parse(o.billingAddress);
        billingAddress = o.billingAddress;
      } catch (e) {
        billingAddress = JSON.stringify({ fullAddress: o.billingAddress });
      }
    }
    const timeline = Array.isArray(o.timeline)
      ? JSON.stringify(o.timeline)
      : JSON.stringify([
          {
            status: 'PLACED',
            timestamp: new Date().toISOString(),
            description: `Order successfully booked via ${source === 'FLUTTER_APP' ? 'Mobile App' : 'Web Store'}.`
          }
        ]);

    // Send automated notification emails (Admin Alert + Customer Confirmation)
    sendOrderNotificationEmails({
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      source,
      subtotal,
      totalAmount,
      paymentMethod,
      paymentStatus,
      shippingAddress: o.shippingAddress,
      items: o.items || []
    }).catch(e => console.warn('Order notification email background error:', e));

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

/**
 * Dispatch automated order emails via Resend REST API
 */
async function sendOrderNotificationEmails(data) {
  const {
    orderNumber,
    customerName,
    customerEmail,
    customerPhone,
    companyName,
    source,
    totalAmount,
    paymentMethod,
    paymentStatus,
    shippingAddress,
    items
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
              ${item.productName || item.name || 'Textile Product'}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
              ${item.variantDescription || item.sku || 'Standard Mill Pack'}
            </div>
          </td>
          <td style="padding: 12px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; vertical-align: middle;">
            <span style="display: inline-block; background-color: #F1F5F9; color: #1E293B; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 8px;">
              ${item.quantity || 1}
            </span>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #E2E8F0; text-align: right; vertical-align: middle;">
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; font-family: monospace;">
              ₹${Number(item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
            </div>
            <div style="font-size: 10px; color: #94A3B8;">
              @ ₹${Number(item.unitPrice || item.price || 0).toLocaleString('en-IN')}/pc
            </div>
          </td>
        </tr>
      `).join('')
    : `
      <tr>
        <td colspan="3" style="padding: 16px; text-align: center; color: #64748B; font-size: 13px;">
          Commercial Textile Consignment • ₹${Number(totalAmount).toLocaleString('en-IN')}
        </td>
      </tr>
    `;

  let addressText = 'Direct Surat Mill Central Dispatch';
  if (typeof shippingAddress === 'object' && shippingAddress !== null) {
    const parts = [
      shippingAddress.fullAddress || shippingAddress.addressLine1,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postalCode || shippingAddress.pincode
    ].filter(Boolean);
    addressText = parts.length > 0 ? parts.join(', ') : 'Direct Surat Mill Dispatch';
  } else if (typeof shippingAddress === 'string' && shippingAddress.trim()) {
    addressText = shippingAddress;
  }

  const rawPhone = (customerPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Namaste ${customerName}, Mahalaxmi Enterprises se aapke Order #${orderNumber} (₹${Number(totalAmount).toLocaleString('en-IN')}) ki details hume mil gayi hain. Jaldi dispatch karenge!`
  )}`;

  // 1. Dispatch Alert Email to Store Owner
  const adminHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>New Order Alert: ${orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 16px 8px; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto;">
        <tr>
          <td>
            <!-- Main Card Container -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 12px 36px rgba(0,0,0,0.35);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #14213D 0%, #0F172A 100%); padding: 26px 20px; text-align: center; border-bottom: 3px solid #C6AA80;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background-color: #C6AA80; color: #14213D; font-weight: 900; font-size: 18px; width: 36px; height: 36px; line-height: 36px; border-radius: 10px; margin-bottom: 8px;">
                          M
                        </div>
                        <div style="color: #FFFFFF; font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                          MAHALAXMI ENTERPRISES
                        </div>
                        <div style="color: #C6AA80; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px;">
                          SURAT DIRECT MILL DISPATCH DESK
                        </div>

                        <!-- Source Badge -->
                        <div style="margin-top: 14px;">
                          <span style="display: inline-block; background-color: ${source === 'FLUTTER_APP' ? '#059669' : '#2563EB'}; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${source === 'FLUTTER_APP' ? '📱 Mobile App Order' : '🌐 Web Store Order'}
                          </span>
                        </div>

                        <!-- Order Number Banner -->
                        <div style="margin-top: 12px; background-color: rgba(255,255,255,0.08); border: 1px dashed rgba(198,170,128,0.5); border-radius: 10px; padding: 8px 14px; display: inline-block;">
                          <span style="color: #94A3B8; font-size: 11px; font-weight: 600;">ORDER REF: </span>
                          <strong style="color: #FFFFFF; font-size: 14px; font-family: monospace; letter-spacing: 0.5px;">${orderNumber}</strong>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body Content -->
              <tr>
                <td style="padding: 24px 20px; background-color: #FFFFFF;">
                  
                  <!-- Section: Customer / Buyer Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 22px;">
                    <tr>
                      <td style="padding: 16px;">
                        <div style="font-size: 11px; font-weight: 800; color: #14213D; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
                          👤 Buyer & Delivery Details
                        </div>

                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.6;">
                          <tr>
                            <td width="30%" style="color: #64748B; font-weight: 600; padding: 3px 0;">Customer:</td>
                            <td style="color: #0F172A; font-weight: 800; padding: 3px 0;">
                              ${customerName} ${companyName ? `<span style="color: #475569; font-weight: 600;">(${companyName})</span>` : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #64748B; font-weight: 600; padding: 3px 0;">Mobile Phone:</td>
                            <td style="padding: 3px 0;">
                              <a href="tel:${customerPhone}" style="color: #14213D; font-weight: 800; text-decoration: none;">
                                📞 ${customerPhone}
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #64748B; font-weight: 600; padding: 3px 0; vertical-align: top;">Email:</td>
                            <td style="color: #0F172A; font-weight: 600; padding: 3px 0; word-break: break-all;">
                              ${customerEmail}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #64748B; font-weight: 600; padding: 3px 0; vertical-align: top;">Destination:</td>
                            <td style="color: #0F172A; font-weight: 700; padding: 3px 0;">
                              📍 ${addressText}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Section: Ordered Items -->
                  <div style="font-size: 11px; font-weight: 800; color: #14213D; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;">
                    📦 Ordered Consignment Items
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                        <th style="padding: 10px 14px; text-align: left; border-bottom: 2px solid #E2E8F0;">Product Item</th>
                        <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #E2E8F0; width: 55px;">Qty</th>
                        <th style="padding: 10px 14px; text-align: right; border-bottom: 2px solid #E2E8F0; width: 90px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Section: Order Summary & Grand Total -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%); border: 1px solid #CBD5E1; border-radius: 14px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="color: #64748B; font-size: 12px; font-weight: 600; padding: 3px 0;">Payment Method:</td>
                            <td align="right" style="padding: 3px 0;">
                              <span style="background-color: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 8px;">
                                ${paymentMethod} (${paymentStatus})
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #0F172A; font-size: 16px; font-weight: 900; padding-top: 10px; border-top: 1px solid #E2E8F0;">
                              Grand Total:
                            </td>
                            <td align="right" style="font-size: 24px; font-weight: 900; color: #059669; font-family: monospace; padding-top: 10px; border-top: 1px solid #E2E8F0;">
                              ₹${Number(totalAmount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Primary Action: WhatsApp Customer Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                    <tr>
                      <td align="center">
                        <a href="${whatsappUrl}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #25D366; color: #FFFFFF; font-weight: 900; font-size: 14px; text-align: center; text-decoration: none; padding: 14px 20px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37,211,102,0.4);">
                          💬 Message Customer on WhatsApp
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Secondary Action: Direct Phone Call -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="tel:${customerPhone}" style="display: block; width: 100%; box-sizing: border-box; background-color: #F1F5F9; color: #1E293B; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 12px 20px; border-radius: 12px; border: 1px solid #CBD5E1;">
                          📞 Call Customer (${customerPhone})
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; padding: 16px 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
                  <strong style="color: #64748B;">Mahalaxmi Enterprises Central ERP</strong><br>
                  Surat Direct Mill Rates & Wholesale Portal • Ring Road, Surat, Gujarat
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Dispatch to Primary Admin (deviltimeisback001@gmail.com - verified in Resend)
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mahalaxmi Enterprises <onboarding@resend.dev>',
        to: [primaryAdmin],
        subject: `🚨 [New Order] #${orderNumber} (₹${Number(totalAmount).toLocaleString('en-IN')}) via ${source === 'FLUTTER_APP' ? 'Mobile App' : 'Website'}`,
        html: adminHtml
      })
    });
  } catch (err) {
    console.warn('Admin notification email dispatch failed:', err);
  }

  // Attempt dispatch to Secondary Admin (dhavaldave121002@gmail.com)
  if (secondaryAdmin !== primaryAdmin) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Mahalaxmi Enterprises <onboarding@resend.dev>',
        to: [secondaryAdmin],
        subject: `🚨 [New Order] #${orderNumber} (₹${Number(totalAmount).toLocaleString('en-IN')}) via ${source === 'FLUTTER_APP' ? 'Mobile App' : 'Website'}`,
        html: adminHtml
      })
    }).catch(() => {});
  }

  // 2. Dispatch Confirmation Email to Customer (Strictly to Customer)
  if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('customer@mahalaxmi.in')) {
    const customerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light">
        <meta name="supported-color-schemes" content="light">
        <title>Order Confirmed: #${orderNumber}</title>
      </head>
      <body style="margin: 0; padding: 16px 8px; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 580px; margin: 0 auto;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 12px 36px rgba(0,0,0,0.35);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #14213D 0%, #0F172A 100%); padding: 28px 20px; text-align: center; border-bottom: 3px solid #C6AA80;">
                    <div style="display: inline-block; background-color: #C6AA80; color: #14213D; font-weight: 900; font-size: 18px; width: 36px; height: 36px; line-height: 36px; border-radius: 10px; margin-bottom: 8px;">
                      M
                    </div>
                    <div style="color: #FFFFFF; font-size: 18px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                      MAHALAXMI ENTERPRISES
                    </div>
                    <div style="color: #C6AA80; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px;">
                      SURAT DIRECT MILL RATES & WHOLESALE DISPATCH
                    </div>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 26px 20px; background-color: #FFFFFF;">
                    
                    <div style="text-align: center; margin-bottom: 22px;">
                      <div style="display: inline-block; background-color: #DCFCE7; color: #15803D; font-size: 12px; font-weight: 900; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ✅ ORDER BOOKED SUCCESSFULLY
                      </div>
                      <h2 style="margin: 12px 0 4px; font-size: 20px; font-weight: 900; color: #0F172A;">
                        Thank You, ${customerName}!
                      </h2>
                      <div style="color: #64748B; font-size: 13px;">
                        Order Ref: <strong style="color: #0F172A; font-family: monospace;">${orderNumber}</strong>
                      </div>
                    </div>

                    <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 20px; text-align: center;">
                      Your consignment has been allocated to our Surat Central Loom & Dispatch unit. Your official GST Commercial Invoice is prepared and will accompany the freight shipment.
                    </p>

                    <!-- Ordered Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; margin-bottom: 20px;">
                      <thead>
                        <tr style="background-color: #F1F5F9; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">
                          <th style="padding: 10px 14px; text-align: left; border-bottom: 2px solid #E2E8F0;">Item Description</th>
                          <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #E2E8F0; width: 55px;">Qty</th>
                          <th style="padding: 10px 14px; text-align: right; border-bottom: 2px solid #E2E8F0; width: 90px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Summary Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; margin-bottom: 22px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="color: #64748B; font-size: 12px; font-weight: 600;">Payment Mode:</td>
                              <td align="right" style="color: #0F172A; font-size: 12px; font-weight: 800;">
                                ${paymentMethod}
                              </td>
                            </tr>
                            <tr>
                              <td style="color: #0F172A; font-size: 16px; font-weight: 900; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                                Total Amount:
                              </td>
                              <td align="right" style="font-size: 22px; font-weight: 900; color: #059669; font-family: monospace; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                                ₹${Number(totalAmount).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- WhatsApp Helpline Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="https://wa.me/918511172099?text=${encodeURIComponent(`Namaste Mahalaxmi Enterprises, I need help with my Order ${orderNumber}`)}" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #25D366; color: #FFFFFF; font-weight: 800; font-size: 13px; text-align: center; text-decoration: none; padding: 13px 20px; border-radius: 12px;">
                            💬 Contact Surat Mill Helpline on WhatsApp
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8FAFC; padding: 16px 20px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8;">
                    Mahalaxmi Enterprises • Ring Road, Textile Market, Surat, Gujarat<br>
                    Official Mill Hotline: +91 85111 72099 • 100% Direct Loom Rates
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Mahalaxmi Enterprises <onboarding@resend.dev>',
          to: [customerEmail],
          subject: `Order Confirmed: #${orderNumber} | Mahalaxmi Enterprises Surat`,
          html: customerHtml
        })
      });
    } catch (err) {
      console.warn('Customer confirmation email dispatch failed:', err);
    }
  }
}

