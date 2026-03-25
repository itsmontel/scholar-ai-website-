/**
 * Dev: do not serve known-unused public files (same list as strip-dist).
 */
import path from 'path';
import { UNUSED_PUBLIC_MEDIA } from './unused-public-media.mjs';

const set = new Set(UNUSED_PUBLIC_MEDIA);

export function vitePluginBlockUnusedPublicMedia() {
  return {
    name: 'block-unused-public-media',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url?.split('?')[0] || '';
        let base;
        try {
          base = decodeURIComponent(path.basename(raw));
        } catch {
          base = path.basename(raw);
        }
        if (set.has(base)) {
          res.statusCode = 404;
          res.end('');
          return;
        }
        next();
      });
    },
  };
}
