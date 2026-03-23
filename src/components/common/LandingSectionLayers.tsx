/**
 * Decorative backgrounds aligned with the landing page / pricing editorial theme.
 */
export type LandingSectionVariant = 'default' | 'faq' | 'cta';

const GRID =
  'absolute inset-0 pointer-events-none bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)]';

export default function LandingSectionLayers({ variant = 'default' }: { variant?: LandingSectionVariant }) {
  const gridClass =
    variant === 'cta' ? `${GRID} opacity-[0.35] dark:opacity-[0.12]` : `${GRID} opacity-[0.4] dark:opacity-[0.15]`;

  const gradientClass =
    variant === 'faq'
      ? 'absolute inset-0 bg-gradient-to-b from-white via-[#f8fafc] to-[#f1f5f9] dark:from-stone-950 dark:via-stone-950 dark:to-stone-950 pointer-events-none'
      : 'absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-white to-[#f8fafc] dark:from-stone-950 dark:via-stone-950 dark:to-stone-900 pointer-events-none';

  const radialClass =
    variant === 'faq'
      ? 'absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(91,33,182,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none'
      : variant === 'cta'
        ? 'absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(91,33,182,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_15%,rgba(109,40,217,0.1),transparent_55%)] pointer-events-none'
        : 'absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,rgba(91,33,182,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_50%_at_50%_-8%,rgba(109,40,217,0.12),transparent_58%)] pointer-events-none';

  return (
    <>
      <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#0c0a09]" aria-hidden />
      <div className={gradientClass} aria-hidden />
      <div className={radialClass} aria-hidden />
      <div className={gridClass} aria-hidden />
    </>
  );
}
