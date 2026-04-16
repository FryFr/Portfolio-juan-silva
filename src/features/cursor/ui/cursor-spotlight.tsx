'use client';

import { motion, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';

export function CursorSpotlight() {
  const cursorRef = useCursor();
  const x = useSpring(0, { stiffness: 50, damping: 20 });
  const y = useSpring(0, { stiffness: 50, damping: 20 });
  const spotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const state = cursorRef.current;
      x.set(state.x);
      y.set(state.y);

      const el = spotRef.current;
      if (el) {
        const opacity = 0.08 + Math.min(state.speed * 0.004, 0.12);
        el.style.background = `radial-gradient(circle, rgba(212,181,132,${opacity}) 0%, rgba(212,181,132,${opacity * 0.25}) 40%, transparent 70%)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cursorRef, x, y]);

  return (
    <motion.div
      ref={spotRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-0 h-[400px] w-[400px] rounded-full"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        background: 'radial-gradient(circle, rgba(212,181,132,0.08) 0%, transparent 70%)',
      }}
    />
  );
}
