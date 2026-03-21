import { useRef, useEffect, type VideoHTMLAttributes } from 'react';

export interface ViewportAutoplayVideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'autoPlay' | 'preload'> {
  src: string;
  /** IntersectionObserver rootMargin — load/play shortly before the clip enters view */
  rootMargin?: string;
}

/**
 * Plays a looping muted demo only while near/on screen. Avoids stacking many simultaneous
 * MP4 decodes on long landing pages (major source of scroll jank).
 */
export default function ViewportAutoplayVideo({
  src,
  className,
  muted = true,
  playsInline = true,
  loop = true,
  rootMargin = '180px',
  ...rest
}: ViewportAutoplayVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let reduceMotion = false;
    try {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      /* ignore */
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduceMotion) {
          video.pause();
          return;
        }
        if (entry.isIntersecting) {
          video.preload = 'auto';
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted={muted}
      playsInline={playsInline}
      loop={loop}
      preload="none"
      {...rest}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
