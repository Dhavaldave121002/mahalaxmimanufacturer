import crypto from 'crypto';

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured on the server.');
  }
  return { keyId, keySecret };
}

export async function createRazorpayOrder({ amount, receipt }) {
  const { keyId, keySecret } = getCredentials();
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new Error('Payment amount must be at least ₹1.00.');
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt: String(receipt).slice(0, 40)
    })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.id) {
    console.error('Razorpay order creation failed:', response.status, result?.error?.code || 'provider_error');
    throw new Error('Razorpay could not create a payment order. Please retry.');
  }
  return { id: result.id, amount: result.amount, currency: result.currency, keyId };
}

export async function verifyRazorpayPayment({
  orderId,
  paymentId,
  signature,
  expectedAmount
}) {
  const { keySecret } = getCredentials();
  if (
    typeof orderId !== 'string' ||
    typeof paymentId !== 'string' ||
    typeof signature !== 'string' ||
    !Number.isSafeInteger(expectedAmount)
  ) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  let providedSignature;
  try {
    providedSignature = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  if (
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return false;
  }

  const { keyId } = getCredentials();
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
    }
  });
  const payment = await response.json().catch(() => null);
  return response.ok &&
    payment?.status === 'captured' &&
    payment?.order_id === orderId &&
    payment?.currency === 'INR' &&
    Number(payment?.amount) === expectedAmount;
}
