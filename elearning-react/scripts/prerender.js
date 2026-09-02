import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.VERCEL) {
  console.log("Skipping prerender on Vercel build environment.");
  process.exit(0);
}

const PORT = 4000;
const DIST_DIR = path.resolve(__dirname, '../dist');
const ROUTES = ['/', '/about', '/courses', '/contact'];

// Start static server
const app = express();
app.use(express.static(DIST_DIR));
app.use((req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

const server = app.listen(PORT, async () => {
  console.log(`Starting pre-render server on port ${PORT}...`);
  
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const route of ROUTES) {
      console.log(`Pre-rendering ${route}...`);
      const page = await browser.newPage();
      
      // Go to the route and wait for the footer to appear (ensures React has mounted)
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.footer', { timeout: 10000 });
      
      // Wait an extra second to allow Helmet and async rendering to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the full HTML
      let html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
      
      // Ensure the directory exists
      const routePath = route === '/' ? '' : route;
      const dirPath = path.join(DIST_DIR, routePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Write the static index.html for this route
      const filePath = path.join(dirPath, 'index.html');
      fs.writeFileSync(filePath, html);
      console.log(`✅ Saved ${filePath}`);
      
      await page.close();
    }
    
    await browser.close();
    console.log('Pre-rendering complete.');
  } catch (err) {
    console.error('Pre-rendering failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
