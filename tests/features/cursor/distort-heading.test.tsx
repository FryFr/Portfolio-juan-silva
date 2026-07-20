import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';

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

describe('DistortHeading', () => {
  it('renders as the specified heading element', () => {
    render(<DistortHeading as="h1">Hello World</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('preserves className', () => {
    render(
      <DistortHeading as="h1" className="custom-class">
        Title
      </DistortHeading>,
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('custom-class');
  });

  // The effect is now gated behind mount, so the split markup appears after the
  // first render rather than during SSR. These wait for the enhancement instead
  // of asserting it is present immediately.
  it('has aria-label with full text once enhanced', async () => {
    render(<DistortHeading as="h2">Test Title</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 2 });
    await waitFor(() => {
      expect(heading).toHaveAttribute('aria-label', 'Test Title');
    });
  });

  it('splits text into individual char spans once enhanced', async () => {
    const { container } = render(<DistortHeading as="h3">AB</DistortHeading>);
    await waitFor(() => {
      // Characters live inside a per-word wrapper, so query one level down.
      const chars = container.querySelectorAll('[aria-hidden="true"] > span');
      expect(chars.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Regression guard for mid-word line breaks.
  //
  // A flat run of inline-block character spans lets the browser break a line
  // between ANY two characters, because each one is its own inline-level box. On
  // a heading long enough to wrap that produced "Proyectos que moldea / ron cómo
  // pienso" — only visible by looking at a rendered page, never from the code.
  it('groups characters into per-word wrappers so lines cannot break mid-word', async () => {
    const { container } = render(<DistortHeading as="h2">Hola mundo cruel</DistortHeading>);
    await waitFor(() => {
      const words = container.querySelectorAll('[aria-hidden="true"]');
      expect(words.length).toBe(3);
    });
    for (const word of container.querySelectorAll('[aria-hidden="true"]')) {
      expect(word).toHaveClass('whitespace-nowrap');
    }
  });

  // The accessible name must survive in BOTH branches. e2e/home.spec.ts asserts
  // getByRole('heading', { name: 'Juan Silva.' }) against the hero, and that
  // passes through the plain-text branch on the server and on mobile.
  it('exposes the full text as the accessible name before enhancement', () => {
    render(<DistortHeading as="h1">Juan Silva.</DistortHeading>);
    expect(screen.getByRole('heading', { name: 'Juan Silva.' })).toBeInTheDocument();
  });
});
