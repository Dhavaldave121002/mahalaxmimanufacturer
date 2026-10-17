import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
// @ts-ignore
import { testDbConnection } from './database/db.js';

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-handler',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
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
        if (req.url === '/api/db-status') {
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

        // 4. App Config & Notifications API
        if (req.url?.startsWith('/api/app-config')) {
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

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
});
