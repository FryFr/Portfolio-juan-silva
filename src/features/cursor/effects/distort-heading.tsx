'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

type Props = {
  as: 'h1' | 'h2' | 'h3';
  children: string;
  className?: string;
};

const GRAVITY_RADIUS = 250;
const GRAVITY_STRENGTH = 35;
const SCALE_BOOST = 0.25;

export function DistortHeading({ as: Tag, children, className }: Props) {
  const cursorRef = useCursor();
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLHeadingElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);

  const active = !isTouch && !prefersReducedMotion;

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function tick() {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const cursor = cursorRef.current;
      const chars = charsRef.current;

      for (let i = 0; i < chars.length; i++) {
        const el = chars[i];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cursor.x - cx;
        const dy = cursor.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < GRAVITY_RADIUS) {
          const intensity = (1 - dist / GRAVITY_RADIUS) ** 2;
          const pullX = (dx / dist) * GRAVITY_STRENGTH * intensity;
          const pullY = (dy / dist) * GRAVITY_STRENGTH * intensity;
          const scale = 1 + SCALE_BOOST * intensity;
          el.style.transform = `translate(${pullX}px, ${pullY}px) scale(${scale})`;
          el.style.transition = 'transform 0.08s ease-out';
        } else {
          el.style.transform = 'translate(0, 0) scale(1)';
          el.style.transition = 'transform 0.35s ease-out';
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, cursorRef]);

  if (!active) {
    return <Tag className={className}>{children}</Tag>;
  }

  const chars = children.split('').map((char, i) => {
    if (char === ' ') {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: chars are static, derived from immutable children string
        <span key={`${i}-space`} className="inline-block w-[0.3em]">
          &nbsp;
        </span>
      );
    }
    return (
      <span
        // biome-ignore lint/suspicious/noArrayIndexKey: chars are static, derived from immutable children string
        key={`${i}-${char}`}
        ref={(el) => {
          if (el) charsRef.current[i] = el;
        }}
        aria-hidden="true"
        className="inline-block will-change-auto"
      >
        {char}
      </span>
    );
  });

  return (
    <Tag ref={containerRef} className={className} aria-label={children}>
      {chars}
    </Tag>
  );
}
