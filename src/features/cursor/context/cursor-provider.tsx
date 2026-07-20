'use client';

import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { CursorContext, type CursorState } from '@/features/cursor/context/use-cursor';
import { useCursorActive } from '@/features/cursor/lib/use-cursor-active';
import { CursorBlob } from '@/features/cursor/ui/cursor-blob';
import { CursorSpotlight } from '@/features/cursor/ui/cursor-spotlight';

type Props = {
  children: ReactNode;
};

export function CursorProvider({ children }: Props) {
  // False until mounted, so mobile no longer ships two fixed-position motion.div
  // elements in the SSR HTML only to tear them down on hydration.
  const active = useCursorActive();

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
          <CursorSpotlight />
          <CursorBlob />
        </>
      )}
    </CursorContext.Provider>
  );
}
