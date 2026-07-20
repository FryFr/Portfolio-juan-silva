'use client';

import { type ReactNode, useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useCursorActive } from '@/features/cursor/lib/use-cursor-active';

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
  const active = useCursorActive();
  const elRef = useRef<TagRefMap[typeof tag]>(null);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);

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

      // Distance to closest edge of the element, not center
      const closestX = Math.max(rect.left, Math.min(cursor.x, rect.right));
      const closestY = Math.max(rect.top, Math.min(cursor.y, rect.bottom));
      const dx = cursor.x - closestX;
      const dy = cursor.y - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Write progress only. Colour is resolved from tokens by `.reveal-text` in
      // globals.css, so this loop can never produce an out-of-gamut or
      // theme-inverted value the way a hardcoded rgb() lerp could.
      const intensity = dist < PROXIMITY_RADIUS ? 1 - dist / PROXIMITY_RADIUS : 0;
      el.style.setProperty('--reveal', intensity.toFixed(3));

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, cursorRef]);

  const Tag = tag;

  return (
    <Tag
      ref={elRef as React.RefObject<HTMLParagraphElement>}
      className={active ? `${className ?? ''} reveal-text`.trim() : className}
    >
      {children}
    </Tag>
  );
}
