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

        // DB Status API
        if (req.url === '/api/db-status') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const result = await testDbConnection();
          expressRes.json(result);
          return;
        }

        // App Config & Notifications API
        if (req.url?.startsWith('/api/app-config')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

          if (req.method === 'OPTIONS') {
            expressRes.status(200).end();
            return;
          }

          // Parse POST body if needed
          if (req.method === 'POST') {
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

          try {
            // @ts-ignore
            const mod = await import('./api/app-config.js');
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
