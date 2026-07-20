import { render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';

// happy-dom never fires IntersectionObserver, so the component's visibility guard
// would keep the rAF loop early-returning forever. Without this stub the
// "never writes an inline color" assertion below passes vacuously — because the
// loop that could write one never runs. Report intersecting immediately so the
// regression guard exercises the real code path.
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: number[] = [];
      constructor(private readonly cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    },
  );
});

vi.mock('@/features/cursor/context/use-cursor', () => ({
  useCursor: () => ({ current: { x: 0, y: 0, velocityX: 0, velocityY: 0, speed: 0 } }),
}));

vi.mock('@/features/cursor/lib/use-is-touch', () => ({
  useIsTouch: () => false,
}));

// Partial mock. Replacing the whole module would make any future import from
// motion/react in this tree throw on an undefined export.
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => false,
}));

describe('ProximityReveal', () => {
  it('renders children inside default p tag', () => {
    render(<ProximityReveal>Hello text</ProximityReveal>);
    const el = screen.getByText('Hello text');
    expect(el.tagName).toBe('P');
  });

  it('renders with custom tag', () => {
    render(<ProximityReveal as="span">Span text</ProximityReveal>);
    const el = screen.getByText('Span text');
    expect(el.tagName).toBe('SPAN');
  });

  it('preserves className', () => {
    render(<ProximityReveal className="test-class">Content</ProximityReveal>);
    const el = screen.getByText('Content');
    expect(el).toHaveClass('test-class');
  });

  // Regression guard for the invisible-text bug.
  //
  // The original implementation wrote el.style.color directly, interpolating
  // toward the hardcoded rgb(245,241,234) — which is the literal value of
  // --bg-primary in light mode. Body text faded to exactly the page background
  // (1:1 contrast) as the cursor approached.
  //
  // The fix is mechanical, not cosmetic: the rAF loop may only publish progress.
  // Colour must be resolved from tokens in CSS. These two assertions are what
  // keep that true.
  it('never writes an inline color, only the --reveal progress value', async () => {
    render(<ProximityReveal>Body copy</ProximityReveal>);
    const el = screen.getByText('Body copy');

    await waitFor(() => {
      expect(el.style.getPropertyValue('--reveal')).not.toBe('');
    });

    expect(el.style.color).toBe('');
    expect(el.style.textShadow).toBe('');
  });

  it('opts into the token-driven .reveal-text class when active', async () => {
    render(<ProximityReveal className="test-class">Content</ProximityReveal>);
    const el = screen.getByText('Content');

    await waitFor(() => {
      expect(el).toHaveClass('reveal-text');
    });
    expect(el).toHaveClass('test-class');
  });
});
