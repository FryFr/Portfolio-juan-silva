'use client';

import { useEffect, useState } from 'react';

export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)');
    setIsTouch(mql.matches);

    const handler = () => setIsTouch(true);
    window.addEventListener('touchstart', handler, { once: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  return isTouch;
}
