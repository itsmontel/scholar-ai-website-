#!/usr/bin/env node
/**
 * After `vite build`, remove unused media from dist/ so production does not ship or serve them.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UNUSED_PUBLIC_MEDIA } from './unused-public-media.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(dist)) {
  process.exit(0);
}

for (const name of UNUSED_PUBLIC_MEDIA) {
  const p = path.join(dist, name);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('[strip-dist] removed', name);
    }
  } catch (e) {
    console.warn('[strip-dist] skip', name, e.message);
  }
}
