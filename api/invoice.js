import { getDbPool } from '../database/db.js';
import { requireAdminSession } from './_lib/admin-session.js';

const BUSINESS_LEGAL_NAME = 'Mahalaxmi Enterprise';
const BUSINESS_GSTIN = '24AKLPU0825E1Z8';
const BUSINESS_ADDRESS =
  '143, Raghuweer Estate, Behind Platinum Industrial Estate, Vatva Phase IV, Ahmedabad, Gujarat - 382440, India';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function parseAddress(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return { fullAddress: value };
    }
  }
  return value && typeof value === 'object' ? value : {};
}

function addressLines(address) {
  const parts = [
    address.fullName,
    address.companyName,
    address.street || address.fullAddress || address.addressLine1,
    address.landmark || address.addressLine2,
    [address.city, address.state].filter(Boolean).join(', '),
    address.pincode || address.postalCode,
    address.country
  ].filter(Boolean);
  return parts.map(part => `<div>${escapeHtml(part)}</div>`).join('') || '<div>Not provided</div>';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  const admin = await requireAdminSession(req, res);
  if (!admin) return;

  const { orderNumber, orderNo, id } = req.query;
  const rawTarget = String(orderNumber || orderNo || id || '').trim();
  const cleanTarget = rawTarget.replace('Order #', '').replace('#', '').trim();
  if (!cleanTarget) {
    res.status(400).json({ error: 'An order number is required to create an invoice.' });
    return;
  }

  let order = null;
  let items = [];

  const pool = getDbPool();
  if (pool && cleanTarget) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM orders 
         WHERE order_number = ? OR id = ?
         LIMIT 1`,
        [cleanTarget, cleanTarget]
      );

      if (rows && rows.length > 0) {
        order = rows[0];
        const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        items = itemRows || [];
      }
    } catch (e) {
      console.warn('MySQL invoice query error:', e.message);
      res.status(500).json({ error: 'Unable to load invoice order details.' });
      return;
    }
  }

  // Fallback to in-memory cache if not found in MySQL
  if (!order && globalThis._mle_orders_cache) {
    order = globalThis._mle_orders_cache.find(
      o =>
        (o.orderNumber && o.orderNumber === cleanTarget) ||
          (o.order_number && o.order_number === cleanTarget) ||
          (o.id && o.id === cleanTarget)
    );
    if (order) {
      items = order.items || [];
    }
  }

  if (!order) {
    res.status(pool ? 404 : 503).json({
      error: pool ? 'Order not found. Check the order number and try again.' : 'Invoice service is temporarily unavailable.'
    });
    return;
  }

  if (!items.length) {
    res.status(404).json({ error: 'No order items were found for this invoice.' });
    return;
  }

  const displayOrderNo = String(order.order_number || order.orderNumber || order.id);
  const invoiceNo = displayOrderNo.replace('MLE-APP-', 'INV-APP-').replace('MLE-ORD-', 'INV-ORD-').replace('Order #', 'INV-');
  const createdAt = order.created_at || order.createdAt;
  const invoiceDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not recorded';
  
  const customerName = order.customer_name || order.customer?.name || 'Not provided';
  const customerEmail = order.customer_email || order.customer?.email || 'Not provided';
  const customerPhone = order.customer_phone || order.customer?.phone || 'Not provided';
  const companyName = order.company_name || order.customer?.companyName || '';
  const gstNumber = order.gst_number || order.customer?.gstNumber || '';
  const paymentMethod = order.payment_method || order.paymentMethod || 'Not provided';
  const paymentStatus = order.payment_status || order.paymentStatus || 'Not provided';
  const subtotal = Number(order.subtotal ?? order.subtotalAmount ?? 0);
  const discount = Number(order.discount || 0);
  const shippingCharge = Number(order.shipping_charge ?? order.shippingCharge ?? 0);
  const totalAmount = Number(order.total_amount ?? order.totalAmount ?? 0);
  const taxBreakdown = order.taxBreakdown || {};
  const cgst = Number(order.cgst ?? taxBreakdown.cgst ?? 0);
  const sgst = Number(order.sgst ?? taxBreakdown.sgst ?? 0);
  const igst = Number(order.igst ?? taxBreakdown.igst ?? 0);
  const tax = Number(order.total_tax ?? taxBreakdown.totalTax ?? cgst + sgst + igst);
  const roundOff = Number((totalAmount - subtotal - tax - shippingCharge + discount).toFixed(2));
  const billingAddress = parseAddress(order.billing_address || order.billingAddress);
  const shippingAddress = parseAddress(order.shipping_address || order.shippingAddress);
  const placeOfSupply = shippingAddress.state || shippingAddress.cityState || 'Not provided';
  const escape = escapeHtml;

  const itemsList = items;

  const itemsHtml = itemsList.map((item, idx) => {
    const pName = item.product_name || item.productName || 'Not recorded';
    const variant = item.variant_description || item.variantDescription || '';
    const hsn = item.hsn_code || item.hsnCode || 'Not recorded';
    const qty = Number(item.quantity ?? 0);
    const uPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const tPrice = Number(item.total_price ?? item.totalPrice ?? uPrice * qty);
    const gstValue = item.gst_rate ?? item.gstRate;
    const gstRate = gstValue === null || gstValue === undefined || gstValue === ''
      ? 'Not recorded'
      : `${Number(gstValue)}%`;

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">
          <strong style="color: #0F172A; font-size: 13px;">${escape(pName)}</strong>
          ${variant ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${escape(variant)}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-family: monospace; font-size: 12px; color: #475569;">${escape(hsn)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #0F172A;">${qty}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; color: #334155;">₹${formatMoney(uPrice)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #059669; font-weight: bold;">${gstRate}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; font-weight: bold; color: #0F172A;">₹${formatMoney(tPrice)}</td>
      </tr>
    `;
  }).join('');
  const taxRowsHtml = [
    ['CGST', cgst],
    ['SGST', sgst],
    ['IGST', igst]
  ].filter(([, amount]) => Number(amount) > 0)
    .map(([label, amount]) => `
      <tr>
        <td style="padding: 6px 0; color: #64748B;">${label}:</td>
        <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #475569;">₹${formatMoney(amount)}</td>
      </tr>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Tax Invoice - ${escape(invoiceNo)} | ${escape(BUSINESS_LEGAL_NAME)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F1F5F9;
      color: #0F172A;
      margin: 0;
      padding: 20px 10px;
    }
    .invoice-wrapper {
      max-width: 850px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }
    .top-bar {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: #FFFFFF;
      padding: 16px 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #2563EB;
      color: #FFFFFF;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: #1D4ED8; }
    .btn-green { background: #16A34A; }
    .btn-green:hover { background: #15803D; }
    .invoice-body {
      padding: 32px 36px;
    }
    table { width: 100%; border-collapse: collapse; }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .invoice-wrapper { border: none; box-shadow: none; border-radius: 0; max-width: 100%; }
      .no-print { display: none !important; }
      .invoice-body { padding: 10px; }
    }
    @media (max-width: 640px) {
      .invoice-body { padding: 18px 16px; }
      .top-bar { padding: 12px 16px; }
    }
  </style>
</head>
<body>

  <div class="invoice-wrapper">
    <!-- Top Action Bar (hidden when printing) -->
    <div class="top-bar no-print">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></span>
        <span style="font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">GST TAX INVOICE</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.print()" class="btn">
          🖨️ Print / Save as PDF
        </button>
        <a href="https://wa.me/919033598639?text=${encodeURIComponent(`Namaste, please help me with invoice ${invoiceNo}.`)}" target="_blank" rel="noreferrer" class="btn btn-green">
          💬 WhatsApp Invoice
        </a>
      </div>
    </div>

    <div class="invoice-body">
      <!-- Header -->
      <table style="border-bottom: 2px solid #0F172A; padding-bottom: 20px; margin-bottom: 24px;">
        <tr>
          <td style="vertical-align: top;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0F172A;">MAHALAXMI<span style="color: #2563EB;">.</span></span>
              <span style="background: #0F172A; color: #F59E0B; font-size: 10px; font-weight: 900; padding: 3px 7px; border-radius: 4px; letter-spacing: 1px;">ENTERPRISES</span>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 4px;">Textile & Home Furnishing</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 6px; line-height: 1.5;">
              ${escape(BUSINESS_ADDRESS)}<br>
              <strong>GSTIN:</strong> ${escape(BUSINESS_GSTIN)} • <strong>State Code:</strong> 24<br>
              Support: +91 90335 98639 • mahalaxmienterprise881@gmail.com
            </div>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <div style="display: inline-block; background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
              TAX INVOICE
            </div>
            <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-top: 8px;">Invoice #: ${escape(invoiceNo)}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Date: <strong>${escape(invoiceDate)}</strong></div>
            <div style="font-size: 12px; color: #475569;">Order ID: <strong>${escape(displayOrderNo)}</strong></div>
            <div style="font-size: 12px; color: #059669; font-weight: bold; margin-top: 4px;">Payment: ${escape(paymentStatus)} via ${escape(paymentMethod)}</div>
          </td>
        </tr>
      </table>

      <!-- Customer Bill To & Ship To -->
      <table style="background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; padding: 16px; vertical-align: top; border-right: 1px solid #E2E8F0;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Billed To / Buyer Details</div>
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 4px;">${escape(companyName || customerName)}</div>
            ${companyName ? `<div style="font-size: 12px; color: #475569;">Contact: ${escape(customerName)}</div>` : ''}
            ${addressLines(billingAddress)}
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Phone: ${escape(customerPhone)}</div>
            <div style="font-size: 12px; color: #475569;">Email: ${escape(customerEmail)}</div>
            ${gstNumber ? `<div style="font-size: 11px; color: #0369A1; font-weight: bold; margin-top: 4px;">Buyer GSTIN: ${escape(gstNumber)}</div>` : ''}
          </td>
          <td style="width: 50%; padding: 16px; vertical-align: top;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Shipped To</div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-top: 4px;">${escape(shippingAddress.fullName || customerName)}</div>
            ${addressLines(shippingAddress)}
            <div style="font-size: 12px; color: #475569;">Place of Supply: ${escape(placeOfSupply)}</div>
          </td>
        </tr>
      </table>

      <!-- Items Table -->
      <table style="margin-bottom: 24px;">
        <thead>
          <tr style="background: #0F172A; color: #FFFFFF;">
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: center; border-top-left-radius: 8px;">#</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: left;">Item Description</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: center;">HSN Code</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: right;">Unit Price</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: center;">GST</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 800; text-align: right; border-top-right-radius: 8px;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <table style="margin-bottom: 24px;">
        <tr>
          <td style="width: 55%; vertical-align: top; padding-right: 20px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; font-size: 11px; line-height: 1.6;">
              <strong style="color: #0F172A;">Seller:</strong><br>
              ${escape(BUSINESS_LEGAL_NAME)}<br>
              GSTIN: ${escape(BUSINESS_GSTIN)}<br>
              ${escape(BUSINESS_ADDRESS)}
            </div>
          </td>

          <!-- Calculations -->
          <td style="width: 45%; vertical-align: top;">
            <table style="font-size: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Items Subtotal:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0F172A;">₹${formatMoney(subtotal)}</td>
              </tr>
              ${discount > 0 ? `<tr><td style="padding: 6px 0; color: #059669;">Discount:</td><td style="padding: 6px 0; text-align: right; font-family: monospace; color: #059669;">-₹${formatMoney(discount)}</td></tr>` : ''}
              ${taxRowsHtml}
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Total GST:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #475569;">₹${formatMoney(tax)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Shipping:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #475569;">₹${formatMoney(shippingCharge)}</td>
              </tr>
              ${Math.abs(roundOff) >= 0.01 ? `<tr><td style="padding: 6px 0; color: #64748B;">Rounding adjustment:</td><td style="padding: 6px 0; text-align: right; font-family: monospace; color: #475569;">₹${formatMoney(roundOff)}</td></tr>` : ''}
              <tr style="border-top: 2px solid #0F172A;">
                <td style="padding: 10px 0; font-size: 15px; font-weight: 900; color: #0F172A;">Order Total:</td>
                <td style="padding: 10px 0; text-align: right; font-size: 20px; font-weight: 900; font-family: monospace; color: #059669;">₹${formatMoney(totalAmount)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Signatory & Terms -->
      <table style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 16px;">
        <tr>
          <td style="font-size: 10px; color: #64748B; line-height: 1.5; vertical-align: top; width: 65%;">
            <strong>Order record:</strong><br>
            This document reflects the order, buyer, item, payment and tax details recorded for this transaction.<br>
            Please contact support promptly if any recorded detail needs correction.
          </td>
          <td style="text-align: right; vertical-align: bottom; width: 35%;">
            <div style="font-size: 11px; font-weight: 800; color: #0F172A;">For ${escape(BUSINESS_LEGAL_NAME)}</div>
            <div style="margin: 12px 0 6px 0;">
              <span style="display: inline-block; border: 1.5px dashed #059669; color: #059669; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 900; text-transform: uppercase;">
                COMPUTER GENERATED
              </span>
            </div>
            <div style="font-size: 10px; color: #64748B;">No manual signature required</div>
          </td>
        </tr>
      </table>

    </div>
  </div>

  <script>
    if (window.location.search.includes('print=true')) {
      window.onload = function() {
        setTimeout(function() { window.print(); }, 500);
      };
    }
  </script>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (typeof res.send === 'function') {
    return res.send(html);
  }
  return res.end(html);
}
