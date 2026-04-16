import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

describe('useIsTouch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when pointer is fine (desktop)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const { result } = renderHook(() => useIsTouch());
    expect(result.current).toBe(false);
  });

  it('returns true when pointer is coarse (touch)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const { result } = renderHook(() => useIsTouch());
    expect(result.current).toBe(true);
  });
});
