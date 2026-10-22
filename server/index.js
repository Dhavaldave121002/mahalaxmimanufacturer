import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDbConnection } from '../database/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const apiHandlers = {
  '/api/app-config': '../api/app-config.js',
  '/api/products': '../api/products.js',
  '/api/orders': '../api/orders.js',
  '/api/coupons': '../api/coupons.js',
  '/api/return-exchange': '../api/return-exchange.js',
  '/api/enquiry': '../api/enquiry.js',
  '/api/auth': '../api/auth.js',
  '/api/wishlist': '../api/wishlist.js',
  '/api/cancel-order': '../api/cancel-order.js',
  '/api/abandoned-cart': '../api/abandoned-cart.js',
  '/api/invoice': '../api/invoice.js',
  '/api/send-otp': '../api/send-otp.js'
};

app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const database = await testDbConnection();
  res.status(database.connected ? 200 : 503).json({
    status: database.connected ? 'ONLINE' : 'DEGRADED',
    service: 'Mahalaxmi Enterprises Central Backend',
    version: '1.0.3',
    database: { connected: database.connected },
    timestamp: new Date().toISOString()
  });
});

for (const [route, modulePath] of Object.entries(apiHandlers)) {
  app.all(route, async (req, res) => {
    try {
      const handler = await import(modulePath);
      await handler.default(req, res);
    } catch (error) {
      console.error(`API handler failed for ${route}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'The request could not be completed.' });
      }
    }
  });
}

app.listen(PORT, () => {
  console.log(`Mahalaxmi Enterprises backend listening on port ${PORT}`);
});
