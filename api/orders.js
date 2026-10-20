import { getDbPool } from '../database/db.js';

// Global fallback cache for serverless environments when MySQL pool is offline
if (!globalThis._mle_orders_cache) {
  globalThis._mle_orders_cache = [];
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

  const pool = getDbPool();

  // 1. GET: Fetch all live orders with attached items
  if (req.method === 'GET') {
    if (!pool) {
      return res.status(200).json({
        success: true,
        source: 'LOCAL_FALLBACK',
        count: globalThis._mle_orders_cache.length,
        data: globalThis._mle_orders_cache
      });
    }
    try {
      const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      let allItems = [];
      try {
        const [itemRows] = await pool.query('SELECT * FROM order_items');
        allItems = itemRows || [];
      } catch (itemErr) {
        console.warn('Could not fetch order_items:', itemErr.message);
      }

      const itemsByOrderId = {};
      for (const item of allItems) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push({
          productId: item.product_id,
          productName: item.product_name,
          sku: item.sku,
          hsnCode: item.hsn_code,
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
          variantDescription: item.variant_description,
          image: item.image,
          gstRate: Number(item.gst_rate)
        });
      }

      const formatted = rows.map(r => {
        let shippingAddr = {};
        let billingAddr = {};
        let timelineArr = [];
        try {
          shippingAddr = typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : (r.shipping_address || {});
        } catch {}
        try {
          billingAddr = typeof r.billing_address === 'string' ? JSON.parse(r.billing_address) : (r.billing_address || {});
        } catch {}
        try {
          timelineArr = typeof r.timeline === 'string' ? JSON.parse(r.timeline) : (r.timeline || []);
        } catch {}

        return {
          id: r.id,
          orderNumber: r.order_number,
          createdAt: r.created_at,
          source: r.source || 'WEB',
          deviceInfo: r.device_info,
          customer: {
            id: r.user_id,
            name: r.customer_name,
            email: r.customer_email,
            phone: r.customer_phone,
            companyName: r.company_name,
            gstNumber: r.gst_number,
            isB2B: !!r.is_b2b
          },
          subtotal: Number(r.subtotal || 0),
          taxBreakdown: {
            cgst: Number(r.cgst || 0),
            sgst: Number(r.sgst || 0),
            igst: Number(r.igst || 0),
            totalTax: Number(r.total_tax || 0)
          },
          shippingCharge: Number(r.shipping_charge || 0),
          discount: Number(r.discount || 0),
          couponCode: r.coupon_code || undefined,
          totalAmount: Number(r.total_amount || 0),
          paymentMethod: r.payment_method || 'UPI',
          paymentStatus: r.payment_status || 'PAID',
          status: r.status || 'PLACED',
          shippingAddress: shippingAddr,
          billingAddress: billingAddr,
          trackingNumber: r.tracking_number,
          courierName: r.courier_name,
          timeline: timelineArr,
          items: itemsByOrderId[r.id] || []
        };
      });

      return res.status(200).json({ success: true, count: formatted.length, data: formatted });
    } catch (err) {
      console.error('Fetch orders error:', err);
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
    let customerEmail = (
      customer.email ||
      o.customerEmail ||
      o.email ||
      customer.userEmail ||
      o.userEmail ||
      ''
    ).trim();

    let customerName = (
      customer.name ||
      o.customerName ||
      o.name ||
      customer.fullName ||
      o.fullName ||
      ''
    ).trim();
    if (!customerName || customerName.toLowerCase() === 'customer' || customerName.toLowerCase() === 'valued customer') {
      if (customerEmail.includes('@')) {
        const raw = customerEmail.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
        if (raw.length > 1) {
          customerName = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }
      }
    }
    if (!customerName) customerName = 'Valued Customer';
    const customerPhone = customer.phone || o.customerPhone || o.phone || '+91 85111 72099';
    const companyName = customer.companyName || o.companyName || null;
    const gstNumber = customer.gstNumber || o.gstNumber || null;
    const isB2B = customer.isB2B || o.isB2B ? 1 : 0;

    const subtotal = Number(o.subtotal || o.totalAmount || 0);
    const totalAmount = Number(o.totalAmount || o.subtotal || 0);
    const paymentMethod = [
      'RAZORPAY',
      'UPI',
      'COD',
      'NET_BANKING',
      'WALLET_POINTS',
      'PARTIAL_POINTS_RAZORPAY',
      'PARTIAL_POINTS_COD',
      'CREDIT_30_DAYS'
    ].includes(o.paymentMethod)
      ? o.paymentMethod
      : 'RAZORPAY';
    const isCod = paymentMethod === 'COD' || paymentMethod === 'PARTIAL_POINTS_COD';
    const paymentStatus = ['PAID', 'PENDING', 'REFUNDED', 'CREDIT_APPROVED'].includes(o.paymentStatus)
      ? o.paymentStatus
      : isCod
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
    try {
      await sendOrderNotificationEmails({
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
      });
    } catch (e) {
      console.warn('Order notification email background error:', e);
    }

    if (!pool) {
      const fallbackOrder = {
        id: orderId,
        orderNumber,
        createdAt: new Date().toISOString(),
        source,
        deviceInfo: o.deviceInfo || (source === 'FLUTTER_APP' ? 'Flutter Android/iOS App' : 'Desktop/Mobile Web Browser'),
        customer: {
          id: customer.id || o.userId || null,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          companyName,
          gstNumber,
          isB2B: !!isB2B
        },
        subtotal,
        taxBreakdown: o.taxBreakdown || { cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
        shippingCharge: o.shippingCharge || 0,
        discount: o.discount || 0,
        couponCode: o.couponCode || undefined,
        totalAmount,
        paymentMethod,
        paymentStatus,
        status,
        shippingAddress: typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress,
        billingAddress: typeof billingAddress === 'string' ? JSON.parse(billingAddress) : billingAddress,
        timeline: typeof timeline === 'string' ? JSON.parse(timeline) : timeline,
        items: o.items || []
      };
      globalThis._mle_orders_cache.unshift(fallbackOrder);

      return res.status(201).json({
        success: true,
        orderId,
        orderNumber,
        source,
        message: 'Order created and saved in memory fallback store.'
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
  let {
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

  customerName = (customerName || '').trim();
  if (!customerName || customerName.toLowerCase() === 'valued customer' || customerName.toLowerCase() === 'customer') {
    if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('customer@mahalaxmi.in')) {
      const raw = customerEmail.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
      if (raw.length > 1) {
        customerName = raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  if (!customerName) customerName = 'Valued Customer';

  const DEFAULT_KEY_B64 = 'cmVfYUc4eUQ1bzVfQWJGUUJxeEZ2QTZRNFRGZmlDUU5iVHVw';
  const RESEND_API_KEY = process.env.RESEND_API_KEY || Buffer.from(DEFAULT_KEY_B64, 'base64').toString('ascii');
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
                  <img src="${itemImg}" alt="${item.productName || item.name || 'Textile'}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #CBD5E1; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <div style="font-weight: 800; font-size: 13px; color: #0F172A; line-height: 1.3;">
                    ${item.productName || item.name || 'Textile Product'}
                  </div>
                  <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
                    ${item.variantDescription || item.sku || 'Standard Mill Pack'}
                  </div>
                  ${item.customization && item.customization.type && item.customization.type !== 'No Customization' ? `
                    <div style="display: inline-block; background-color: #FAF5FF; border: 1px solid #D8B4FE; color: #6B21A8; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-top: 4px;">
                      🎨 Customization: ${item.customization.type}${item.customization.logoText ? ` • Logo: "${item.customization.logoText}"` : ''}${item.customization.selectedSize ? ` • Size: ${item.customization.selectedSize}` : ''}
                    </div>
                  ` : ''}
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; vertical-align: middle;">
            <span style="display: inline-block; background-color: #F1F5F9; color: #1E293B; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 8px;">
              ${item.quantity || 1}
            </span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; vertical-align: middle;">
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; font-family: monospace;">
              ₹${Number(item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
            </div>
            <div style="font-size: 10px; color: #94A3B8;">
              @ ₹${Number(item.unitPrice || item.price || 0).toLocaleString('en-IN')}/pc
            </div>
          </td>
        </tr>
      `;
      }).join('')
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

  const orderItemsBlock = `
    <div style="margin: 20px 0 16px; text-align: left; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
      <div style="background-color: #F8FAFC; padding: 12px 16px; font-weight: 900; font-size: 11px; color: #1E293B; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E2E8F0;">
        📦 Ordered Consignment Items (${(items && items.length) || 1} Products)
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
        📍 <strong style="color: #0F172A;">Delivery Destination:</strong> ${addressText}<br>
        💳 <strong style="color: #0F172A;">Payment Mode:</strong> ${paymentMethod} (${paymentStatus}) • <strong style="color: #059669;">Grand Total: ₹${Number(totalAmount).toLocaleString('en-IN')}</strong>
      </div>
    </div>
  `;

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

  // Concurrent EmailJS Dispatch Engine (Customer Confirmation + Store Admin Alert)
  try {
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID || 'service_935pxzz';
    let EMAILJS_ORDER_TEMPLATE_ID = process.env.EMAILJS_ORDER_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || 'template_rxzob8r';
    if (EMAILJS_ORDER_TEMPLATE_ID === 'rn6jeir' || !EMAILJS_ORDER_TEMPLATE_ID) {
      EMAILJS_ORDER_TEMPLATE_ID = 'template_rxzob8r';
    }
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID || 'G6gT9XDN4SFBz6oqW';
    const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

    if (EMAILJS_SERVICE_ID && EMAILJS_ORDER_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
      const dispatches = [];

      // Helper function to dispatch EmailJS with automatic fallback
      const sendEmailJsWithFallback = async (payload, targetEmail, label) => {
        try {
          let res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://mahalaxmimanufacturer.com'
            },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            console.log(`[EmailJS] ${label} delivered successfully to ${targetEmail}`);
            return;
          }
          // Retry with template_rxzob8r if primary returned non-200
          if (payload.template_id !== 'template_rxzob8r') {
            payload.template_id = 'template_rxzob8r';
            let retryRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://mahalaxmimanufacturer.com'
              },
              body: JSON.stringify(payload)
            });
            if (retryRes.ok) {
              console.log(`[EmailJS] ${label} delivered via fallback template_rxzob8r to ${targetEmail}`);
            } else {
              console.warn(`[EmailJS] ${label} retry failed:`, await retryRes.text());
            }
          } else {
            console.warn(`[EmailJS] ${label} error response:`, await res.text());
          }
        } catch (e) {
          console.warn(`[EmailJS] ${label} network error:`, e);
        }
      };

      // 1. Dispatch Customer Confirmation Email (Priority)
      if (customerEmail && customerEmail.includes('@') && !customerEmail.includes('customer@mahalaxmi.in')) {
        const customerPayload = {
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_ORDER_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: customerEmail,
            to_name: customerName,
            subject: `Order Confirmed: #${orderNumber} | Mahalaxmi Enterprises`,
            headline: 'Order Confirmed!',
            code_box: `#${orderNumber}`,
            subtext: `Total Value: ₹${Number(totalAmount).toLocaleString('en-IN')} • Ahmedabad Mill`,
            order_number: orderNumber,
            total_amount: Number(totalAmount).toLocaleString('en-IN'),
            items_block: orderItemsBlock,
            message: `Thank you for your order! Your consignment #${orderNumber} for ₹${Number(totalAmount).toLocaleString('en-IN')} is confirmed and being packed at Ahmedabad Direct Mill.`
          }
        };
        if (EMAILJS_PRIVATE_KEY) customerPayload.accessToken = EMAILJS_PRIVATE_KEY;

        dispatches.push(sendEmailJsWithFallback(customerPayload, customerEmail, 'Customer order confirmation'));
      }

      // 2. Dispatch Store Admin Alert Email
      if (primaryAdmin && primaryAdmin.includes('@')) {
        const adminPayload = {
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_ORDER_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: primaryAdmin,
            to_name: 'Mahalaxmi Mill Admin',
            subject: `🚨 New Order Alert: #${orderNumber} (₹${Number(totalAmount).toLocaleString('en-IN')}) | Mahalaxmi Admin`,
            headline: 'New Order Received!',
            code_box: `#${orderNumber}`,
            subtext: `Customer: ${customerName} (${customerPhone}) • ₹${Number(totalAmount).toLocaleString('en-IN')}`,
            order_number: orderNumber,
            total_amount: Number(totalAmount).toLocaleString('en-IN'),
            customer_name: customerName,
            customer_email: customerEmail || 'N/A',
            items_block: orderItemsBlock,
            message: `🚨 New order booked by ${customerName} (${customerPhone}) via ${source === 'FLUTTER_APP' ? 'Mobile App' : 'Website'}! Value: ₹${Number(totalAmount).toLocaleString('en-IN')}. Delivery to: ${addressText}.`
          }
        };
        if (EMAILJS_PRIVATE_KEY) adminPayload.accessToken = EMAILJS_PRIVATE_KEY;

        dispatches.push(sendEmailJsWithFallback(adminPayload, primaryAdmin, 'Store admin alert'));
      }

      await Promise.allSettled(dispatches);
    }
  } catch (err) {
    console.warn('Order notification emails dispatch failed:', err);
  }
}

