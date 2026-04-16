import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';

vi.mock('@/features/cursor/context/use-cursor', () => ({
  useCursor: () => ({ current: { x: 0, y: 0, velocityX: 0, velocityY: 0, speed: 0 } }),
}));

vi.mock('@/features/cursor/lib/use-is-touch', () => ({
  useIsTouch: () => false,
}));

vi.mock('motion/react', () => ({
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
});
