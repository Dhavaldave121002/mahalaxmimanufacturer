import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
// @ts-ignore
import { testDbConnection } from './database/db.js';

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-handler',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = new URL(req.url || '/', 'http://localhost');
        (req as any).query = Object.fromEntries(requestUrl.searchParams.entries());

        // Polyfill express/Vercel helper methods on Node ServerResponse
        const expressRes = res as any;
        if (!expressRes.status) {
          expressRes.status = function (statusCode: number) {
            expressRes.statusCode = statusCode;
            return expressRes;
          };
        }
        if (!expressRes.json) {
          expressRes.json = function (data: any) {
            expressRes.setHeader('Content-Type', 'application/json');
            expressRes.end(JSON.stringify(data));
            return expressRes;
          };
        }
        if (!expressRes.send) {
          expressRes.send = function (data: any) {
            if (typeof data === 'string') {
              expressRes.end(data);
            } else {
              expressRes.setHeader('Content-Type', 'application/json');
              expressRes.end(JSON.stringify(data));
            }
            return expressRes;
          };
        }

        // Helper to parse JSON body
        async function ensureBodyParsed() {
          if (req.method === 'POST' || req.method === 'PUT') {
            if (!(req as any).body) {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const bodyStr = Buffer.concat(chunks).toString();
              try {
                (req as any).body = JSON.parse(bodyStr);
              } catch {
                (req as any).body = {};
              }
            }
          }
        }

        // 1. DB Status API
        if (req.url === '/api/db-status' || req.url?.includes('check_db=true')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const result = await testDbConnection();
          expressRes.json(result);
          return;
        }

        // 2. Orders API (Web & Flutter Mobile App)
        if (req.url?.startsWith('/api/orders')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/orders.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 3. Products API
        if (req.url?.startsWith('/api/products')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/products.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        if (req.url?.startsWith('/api/restock-alerts')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/restock-alerts.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 4. App Config & Notifications API
        if (req.url?.startsWith('/api/app-config') || req.url?.includes('action=pincode')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/app-config.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 5. Send OTP Email API
        if (req.url?.startsWith('/api/send-otp')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/send-otp.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 6. Cancel Order API
        if (req.url?.startsWith('/api/cancel-order')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/cancel-order.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 7. Abandoned Cart Recovery API
        if (req.url?.startsWith('/api/abandoned-cart')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/abandoned-cart.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 8. Official GST Tax Invoice Endpoint (Print / PDF / Download)
        if (req.url?.startsWith('/api/invoice')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          try {
            const urlObj = new URL(req.url, 'http://localhost:5173');
            (req as any).query = Object.fromEntries(urlObj.searchParams.entries());
            // @ts-ignore
            const mod = await import('./api/invoice.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        
        // 9. Return & Exchange Request API
        if (req.url?.startsWith('/api/return-exchange')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/return-exchange.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 10. Business Enquiries & RFQ API
        if (req.url?.startsWith('/api/enquiry')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/enquiry.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 11. Auth API (Login, Register, Profile Update)
        if (req.url?.startsWith('/api/auth')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/auth.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 12. Wishlist Synchronization API
        if (req.url?.startsWith('/api/wishlist')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            const urlObj = new URL(req.url, 'http://localhost:5173');
            (req as any).query = Object.fromEntries(urlObj.searchParams.entries());
            // @ts-ignore
            const mod = await import('./api/wishlist.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        // 13. Coupons API
        if (req.url?.startsWith('/api/coupons')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          await ensureBodyParsed();
          try {
            // @ts-ignore
            const mod = await import('./api/coupons.js');
            await mod.default(req, expressRes);
          } catch (e: any) {
            expressRes.status(500).json({ success: false, error: e.message });
          }
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
});
