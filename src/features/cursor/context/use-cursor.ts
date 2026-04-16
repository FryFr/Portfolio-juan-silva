'use client';

import { createContext, type RefObject, useContext } from 'react';

export type CursorState = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
};

export const CursorContext = createContext<RefObject<CursorState> | null>(null);

export function useCursor(): RefObject<CursorState> {
  const ref = useContext(CursorContext);
  if (!ref) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return ref;
}
