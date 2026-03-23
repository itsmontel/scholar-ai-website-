/**
 * Detects failed dynamic imports (stale cache after deploy, flaky network, sleeping tab).
 * Used to show targeted recovery UI and optional auto-retry.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (error == null) return false;
  const name = error instanceof Error ? error.name : '';
  if (name === 'ChunkLoadError') return true;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('loading chunk') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('failed to import module')
  );
}
