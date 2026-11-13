import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to a number when it scrolls into view.
 * Respects prefers-reduced-motion (jumps straight to the final value) and
 * always exposes the real number to assistive tech via aria-label.
 */
export default function StatCounter({
  value = 0,
  suffix = '',
  label,
  sub,
  duration = 1400,
  className = '',
}) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started) return undefined;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      setStarted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [started, value]);

  useEffect(() => {
    if (!started) return undefined;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      return undefined;
    }

    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — fast at first, settles gently.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value, duration]);

  return (
    <div ref={ref} className={className}>
      <p
        className="font-display text-2xl md:text-3xl font-extrabold text-brand-red-ink leading-none"
        aria-label={`${value}${suffix} ${label}`}
      >
        <span aria-hidden="true">
          {display}
          {suffix}
        </span>
      </p>
      <p className="text-xs font-semibold text-gray-800 mt-1.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
