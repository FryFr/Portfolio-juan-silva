import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';

vi.mock('@/features/cursor/context/use-cursor', () => ({
  useCursor: () => ({ current: { x: 0, y: 0, velocityX: 0, velocityY: 0, speed: 0 } }),
}));

vi.mock('@/features/cursor/lib/use-is-touch', () => ({
  useIsTouch: () => false,
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

describe('DistortHeading', () => {
  it('renders as the specified heading element', () => {
    render(<DistortHeading as="h1">Hello World</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('has aria-label with full text', () => {
    render(<DistortHeading as="h2">Test Title</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('aria-label', 'Test Title');
  });

  it('splits text into individual char spans', () => {
    const { container } = render(<DistortHeading as="h3">AB</DistortHeading>);
    const chars = container.querySelectorAll('[aria-hidden="true"]');
    expect(chars.length).toBeGreaterThanOrEqual(2);
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
});
