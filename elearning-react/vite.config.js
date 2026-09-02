import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { AccessToken } from 'livekit-server-sdk';
import { URL } from 'url';
import dotenv from 'dotenv';

// Load .env variables so they are available in vite.config.js
dotenv.config();

// https://vite.dev/config/
export default defineConfig({
  build: {
    target: 'es2015'
  },
  plugins: [
    react(),
    {
      name: 'livekit-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (req.originalUrl && req.originalUrl.startsWith('/api/livekit-token')) {
               const url = new URL(req.originalUrl, `http://${req.headers.host}`);
               const room = url.searchParams.get('room');
               const username = url.searchParams.get('username');

               if (!room || !username) {
                 res.statusCode = 400;
                 return res.end(JSON.stringify({ error: 'Missing room or username' }));
               }

               const apiKey = process.env.LIVEKIT_API_KEY;
               const apiSecret = process.env.LIVEKIT_API_SECRET;

               if (!apiKey || !apiSecret) {
                 res.statusCode = 500;
                 return res.end(JSON.stringify({ error: 'Server misconfigured. Missing API key or secret.' }));
               }

               const at = new AccessToken(apiKey, apiSecret, {
                 identity: username,
                 name: username,
               });
               
               at.addGrant({ roomJoin: true, room: room });

               const token = await at.toJwt();
               res.setHeader('Content-Type', 'application/json');
               res.statusCode = 200;
               return res.end(JSON.stringify({ token }));
            }
            next();
          } catch (error) {
            console.error(error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to generate token' }));
          }
        });
      }
    }
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    }
  }
})
