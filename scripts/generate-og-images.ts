/**
 * Generates 1200×630 PNGs under public/og/ from src/data/ogRoutes.ts and blog posts.
 * Run: npx tsx scripts/generate-og-images.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { ogRoutes } from '../src/data/ogRoutes';
import { blogPostList } from '../src/data/blogPosts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/og');

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hueFromSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function wrapToLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (lines.length >= maxLines) break;
    const next = line ? `${line} ${w}` : w;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) {
        lines.push(line);
        line = w.length > maxChars ? `${w.slice(0, maxChars - 1)}…` : w;
      } else {
        lines.push(`${w.slice(0, maxChars - 1)}…`);
        line = '';
      }
      if (lines.length >= maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    const full = words.join(' ');
    const joined = lines.join(' ');
    if (joined.length < full.length) {
      const last = lines[maxLines - 1];
      if (!last.endsWith('…') && last.length > 14) {
        lines[maxLines - 1] = `${last.slice(0, maxChars - 2).trim()}…`;
      }
    }
  }
  return lines;
}

function buildSvg(opts: { headline: string; sub?: string; hue: number }): string {
  const { headline, sub, hue } = opts;
  const h2 = (hue + 28) % 360;
  const lines = wrapToLines(headline, 42, 3);
  const lineHeight = 50;
  const titleStartY = 188;
  const tspans = lines
    .map((line, i) => `<tspan x="64" dy="${i === 0 ? '0' : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
  const titleBlockBottom = titleStartY + Math.max(0, lines.length - 1) * lineHeight + 36;
  const subY = titleBlockBottom + (sub ? 8 : 0);
  const subBlock = sub
    ? `<text x="64" y="${subY}" font-size="28" fill="#4b5563" font-family="system-ui, -apple-system, Segoe UI, sans-serif">${escapeXml(sub)}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},72%,94%);stop-opacity:1" />
      <stop offset="100%" style="stop-color:hsl(${h2},58%,86%);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="64" y="${titleStartY}" font-size="46" font-weight="700" fill="#111827" font-family="system-ui, -apple-system, Segoe UI, sans-serif">${tspans}</text>
  ${subBlock}
  <text x="1136" y="588" font-size="22" font-weight="700" fill="#4f46e5" text-anchor="end" font-family="system-ui, -apple-system, Segoe UI, sans-serif">WriteScholar</text>
</svg>`;
}

async function writePng(basename: string, svg: string): Promise<void> {
  const outPath = path.join(OUT_DIR, `${basename}.png`);
  await sharp(Buffer.from(svg, 'utf-8')).png().toFile(outPath);
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const r of ogRoutes) {
    const svg = buildSvg({ headline: r.headline, sub: r.sub, hue: r.hue });
    await writePng(r.file, svg);
    console.log(`Wrote og/${r.file}.png`);
  }

  for (const post of blogPostList) {
    const hue = hueFromSlug(post.slug);
    const svg = buildSvg({
      headline: post.title,
      sub: 'WriteScholar blog',
      hue,
    });
    await writePng(`blog-${post.slug}`, svg);
    console.log(`Wrote og/blog-${post.slug}.png`);
  }

  console.log(`Done. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
