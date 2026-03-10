#!/usr/bin/env node
/**
 * Generates public/api-config.json with the API URL for the Chrome extension.
 * Run during build so the extension can discover the correct API endpoint.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001/api';
const outPath = join(__dirname, '..', 'public', 'api-config.json');

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify({ apiUrl }, null, 2));
console.log('Generated api-config.json with apiUrl:', apiUrl);
