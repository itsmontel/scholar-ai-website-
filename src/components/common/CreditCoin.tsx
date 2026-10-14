import type { CSSProperties } from 'react';

/** The gold credit coin used anywhere credits are shown. Decorative. */
export default function CreditCoin({ size = 24, className = '', style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`} style={style}>
      <circle cx="12" cy="12" r="11" fill="#F5B70A" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#B7800A" strokeWidth="1.6" />
      <path d="M13 7.5l-3.2 5h2.6l-1.4 4 3.6-5.4h-2.7z" fill="#7A5A00" />
    </svg>
  );
}
