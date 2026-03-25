/**
 * Filenames under public/ that are not referenced in src/ — draft / legacy / duplicate sources.
 *
 * - **Dev:** `vite-plugin-block-unused-public-media.mjs` returns 404 for these paths (no download).
 * - **Production:** `strip-dist-unused-media.mjs` deletes them from `dist/` after `vite build` (Netlify publishes `dist/` only).
 * - **Repo size:** run `node scripts/delete-unused-public-media.mjs --yes` to remove them from `public/` so they are not copied at build time.
 *
 * When adding new draft videos to public/, add the basename here until a page references them.
 */
export const UNUSED_PUBLIC_MEDIA = [
  'crosswordvid.mov',
  'analysevid.mov',
  'step 2.mov',
  'flashcardsvid.mov',
  'writescholar-essay-rubric-demo.mp4',
  'focusmode_original.mp4',
  'summarisevid.mov',
  'humanisevid.mov',
  'writescholar-humanizer-demo.mp4',
  'quizvid.mov',
];
