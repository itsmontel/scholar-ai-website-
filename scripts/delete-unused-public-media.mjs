#!/usr/bin/env node
/**
 * One-time: delete unused files from public/ (run with --yes).
 * Shrinks repo and dev server; build already strips them from dist via strip-dist-unused-media.mjs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UNUSED_PUBLIC_MEDIA } from './unused-public-media.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(__dirname, '..', 'public');

if (!process.argv.includes('--yes')) {
  console.log('Removes unused draft/duplicate videos from public/:');
  UNUSED_PUBLIC_MEDIA.forEach((n) => console.log('  -', n));
  console.log('\nRun: node scripts/delete-unused-public-media.mjs --yes');
  process.exit(0);
}

let n = 0;
for (const name of UNUSED_PUBLIC_MEDIA) {
  const p = path.join(pub, name);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('deleted', name);
      n++;
    }
  } catch (e) {
    console.warn('skip', name, e.message);
  }
}
console.log(`Done. Removed ${n} file(s) from public/.`);
