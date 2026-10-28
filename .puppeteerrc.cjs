const { join } = require('path');

/**
 * Keep puppeteer's browser download inside node_modules so Netlify's build
 * cache (which keeps node_modules but not ~/.cache) preserves it between
 * builds. Used by scripts/prerender.mjs.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
