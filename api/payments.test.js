import assert from 'node:assert/strict';
import test from 'node:test';
import handler, { getRazorpayPaymentConfiguration } from './payments.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader() {}
  };
}

async function getAvailabilityWithEnvironment(environment) {
  const keys = [
    'NODE_ENV',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_CHECKOUT_ENABLED',
    'RAZORPAY_ALLOW_LIVE_LOCAL'
  ];
  const originalValues = Object.fromEntries(
    keys.map(key => [key, process.env[key]])
  );
  try {
    for (const key of keys) {
      if (environment[key] === undefined) delete process.env[key];
      else process.env[key] = environment[key];
    }
    const response = createResponse();
    await handler({ method: 'GET' }, response);
    return response;
  } finally {
    for (const key of keys) {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    }
  }
}

test('checkout rejects live Razorpay keys in local development', async () => {
  const response = await getAvailabilityWithEnvironment({
    NODE_ENV: 'development',
    RAZORPAY_KEY_ID: 'rzp_live_placeholder',
    RAZORPAY_KEY_SECRET: 'placeholder'
  });

  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /Local live payments are disabled/);
});

test('local live checkout requires an explicit opt-in', () => {
  const configuration = getRazorpayPaymentConfiguration({
    NODE_ENV: 'development',
    RAZORPAY_KEY_ID: 'rzp_live_placeholder',
    RAZORPAY_KEY_SECRET: 'placeholder',
    RAZORPAY_ALLOW_LIVE_LOCAL: 'true'
  });

  assert.equal(configuration.error, null);
  assert.equal(configuration.mode, 'live');
  assert.equal(configuration.localLivePayments, true);
});

test('production checkout rejects Razorpay test keys', async () => {
  const response = await getAvailabilityWithEnvironment({
    NODE_ENV: 'production',
    RAZORPAY_CHECKOUT_ENABLED: 'true',
    RAZORPAY_KEY_ID: 'rzp_test_placeholder',
    RAZORPAY_KEY_SECRET: 'placeholder'
  });

  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /live Razorpay credentials/);
});

test('production live credentials are not marked as local payments', () => {
  const configuration = getRazorpayPaymentConfiguration({
    NODE_ENV: 'production',
    RAZORPAY_CHECKOUT_ENABLED: 'true',
    RAZORPAY_KEY_ID: 'rzp_live_placeholder',
    RAZORPAY_KEY_SECRET: 'placeholder',
    RAZORPAY_ALLOW_LIVE_LOCAL: 'true'
  });

  assert.equal(configuration.error, null);
  assert.equal(configuration.mode, 'live');
  assert.equal(configuration.localLivePayments, false);
});
