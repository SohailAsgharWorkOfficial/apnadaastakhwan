import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fades + lifts its children into view the first time they scroll into view.
 *
 * Safety nets, because hidden content is worse than no animation:
 *   • reduced motion  -> render visible immediately
 *   • already in view -> reveal on mount, no waiting for the observer
 *   • observer never fires -> a failsafe timer reveals it anyway
 */
export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(
    () => typeof window === 'undefined' || prefersReducedMotion()
  );

  useEffect(() => {
    if (shown) return undefined;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }

    // Already on screen? No point waiting for a scroll.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);

    // Failsafe: content must never stay invisible.
    const failsafe = setTimeout(() => setShown(true), 3000);

    return () => {
      observer.disconnect();
      clearTimeout(failsafe);
    };
  }, [shown]);

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out will-change-[opacity,transform] ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={shown && delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
