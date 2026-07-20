'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

/**
 * Single source of truth for "should cursor-driven effects run?".
 *
 * Returns false on the server and on the first client render. Pointer type and
 * motion preference are undetectable during SSR, so anything that asks the DOM
 * would have to guess — and the previous guess was "desktop, motion on", which
 * meant touch devices received the enhanced markup and then tore it down after
 * hydration.
 *
 * Baseline markup is the plain, accessible one. The effect is the enhancement.
 */
export function useCursorActive(): boolean {
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && !isTouch && !prefersReducedMotion;
}
