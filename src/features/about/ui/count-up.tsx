'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  /** Raw display value, e.g. "5+", "1200", "+30%". */
  value: string;
};

/**
 * Counts a stat up from zero the first time it scrolls into view.
 *
 * One of the few places JS is genuinely required: CSS scroll-driven animation can
 * drive styles, but it cannot interpolate an element's text content. Everything
 * else in the motion system is CSS.
 *
 * Parses whatever prefix/suffix surrounds the number ("+30%" -> "+" 30 "%") so the
 * message files stay human-readable and locale-editable rather than being split
 * into value/prefix/suffix keys.
 */
export function CountUp({ value }: Props) {
  const match = value.match(/^(\D*)(\d+)(.*)$/);
  const target = match ? Number(match[2]) : 0;
  const prefix = match?.[1] ?? '';
  const suffix = match?.[3] ?? '';

  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(target);
  const [ready, setReady] = useState(false);

  // Server and first client render show the final value, so the number is correct
  // with JS disabled and never renders as a flash of zero.
  useEffect(() => {
    if (!match) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setReady(true);
    setDisplay(0);
  }, [match]);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const el = ref.current;
    let raf = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries[0]?.isIntersecting) return;
        started = true;

        const duration = 1100;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          // easeOutExpo, matching --ease-out-expo so JS motion and CSS motion
          // share one feel rather than drifting apart.
          const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t);
          setDisplay(Math.round(target * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ready, target]);

  if (!match) return <span>{value}</span>;

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
