import { describe, expect, it } from 'vitest';
import { getAdjacentProjects } from '@/shared/content';

// Real collection projects (en locale, sorted by order ascending):
//   index 0 — "acme-platform"  (order: 1, year: 2025)
//   index 1 — "devtool-x"      (order: 2, year: 2024)

describe('getAdjacentProjects', () => {
  it('returns { prev: undefined, next: undefined } for a non-existent slug', () => {
    const result = getAdjacentProjects('en', 'no-such-project');
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeUndefined();
  });

  it('returns undefined prev and a valid next for the first project in order', () => {
    // "acme-platform" is at index 0 → no predecessor
    const result = getAdjacentProjects('en', 'acme-platform');
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeDefined();
    expect(result.next?.slug).toBe('devtool-x');
  });

  it('returns a valid prev and undefined next for the last project in order', () => {
    // "devtool-x" is at the end → no successor
    const result = getAdjacentProjects('en', 'devtool-x');
    expect(result.prev).toBeDefined();
    expect(result.prev?.slug).toBe('acme-platform');
    expect(result.next).toBeUndefined();
  });

  it('returns undefined prev and next for a non-existent slug in es locale', () => {
    const result = getAdjacentProjects('es', 'nonexistent');
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeUndefined();
  });
});
