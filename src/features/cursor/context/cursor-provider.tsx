'use client';

import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';
import { type CursorState, CursorContext } from '@/features/cursor/context/use-cursor';

type Props = {
  children: ReactNode;
};

export function CursorProvider({ children }: Props) {
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const active = !isTouch && !prefersReducedMotion;

  const stateRef = useRef<CursorState>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0,
  });

  const prevRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const prev = prevRef.current;
    const vx = e.clientX - prev.x;
    const vy = e.clientY - prev.y;

    stateRef.current = {
      x: e.clientX,
      y: e.clientY,
      velocityX: vx,
      velocityY: vy,
      speed: Math.sqrt(vx * vx + vy * vy),
    };

    prev.x = e.clientX;
    prev.y = e.clientY;
  }, []);

  useEffect(() => {
    if (!active) return;

    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [active, handleMouseMove]);

  return (
    <CursorContext.Provider value={stateRef}>
      {children}
      {active && (
        <>
          {/* CursorBlob and CursorSpotlight will be added in Task 3 */}
        </>
      )}
    </CursorContext.Provider>
  );
}
