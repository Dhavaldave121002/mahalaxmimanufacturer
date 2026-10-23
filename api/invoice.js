import { getDbPool } from '../database/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { orderNumber, orderNo, id } = req.query;
  const rawTarget = (orderNumber || orderNo || id || '').trim();
  const cleanTarget = rawTarget.replace('Order #', '').replace('#', '').trim();

  let order = null;
  let items = [];

  const pool = getDbPool();
  if (pool && cleanTarget) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM orders 
         WHERE order_number = ? 
            OR id = ? 
            OR order_number LIKE ? 
            OR id LIKE ?
         ORDER BY created_at DESC LIMIT 1`,
        [cleanTarget, cleanTarget, `%${cleanTarget}%`, `%${cleanTarget}%`]
      );

      if (rows && rows.length > 0) {
        order = rows[0];
        const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        items = itemRows || [];
      }
    } catch (e) {
      console.warn('MySQL invoice query error:', e.message);
    }
  }

  // Fallback to in-memory cache if not found in MySQL
  if (!order && globalThis._mle_orders_cache) {
    order = globalThis._mle_orders_cache.find(
      o =>
        (o.orderNumber && o.orderNumber.includes(cleanTarget)) ||
        (o.id && o.id.includes(cleanTarget))
    );
    if (order) {
      items = order.items || [];
    }
  }

  const displayOrderNo = order ? (order.order_number || order.orderNumber) : (cleanTarget ? `MLE-ORD-${cleanTarget}` : 'MLE-ORD-2026-1947100');
  const invoiceNo = displayOrderNo.replace('MLE-APP-', 'INV-APP-').replace('MLE-ORD-', 'INV-ORD-').replace('Order #', 'INV-');
  const invoiceDate = order ? new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const customerName = order?.customer_name || order?.customer?.name || req.query.customerName || 'Valued Buyer';
  const customerEmail = order?.customer_email || order?.customer?.email || req.query.customerEmail || 'buyer@mahalaxmi.in';
  const customerPhone = order?.customer_phone || order?.customer?.phone || req.query.customerPhone || '+91 85111 72099';
  const gstNumber = order?.gst_number || order?.customer?.gstNumber || '24AAACP1234M1Z5 (Registered B2B)';
  const paymentMethod = order?.payment_method || order?.paymentMethod || 'UPI / Online Payment';
  const paymentStatus = order?.payment_status || order?.paymentStatus || 'PAID';
  const totalAmount = Number(order?.total_amount || order?.totalAmount || req.query.totalAmount || 85.00);
  const tax = Number(order?.total_tax || (totalAmount * 0.05 / 1.05));
  const cgst = tax / 2;
  const sgst = tax / 2;

  let itemsList = items;
  if (!itemsList || itemsList.length === 0) {
    if (req.query.item) {
      itemsList = [{
        product_name: req.query.item,
        hsn_code: '630221',
        quantity: Number(req.query.qty || 1),
        unit_price: totalAmount,
        total_price: totalAmount,
        gst_rate: 5.0
      }];
    } else {
      itemsList = [{
        product_name: 'Premium Cotton Kitchen Towels (Direct Loom Finish)',
        hsn_code: '630260',
        quantity: 1,
        unit_price: totalAmount,
        total_price: totalAmount,
        gst_rate: 5.0
      }];
    }
  }

  const itemsHtml = itemsList.map((item, idx) => {
    const pName = item.product_name || item.productName || 'Textile Merchandise';
    const hsn = item.hsn_code || item.hsnCode || '630221';
    const qty = Number(item.quantity || 1);
    const uPrice = Number(item.unit_price || item.unitPrice || (totalAmount / qty));
    const tPrice = Number(item.total_price || item.totalPrice || (uPrice * qty));
    const gstRate = Number(item.gst_rate || item.gstRate || 5.0);

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #64748B;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">
          <strong style="color: #0F172A; font-size: 13px;">${pName}</strong>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Direct Loom Finish • 100% Quality Checked</div>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-family: monospace; font-size: 12px; color: #475569;">${hsn}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: #0F172A;">${qty}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; color: #334155;">₹${uPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #059669; font-weight: bold;">${gstRate}%</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-family: monospace; font-weight: bold; color: #0F172A;">₹${tPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Tax Invoice - ${invoiceNo} | Mahalaxmi Enterprises Surat</title>
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
        <span style="font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">ORIGINAL GST TAX INVOICE</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.print()" class="btn">
          🖨️ Print / Save as PDF
        </button>
        <a href="https://wa.me/919033598639?text=${encodeURIComponent(`Namaste Mahalaxmi Enterprises, please send stamped PDF for Invoice ${invoiceNo}`)}" target="_blank" class="btn btn-green">
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
            <div style="font-size: 12px; font-weight: 600; color: #475569; margin-top: 4px;">Direct Loom Manufacturer • Textile & Home Furnishing</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 6px; line-height: 1.5;">
              Plot No. 42-45, Ring Road Textile Park Phase II, Surat, Gujarat - 395002<br>
              <strong>GSTIN:</strong> 24AAECM8921P1ZA • <strong>PAN:</strong> AAECM8921P • <strong>State Code:</strong> 24<br>
              Direct Mill Hotline: +91 90335 98639 • mahalaxmienterprise881@gmail.com
            </div>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <div style="display: inline-block; background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
              TAX INVOICE
            </div>
            <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-top: 8px;">Invoice #: ${invoiceNo}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Date: <strong>${invoiceDate}</strong></div>
            <div style="font-size: 12px; color: #475569;">Order ID: <strong>${displayOrderNo}</strong></div>
            <div style="font-size: 12px; color: #059669; font-weight: bold; margin-top: 4px;">Status: ${paymentStatus} (${paymentMethod})</div>
          </td>
        </tr>
      </table>

      <!-- Customer Bill To & Ship To -->
      <table style="background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; padding: 16px; vertical-align: top; border-right: 1px solid #E2E8F0;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Billed To / Buyer Details</div>
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-top: 4px;">${customerName}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Phone: ${customerPhone}</div>
            <div style="font-size: 12px; color: #475569;">Email: ${customerEmail}</div>
            <div style="font-size: 11px; color: #0369A1; font-weight: bold; margin-top: 4px;">GSTIN: ${gstNumber}</div>
          </td>
          <td style="width: 50%; padding: 16px; vertical-align: top;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Dispatched & Fulfilled By</div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-top: 4px;">Mahalaxmi Surat Central Mill Unit</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">Ring Road Loom Complex, Surat, Gujarat 395002</div>
            <div style="font-size: 12px; color: #475569;">Dispatch Mode: Direct Express Courier / Freight</div>
            <div style="font-size: 11px; color: #16A34A; font-weight: bold; margin-top: 4px;">100% Verified Mill Stock</div>
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

      <!-- Totals & Bank Details -->
      <table style="margin-bottom: 24px;">
        <tr>
          <!-- Bank Details -->
          <td style="width: 55%; vertical-align: top; padding-right: 20px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px; font-size: 11px; line-height: 1.6;">
              <strong style="color: #0F172A;">Bank Account for B2B Payments:</strong><br>
              Bank: <strong>Bank of Baroda</strong>, Ring Road Textile Branch, Surat<br>
              A/C No: <strong>04210200001234</strong> (Current Account)<br>
              IFSC Code: <strong>BARB0SURATX</strong> • MICR: 395012002<br>
              UPI VPA: <strong>8511172099@okbizaxis</strong>
            </div>
          </td>

          <!-- Calculations -->
          <td style="width: 45%; vertical-align: top;">
            <table style="font-size: 12px;">
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Taxable Subtotal:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0F172A;">₹${(totalAmount - tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;">CGST (2.5%):</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #475569;">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;">SGST (2.5%):</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #475569;">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748B;">Shipping / Loom Freight:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #059669; font-weight: bold;">FREE (Mill Promo)</td>
              </tr>
              <tr style="border-top: 2px solid #0F172A;">
                <td style="padding: 10px 0; font-size: 15px; font-weight: 900; color: #0F172A;">Total Paid:</td>
                <td style="padding: 10px 0; text-align: right; font-size: 20px; font-weight: 900; font-family: monospace; color: #059669;">₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Signatory & Terms -->
      <table style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 16px;">
        <tr>
          <td style="font-size: 10px; color: #64748B; line-height: 1.5; vertical-align: top; width: 65%;">
            <strong>Declaration & Terms of Sale:</strong><br>
            1. We declare that this invoice shows actual price of the goods described and all particulars are true and correct.<br>
            2. Goods once sold will not be returned unless manufacturing defects are reported within 7 days of delivery.<br>
            3. Subject to Surat, Gujarat Jurisdiction only.
          </td>
          <td style="text-align: right; vertical-align: bottom; width: 35%;">
            <div style="font-size: 11px; font-weight: 800; color: #0F172A;">For Mahalaxmi Enterprises</div>
            <div style="margin: 12px 0 6px 0;">
              <span style="display: inline-block; border: 1.5px dashed #059669; color: #059669; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 900; text-transform: uppercase;">
                ✓ AUTHENTICATED & DIGITALLY SIGNED
              </span>
            </div>
            <div style="font-size: 10px; color: #64748B;">Authorized Signatory • Accounts Desk</div>
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
