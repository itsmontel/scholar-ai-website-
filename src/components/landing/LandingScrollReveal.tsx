import type { ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

type LandingScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay after the section becomes visible (staggered children). */
  delayMs?: number;
};

/**
 * Fade + slide-up when the block enters the viewport (hero-style polish for below-fold sections).
 * Respects prefers-reduced-motion via useScrollReveal.
 */
export default function LandingScrollReveal({ children, className = '', delayMs = 0 }: LandingScrollRevealProps) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`.trim()}
      style={visible && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
