/**
 * Layered stone + violet editorial background matching the landing hero.
 * Use position="fixed" for full-viewport app pages; "absolute" inside a relative min-h-screen wrapper.
 */
export function WriteScholarEditorialBackgroundLayers({
  position = 'fixed',
  className = '',
}: {
  position?: 'fixed' | 'absolute';
  /** Extra classes on the base layer */
  className?: string;
}) {
  const pos = position === 'fixed' ? 'fixed' : 'absolute';
  return (
    <>
      <div className={`${pos} inset-0 -z-10 bg-[#f8fafc] dark:bg-[#0c0a09] pointer-events-none ${className}`} aria-hidden />
      <div
        className={`${pos} inset-0 -z-10 bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 pointer-events-none`}
        aria-hidden
      />
      <div
        className={`${pos} inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(91,33,182,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none`}
        aria-hidden
      />
      <div
        className={`${pos} inset-0 -z-10 opacity-[0.4] dark:opacity-[0.15] pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]`}
        aria-hidden
      />
    </>
  );
}
