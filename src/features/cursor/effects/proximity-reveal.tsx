'use client';

import { useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

type Tag = 'p' | 'span' | 'div';

type TagRefMap = {
  p: HTMLParagraphElement;
  span: HTMLSpanElement;
  div: HTMLDivElement;
};

type Props = {
  children: ReactNode;
  className?: string;
  as?: Tag;
};

const PROXIMITY_RADIUS = 300;

export function ProximityReveal({ children, className, as: tag = 'p' }: Props) {
  const cursorRef = useCursor();
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const elRef = useRef<TagRefMap[typeof tag]>(null);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);

  const active = !isTouch && !prefersReducedMotion;

  useEffect(() => {
    if (!active || !elRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );

    observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function tick() {
      if (!visibleRef.current || !elRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const cursor = cursorRef.current;
      const el = elRef.current;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cursor.x - cx;
      const dy = cursor.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PROXIMITY_RADIUS) {
        const intensity = 1 - dist / PROXIMITY_RADIUS;
        const r = Math.round(154 + (245 - 154) * intensity);
        const g = Math.round(133 + (241 - 133) * intensity);
        const b = Math.round(103 + (234 - 103) * intensity);
        el.style.color = `rgb(${r}, ${g}, ${b})`;
        el.style.textShadow = `0 0 ${intensity * 8}px rgba(212,181,132,${intensity * 0.15})`;
      } else {
        el.style.color = '';
        el.style.textShadow = 'none';
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, cursorRef]);

  const Tag = tag;

  return (
    <Tag ref={elRef as React.RefObject<HTMLParagraphElement>} className={className}>
      {children}
    </Tag>
  );
}
