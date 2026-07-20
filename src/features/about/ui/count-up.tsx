'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  /** Raw display value, e.g. "5+", "1200", "+30%". */
  value: string;
};

const DURATION_MS = 900;

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
 *
 * Every dependency below is a primitive. An earlier version depended on the regex
 * match array, which React sees as a new object on every render — the effect
 * re-ran each render, reset the display to 0, and the counter was permanently
 * stuck at zero. Object identity in a dependency array is a silent reset loop.
 */
export function CountUp({ value }: Props) {
  const match = /^(\D*)(\d+)(.*)$/.exec(value);
  const target = match ? Number(match[2]) : 0;
  const prefix = match?.[1] ?? '';
  const suffix = match?.[3] ?? '';
  const numeric = match !== null;

  const ref = useRef<HTMLSpanElement>(null);
  // Server and first client render show the final value, so the number is right
  // with JS disabled and never paints as a stuck zero.
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el || !numeric) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setDisplay(0);

    let raf = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries[0]?.isIntersecting) return;
        started = true;

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1);
          // easeOutExpo, matching --ease-out-expo so JS motion and CSS motion
          // share one feel rather than drifting apart.
          const eased = t === 1 ? 1 : 1 - 2 ** (-10 * t);
          setDisplay(Math.round(target * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, numeric]);

  if (!numeric) return <span>{value}</span>;

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
