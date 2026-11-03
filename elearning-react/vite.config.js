import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { AccessToken } from 'livekit-server-sdk';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env variables so they are available in vite.config.js
dotenv.config();

const getAssignmentFiles = () => {
  try {
    const dir = path.resolve(process.cwd(), 'public/docs/Assignments');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(name => !name.startsWith('.'))
      .map(name => {
        const stats = fs.statSync(path.join(dir, name));
        return stats.isFile() ? { name, size: stats.size } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  } catch {
    return [];
  }
};

// https://vite.dev/config/
export default defineConfig({
  define: {
    'globalThis.__ASSIGNMENT_FILES__': JSON.stringify(getAssignmentFiles())
  },
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
               const userId = url.searchParams.get('userId');

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
                 identity: userId || username,
                 name: username,
               });
               
               at.addGrant({ roomJoin: true, room: room });

               const token = await at.toJwt();
               res.setHeader('Content-Type', 'application/json');
               res.statusCode = 200;
               return res.end(JSON.stringify({ token }));
            }
            
            if (req.originalUrl && req.originalUrl.startsWith('/api/create-checkout-session') && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', async () => {
                    try {
                        const parsedBody = JSON.parse(body);
                        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                        
                        if (!stripeSecretKey) {
                            res.statusCode = 500;
                            return res.end(JSON.stringify({ error: 'Missing Stripe secret key.' }));
                        }

                        // We can lazily import stripe here so it doesn't break if not installed
                        const Stripe = (await import('stripe')).default;
                        const stripe = new Stripe(stripeSecretKey);
                        
                        const unitAmount = Math.round(parsedBody.amount * 100);
                        
                        const session = await stripe.checkout.sessions.create({
                            line_items: [
                                {
                                    price_data: {
                                        currency: 'usd',
                                        product_data: { name: parsedBody.title },
                                        unit_amount: unitAmount,
                                    },
                                    quantity: 1,
                                },
                            ],
                            mode: 'payment',
                            success_url: `http://${req.headers.host}/courses?payment=success&courseId=${encodeURIComponent(parsedBody.courseId)}&sectionId=${encodeURIComponent(parsedBody.sectionId)}&type=${encodeURIComponent(parsedBody.type)}&amount=${encodeURIComponent(parsedBody.amount)}`,
                            cancel_url: `http://${req.headers.host}/courses?payment=cancel`,
                            metadata: {
                                courseId: parsedBody.courseId,
                                sectionId: parsedBody.sectionId,
                                type: parsedBody.type,
                                userId: parsedBody.userId
                            }
                        });
                        
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode = 200;
                        return res.end(JSON.stringify({ url: session.url }));
                    } catch (err) {
                        console.error("Stripe session error:", err);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
                return;
            }

            next();
          } catch (error) {
            console.error(error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Server error' }));
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
