import { createRazorpayOrder } from './_lib/razorpay.js';
import { getDbPool } from '../database/db.js';
import { calculateCheckoutQuote } from './_lib/checkout-pricing.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const receipt = req.body?.receipt;
  if (typeof receipt !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(receipt)) {
    return res.status(400).json({ success: false, error: 'Invalid payment receipt.' });
  }

  try {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.RAZORPAY_CHECKOUT_ENABLED !== 'true'
    ) {
      return res.status(503).json({
        success: false,
        error: 'Live checkout has not been enabled by the production operator.'
      });
    }
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Order storage is unavailable. No payment was started.' });
    }
    if (Number(req.body?.pointsRedeemed || 0) > 0) {
      return res.status(503).json({
        success: false,
        error: 'Wallet-point checkout is temporarily unavailable. No payment was started.'
      });
    }
    const quote = await calculateCheckoutQuote(pool, req.body || {});
    if (process.env.NODE_ENV === 'production' &&
        process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
      return res.status(503).json({
        success: false,
        error: 'Live checkout is disabled while Razorpay is configured with test credentials.'
      });
    }
    const amount = Math.round(quote.totalAmount * 100);
    if (!Number.isSafeInteger(amount) || amount < 100 || amount > 100000000) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
    }
    const order = await createRazorpayOrder({ amount, receipt });
    return res.status(201).json({
      success: true,
      keyId: order.keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      quote
    });
  } catch (error) {
    console.error('Payment order request failed:', error.message);
    return res.status(503).json({
      success: false,
      error: 'Online payment is unavailable. No charge was started.'
    });
  }
}
