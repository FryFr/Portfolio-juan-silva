'use client';

import { motion, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';

export function CursorBlob() {
  const cursorRef = useCursor();
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });
  const blobRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const expandedRef = useRef(false);

  useEffect(() => {
    const onPointerEnter = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="link"]')) {
        expandedRef.current = true;
      }
    };
    const onPointerLeave = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="link"]')) {
        expandedRef.current = false;
      }
    };

    document.addEventListener('pointerover', onPointerEnter);
    document.addEventListener('pointerout', onPointerLeave);

    return () => {
      document.removeEventListener('pointerover', onPointerEnter);
      document.removeEventListener('pointerout', onPointerLeave);
    };
  }, []);

  useEffect(() => {
    function tick() {
      const state = cursorRef.current;
      x.set(state.x);
      y.set(state.y);

      const el = blobRef.current;
      if (el) {
        const speed = state.speed;
        const angle = Math.atan2(state.velocityY, state.velocityX);
        const stretch = Math.min(speed * 0.08, 2.5);
        const scaleX = 1 + stretch;
        const scaleY = 1 / (1 + stretch * 0.5);
        const rotation = angle * (180 / Math.PI);

        const size = expandedRef.current ? 65 : 40;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.mixBlendMode = expandedRef.current ? 'difference' : 'screen';
        el.style.setProperty('--blob-rotate', `${rotation}deg`);
        el.style.setProperty('--blob-scale-x', `${scaleX}`);
        el.style.setProperty('--blob-scale-y', `${scaleY}`);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cursorRef, x, y]);

  return (
    <motion.div
      ref={blobRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-10 w-10 rounded-full blur-[1px]"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        rotate: 'var(--blob-rotate, 0deg)',
        scaleX: 'var(--blob-scale-x, 1)',
        scaleY: 'var(--blob-scale-y, 1)',
        background:
          'radial-gradient(circle, rgba(212,181,132,0.9) 0%, rgba(212,181,132,0.3) 60%, transparent 100%)',
        mixBlendMode: 'screen',
        transition: 'width 0.15s, height 0.15s',
      }}
    />
  );
}
