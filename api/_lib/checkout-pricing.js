import { validateCouponRecord } from './coupon-validation.js';
import { ensureCouponsTable } from '../coupons.js';

function parseJson(value, fallback) {
  if (typeof value !== 'string') return value || fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function calculateCheckoutQuote(pool, {
  items,
  couponCode = '',
  source = 'WEB',
  customerType = 'B2C',
  shippingState = ''
}) {
  if (!pool) throw new Error('Order database is unavailable.');
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new Error('Cart items are missing or invalid.');
  }

  const normalizedItems = items.map(item => ({
    productId: String(item.productId || item.id || ''),
    quantity: Number(item.quantity),
    variantId: item.variantId ? String(item.variantId) : ''
  }));
  if (normalizedItems.some(item =>
    !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1
  )) {
    throw new Error('Each cart item must have a product and valid quantity.');
  }

  const quantities = new Map();
  for (const item of normalizedItems) {
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  const ids = [...quantities.keys()];
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, name, retail_price, stock, moq, gst_rate, hsn_code, wholesale_tiers, variants, specifications
     FROM products WHERE id IN (${placeholders})`,
    ids
  );
  const products = new Map(rows.map(product => [String(product.id), product]));
  if (products.size !== ids.length) throw new Error('A cart product is no longer available.');

  const lineItems = [];
  let subtotal = 0;
  let totalTax = 0;
  for (const item of normalizedItems) {
    const product = products.get(item.productId);
    const quantity = quantities.get(item.productId);
    if (Number(product.stock) < quantity) {
      throw new Error(`${product.name} does not have enough confirmed stock.`);
    }
    if (item.quantity < Number(product.moq || 1)) {
      throw new Error(`${product.name} requires a minimum order of ${product.moq} units.`);
    }
    const specifications = parseJson(product.specifications, {});
    if (specifications['Source Price Status'] === 'Approximate - verify before sale') {
      throw new Error(`${product.name} needs a verified price before online checkout.`);
    }

    const tiers = parseJson(product.wholesale_tiers, []);
    const tier = Array.isArray(tiers)
      ? tiers
          .filter(candidate => item.quantity >= Number(candidate.minQty || 1))
          .sort((a, b) => Number(b.minQty || 1) - Number(a.minQty || 1))[0]
      : null;
    let unitPrice = Number(tier?.pricePerUnit ?? product.retail_price);
    if (item.variantId) {
      const variants = parseJson(product.variants, []);
      const variant = Array.isArray(variants)
        ? variants.find(candidate => String(candidate.id) === item.variantId)
        : null;
      if (!variant) throw new Error(`A selected option for ${product.name} is unavailable.`);
      unitPrice += Number(variant.priceDelta || 0);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`The current price for ${product.name} is invalid.`);
    }
    unitPrice = Number(unitPrice.toFixed(2));
    const lineTotal = Number((unitPrice * item.quantity).toFixed(2));
    subtotal += lineTotal;
    totalTax += lineTotal * Number(product.gst_rate || 0) / 100;
    lineItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice: lineTotal,
      gstRate: Number(product.gst_rate || 0),
      hsnCode: product.hsn_code || '',
      productName: product.name
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  totalTax = Number(totalTax.toFixed(2));
  let discount = 0;
  const cleanCoupon = String(couponCode || '').trim().toUpperCase();
  if (cleanCoupon) {
    await ensureCouponsTable(pool);
    const [couponRows] = await pool.query(
      'SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1',
      [cleanCoupon]
    );
    const validation = validateCouponRecord(couponRows[0], {
      subtotal,
      platform: source === 'FLUTTER_APP' ? 'APP' : 'WEB',
      customerType
    });
    if (!validation.valid) throw new Error(validation.message);
    discount = validation.discount;
  }
  const shippingCharge = subtotal >= 1499 ? 0 : 99;
  const totalAmount = Math.max(
    0,
    Math.round(subtotal + totalTax + shippingCharge - discount)
  );
  const isGujarat = String(shippingState).trim().toLowerCase().includes('gujarat');
  const taxBreakdown = {
    cgst: isGujarat ? totalTax / 2 : 0,
    sgst: isGujarat ? totalTax / 2 : 0,
    igst: isGujarat ? 0 : totalTax,
    totalTax
  };

  return {
    items: lineItems,
    subtotal,
    discount,
    couponCode: cleanCoupon || null,
    shippingCharge,
    taxBreakdown,
    totalAmount
  };
}
