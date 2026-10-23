import { getDbPool } from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { requireAdminSession } from './_lib/admin-session.js';
import { ensureCouponsTable } from './coupons.js';
import { validateCouponRecord } from './_lib/coupon-validation.js';

// Local-development fallback only; customer order data must not be a public asset.
if (!globalThis._mle_orders_cache) {
  globalThis._mle_orders_cache = [];
}

function readFallbackOrders() {
  if (globalThis._mle_orders_cache && globalThis._mle_orders_cache.length > 0) {
    return globalThis._mle_orders_cache;
  }
  try {
    const fPath = path.join(process.cwd(), 'private-data', 'fixtures', 'orders.json');
    if (fs.existsSync(fPath)) {
      const parsed = JSON.parse(fs.readFileSync(fPath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis._mle_orders_cache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('readFallbackOrders warning:', e.message);
  }
  return globalThis._mle_orders_cache || [];
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
    const admin = await requireAdminSession(req, res);
    if (!admin) return;
    const fallbackOrders = readFallbackOrders();
    if (!pool) {
      return res.status(200).json({
        success: true,
        source: 'LOCAL_FALLBACK',
        count: fallbackOrders.length,
        data: fallbackOrders
      });
    }
    try {
      const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      const [itemRows] = await pool.query('SELECT * FROM order_items');
      const allItems = itemRows || [];

      const itemsByOrderId = {};
      for (const item of allItems) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];

        let customization = null;
        if (item.variant_description && (item.variant_description.includes('Customized [') || item.variant_description.includes('['))) {
          const match = item.variant_description.match(/\[(.*)\]/);
          if (match && match[1]) {
            const parts = match[1].split(' • ').map(s => s.trim());
            const type = parts[0] || 'Customized';
            let logoText = '';
            let selectedSize = '';
            let customGsm = '';
            let designNote = '';
            let logoFileName = '';
            let designFileName = '';
            let techPackFileName = '';

            for (const p of parts.slice(1)) {
              if (p.startsWith('Logo: "') && p.endsWith('"')) {
                logoText = p.slice(7, -1);
              } else if (p.startsWith('Size: ')) {
                selectedSize = p.slice(6);
              } else if (p.startsWith('GSM: ')) {
                customGsm = p.slice(5);
              } else if (p.startsWith('📎 Logo: ')) {
                logoFileName = p.slice(9);
              } else if (p.startsWith('📎 Design: ')) {
                designFileName = p.slice(11);
              } else if (p.startsWith('📎 Spec: ')) {
                techPackFileName = p.slice(9);
              } else if (p.startsWith('Note: ')) {
                designNote = p.slice(6);
              }
            }

            customization = {
              type,
              logoText: logoText || 'MAHALAXMI',
              logoColor: '#EAB308',
              logoPosition: 'top-right',
              logoStyle: 'crown',
              selectedSize,
              customGsm,
              designNote,
              logoFileName: logoFileName || (type.includes('Logo') ? 'app_custom_logo.png' : undefined),
              designFileName: designFileName || (type.includes('Design') ? 'app_design_artwork.pdf' : undefined),
              techPackFileName: techPackFileName || undefined
            };
          }
        }

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
          gstRate: Number(item.gst_rate),
          customization
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
      console.error('MySQL fetch orders failed:', err);
      return res.status(503).json({
        success: false,
        error: 'Orders could not be loaded from the database. Please retry.'
      });
    }
  }

  // 2. POST: Insert new order, cancel order, or send abandoned cart recovery
  if (req.method === 'POST') {
    let o = req.body;
    if (!o || typeof o !== 'object' || Object.keys(o).length === 0) {
      if (typeof req[Symbol.asyncIterator] === 'function' && !req.readableEnded) {
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          if (chunks.length > 0) {
            o = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          }
        } catch (_) {}
      }
    }
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

    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'Order placement is unavailable until server-side pricing, inventory, and payment verification are configured.'
      });
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

    const subtotal = Number(o.subtotal ?? o.totalAmount ?? 0);
    let totalAmount = Number(o.totalAmount ?? o.subtotal ?? 0);
    let discount = Number(o.discount || 0);
    const couponCode = String(o.couponCode || '').trim().toUpperCase();
    const taxBreakdown = o.taxBreakdown || { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    const shippingCharge = Number(o.shippingCharge || 0);
    let couponToUse = null;
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

    // Normalize and enrich items for both Web & Flutter Mobile App orders
    if (Array.isArray(o.items)) {
      o.items = o.items.map(item => {
        let cust = item.customization;
        if (!cust && item.customizationType && item.customizationType !== 'No Customization') {
          cust = {
            type: item.customizationType,
            logoText: item.logoText || '',
            designNote: item.designNote || '',
            selectedSize: item.selectedSize || '',
            logoFileName: item.logoFileName || (item.customizationType.includes('Logo') ? 'mobile_app_logo.png' : undefined),
            designFileName: item.designFileName || (item.customizationType.includes('Design') ? 'mobile_artwork_spec.pdf' : undefined)
          };
        }

        let variantDesc = item.variantDescription;
        if (!variantDesc || variantDesc === 'Standard Pack') {
          if (cust && cust.type && cust.type !== 'No Customization') {
            const parts = [cust.type];
            if (cust.logoText) parts.push(`Logo: "${cust.logoText}"`);
            if (cust.selectedSize && cust.selectedSize !== 'Standard') parts.push(`Size: ${cust.selectedSize}`);
            if (cust.logoFileName) parts.push(`📎 Logo: ${cust.logoFileName}`);
            if (cust.designFileName) parts.push(`📎 Design: ${cust.designFileName}`);
            if (cust.designNote) parts.push(`Note: ${cust.designNote}`);
            variantDesc = `Customized [${parts.join(' • ')}]`;
          } else if (item.selectedVariant?.name) {
            variantDesc = item.selectedVariant.name;
          }
        }

        return {
          ...item,
          customization: cust,
          variantDescription: variantDesc || 'Standard Pack'
        };
      });
    }

    if (!Array.isArray(o.items) || o.items.length === 0) {
      return res.status(400).json({ success: false, error: 'An order must include at least one product.' });
    }

    const inventoryRequirements = new Map();
    for (const item of o.items) {
      const productId = String(item.productId || item.id || '').trim();
      const quantity = Number(item.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, error: 'Each order item must have a product ID and a positive whole-number quantity.' });
      }
      inventoryRequirements.set(productId, (inventoryRequirements.get(productId) || 0) + quantity);
    }

    const validateAndApplyCoupon = (coupon) => {
      const validation = validateCouponRecord(coupon, {
        subtotal,
        platform: source === 'FLUTTER_APP' ? 'APP' : 'WEB',
        customerType: isB2B ? 'B2B' : 'B2C'
      });
      if (!validation.valid) return validation;
      couponToUse = coupon;
      discount = validation.discount;
      totalAmount = Math.max(
        0,
        Number((subtotal + Number(taxBreakdown.totalTax || 0) + shippingCharge - discount).toFixed(2))
      );
      return validation;
    };

    const sendOrderEmails = async () => {
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
    };

    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Order storage is unavailable. No order was created; please retry later.'
      });
    }

    let connection;
    try {
      if (couponCode) await ensureCouponsTable(pool);
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const inventoryRows = new Map();
      for (const [productId, quantity] of inventoryRequirements) {
        const [rows] = await connection.query(
          'SELECT id, name, stock, specifications FROM products WHERE id = ? LIMIT 1 FOR UPDATE',
          [productId]
        );
        const product = rows[0];
        if (!product) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            error: 'A product in this order has no verified inventory record. Please contact the mill desk.'
          });
        }

        if (Number(product.stock) < quantity) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            error: Number(product.stock) <= 0
              ? `${product.name} is out of stock. Remove it from your cart before ordering.`
              : `${product.name} does not have enough confirmed stock for this order.`
          });
        }
        inventoryRows.set(productId, quantity);
      }

      if (couponCode) {
        const [couponRows] = await connection.query(
          'SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1 FOR UPDATE',
          [couponCode]
        );
        const validation = validateAndApplyCoupon(couponRows[0]);
        if (!validation.valid) {
          await connection.rollback();
          return res.status(409).json({ success: false, error: validation.message });
        }
      }
      let persistedUserId = customer.id || o.userId || null;
      if (customerEmail) {
        const [users] = await connection.query(
          'SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
          [customerEmail]
        );
        if (users.length > 0) persistedUserId = users[0].id;
      }
      await connection.query(
        `INSERT INTO orders (
          id, order_number, user_id, source, device_info,
          customer_name, customer_email, customer_phone, company_name, gst_number, is_b2b,
          subtotal, cgst, sgst, igst, total_tax, shipping_charge, discount, coupon_code, total_amount,
          payment_method, payment_status, status, shipping_address, billing_address, timeline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          persistedUserId,
          source,
          o.deviceInfo || (source === 'FLUTTER_APP' ? 'Flutter Android/iOS App' : 'Desktop/Mobile Web Browser'),
          customerName,
          customerEmail,
          customerPhone,
          companyName,
          gstNumber,
          isB2B,
          subtotal,
          taxBreakdown.cgst || 0,
          taxBreakdown.sgst || 0,
          taxBreakdown.igst || 0,
          taxBreakdown.totalTax || 0,
          shippingCharge,
          discount,
          couponCode || null,
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

          await connection.query(
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

      for (const [productId, quantity] of inventoryRows) {
        const [updateResult] = await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [quantity, productId, quantity]
        );
        if (updateResult.affectedRows !== 1) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            error: 'Product stock changed while placing your order. Refresh your cart and try again.'
          });
        }
      }

      if (couponToUse) {
        const [updateResult] = await connection.query(
          'UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND (usage_limit IS NULL OR usage_limit <= 0 OR used_count < usage_limit)',
          [couponToUse.id]
        );
        if (updateResult.affectedRows !== 1) {
          await connection.rollback();
          return res.status(409).json({
            success: false,
            error: `Coupon code "${couponCode}" has reached its usage limit.`
          });
        }
      }

      await connection.commit();
      await sendOrderEmails();
      return res.status(201).json({
        success: true,
        orderId,
        orderNumber,
        source,
        message: `Order ${orderNumber} successfully booked and stored in MySQL database!`
      });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.warn('MySQL order rollback failed:', rollbackError.message);
        }
      }
      console.warn('MySQL order insert failed:', err.message);
      return res.status(503).json({
        success: false,
        error: 'Order could not be saved to MySQL and was not confirmed.'
      });
    } finally {
      connection?.release();
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
                      🎨 Customization: ${item.customization.type}${item.customization.logoText ? ` • Logo: "${item.customization.logoText}"` : ''}${item.customization.selectedSize ? ` • Size: ${item.customization.selectedSize}` : ''}${item.customization.logoFileName ? ` • 📎 Logo: ${item.customization.logoFileName}` : ''}${item.customization.designFileName ? ` • 📎 Design: ${item.customization.designFileName}` : ''}${item.customization.techPackFileName ? ` • 📎 Spec: ${item.customization.techPackFileName}` : ''}
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
