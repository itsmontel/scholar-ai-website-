/**
 * Regenerates public/downloads/writescholar-ultimate-study-tips-guide.pdf
 * from public/downloads/guide-source.html (print CSS, A4).
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'public/downloads/guide-source.html');
const outPath = path.join(root, 'public/downloads/writescholar-ultimate-study-tips-guide.pdf');
const fileUrl = `file://${htmlPath}`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 120000 });
await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});
await browser.close();
console.log('Wrote', outPath);
