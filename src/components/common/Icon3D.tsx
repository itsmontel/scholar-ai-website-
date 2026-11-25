/**
 * One of the site's own 3D icons (public/icons/<name>.webp).
 * Decorative by default: the label beside it carries the meaning.
 */
export default function Icon3D({ name, size = 28, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <img
      src={`/icons/${name}.webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** True for an icon name ("study-pack"), false for an emoji or other text. */
export const isIconName = (value: string | undefined | null): value is string => !!value && /^[a-z][a-z-]*$/.test(value);
