interface LandingSectionBackdropProps {
  /** Base fill, e.g. `bg-[#FCFBF7]` */
  base: string;
  /** Gradient stop at the top edge — previous section's colour */
  topFrom?: string;
  /** Gradient stop at the bottom edge — next section's colour */
  bottomTo?: string;
  /** Optional radial / ambient overlay */
  radial?: string;
}

/**
 * Shared landing-section background with tall, buttery smooth top/bottom
 * colour blends. Each fade band spans nearly half the section height so
 * adjacent sections melt into each other with zero visible seam.
 */
export default function LandingSectionBackdrop({ base, topFrom, bottomTo, radial }: LandingSectionBackdropProps) {
  return (
    <>
      <div className={`absolute inset-0 ${base}`} aria-hidden />
      {topFrom && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-[45%] min-h-[160px] bg-gradient-to-b ${topFrom} via-transparent to-transparent`}
          style={{ maxHeight: '420px' }}
          aria-hidden
        />
      )}
      {bottomTo && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-[45%] min-h-[160px] bg-gradient-to-t ${bottomTo} via-transparent to-transparent`}
          style={{ maxHeight: '420px' }}
          aria-hidden
        />
      )}
      {radial && (
        <div className={`pointer-events-none absolute inset-0 ${radial}`} aria-hidden />
      )}
    </>
  );
}
