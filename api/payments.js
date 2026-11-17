import { createRazorpayOrder } from './_lib/razorpay.js';
import { getDbPool, testDbConnection } from '../database/db.js';
import { calculateCheckoutQuote, CheckoutQuoteError } from './_lib/checkout-pricing.js';

export function getRazorpayPaymentConfiguration(environment = process.env) {
  const keyId = environment.RAZORPAY_KEY_ID;
  const keySecret = environment.RAZORPAY_KEY_SECRET;
  const isProduction = environment.NODE_ENV === 'production';

  if (isProduction && environment.RAZORPAY_CHECKOUT_ENABLED !== 'true') {
    return { mode: null, localLivePayments: false, error: 'Live online payments have not been enabled. No payment was started.' };
  }
  if (!keyId || !keySecret) {
    return { mode: null, localLivePayments: false, error: 'Online payments are not configured. No payment was started.' };
  }
  if (isProduction && !keyId.startsWith('rzp_live_')) {
    return { mode: null, localLivePayments: false, error: 'Live payments require live Razorpay credentials. No payment was started.' };
  }
  if (!isProduction && keyId.startsWith('rzp_live_') && environment.RAZORPAY_ALLOW_LIVE_LOCAL !== 'true') {
    return {
      mode: null,
      localLivePayments: false,
      error: 'Local live payments are disabled. Set RAZORPAY_ALLOW_LIVE_LOCAL=true only if you accept real charges.'
    };
  }
  if (!isProduction && !keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    return { mode: null, localLivePayments: false, error: 'Local checkout requires Razorpay test credentials. No payment was started.' };
  }

  const mode = keyId.startsWith('rzp_live_') ? 'live' : 'test';
  return { mode, localLivePayments: !isProduction && mode === 'live', error: null };
}

async function getPaymentUnavailableReason() {
  const paymentConfiguration = getRazorpayPaymentConfiguration();
  if (paymentConfiguration.error) return paymentConfiguration.error;

  try {
    const database = await testDbConnection();
    if (!database.connected) {
      return 'Order storage is unavailable. No payment was started.';
    }
  } catch {
    return 'Order storage could not be checked. No payment was started.';
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    const error = await getPaymentUnavailableReason();
    const paymentConfiguration = getRazorpayPaymentConfiguration();
    return res.status(error ? 503 : 200).json({
      success: !error,
      ...(error ? { error } : {
        mode: paymentConfiguration.mode,
        localLivePayments: paymentConfiguration.localLivePayments
      })
    });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const receipt = req.body?.receipt;
  if (typeof receipt !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(receipt)) {
    return res.status(400).json({ success: false, error: 'Invalid payment receipt.' });
  }

  try {
    const unavailableReason = await getPaymentUnavailableReason();
    if (unavailableReason) {
      return res.status(503).json({
        success: false,
        error: unavailableReason,
        code: 'CHECKOUT_UNAVAILABLE'
      });
    }
    const paymentConfiguration = getRazorpayPaymentConfiguration();
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
    let quote;
    try {
      quote = await calculateCheckoutQuote(pool, req.body || {});
    } catch (error) {
      if (error instanceof CheckoutQuoteError) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: 'CART_REVIEW_REQUIRED'
        });
      }
      throw error;
    }
    if (req.body?.source === 'FLUTTER_APP' && req.body.expectedAmount !== undefined) {
      const expectedAmount = Number(req.body.expectedAmount);
      if (!Number.isFinite(expectedAmount) || expectedAmount < 0 ||
          Math.round(expectedAmount * 100) !== Math.round(quote.totalAmount * 100)) {
        return res.status(409).json({
          success: false,
          error: `Cart total ₹${Number.isFinite(expectedAmount) ? expectedAmount.toLocaleString('en-IN') : 'unknown'} does not match the current server total ₹${quote.totalAmount.toLocaleString('en-IN')}. Refresh product prices and retry.`,
          quote
        });
      }
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
      quote,
      mode: paymentConfiguration.mode,
      localLivePayments: paymentConfiguration.localLivePayments
    });
  } catch (error) {
    console.error('Payment order request failed:', error.message);
    return res.status(503).json({
      success: false,
      error: 'Checkout could not verify current prices and stock. No payment was started.',
      code: 'CHECKOUT_UNAVAILABLE'
    });
  }
}
