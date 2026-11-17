import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCheckoutQuote, CheckoutQuoteError } from './checkout-pricing.js';

test('checkout quote exposes stale product and stock issues as safe cart errors', async () => {
  const missingProductPool = {
    query: async () => [[]]
  };
  await assert.rejects(
    calculateCheckoutQuote(missingProductPool, {
      items: [{ productId: 'missing-product', quantity: 1 }]
    }),
    error => error instanceof CheckoutQuoteError &&
      error.message.includes('no longer available')
  );

  const outOfStockPool = {
    query: async () => [[{
      id: 'product-1',
      name: 'Test product',
      retail_price: 10,
      stock: 0,
      moq: 1
    }]]
  };
  await assert.rejects(
    calculateCheckoutQuote(outOfStockPool, {
      items: [{ productId: 'product-1', quantity: 1 }]
    }),
    error => error instanceof CheckoutQuoteError &&
      error.message.includes('confirmed stock')
  );
});
