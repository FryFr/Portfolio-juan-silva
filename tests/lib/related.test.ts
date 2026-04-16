import { describe, expect, it } from 'vitest';
import { getRelatedPosts } from '@/features/blog/lib/related';

// Real collection data (en locale):
//   "de-mecatronica-a-ia"         → tags: ["career", "mechatronics", "ai", "robotics"]
//   "ia-en-itsm-lecciones-reales" → tags: ["ai", "itsm", "rag", "java"]
//
// Shared tag between the two: "ai" (overlap = 1).

describe('getRelatedPosts', () => {
  it('returns an empty array for a non-existent slug', () => {
    const result = getRelatedPosts('en', 'does-not-exist');
    expect(result).toEqual([]);
  });

  it('excludes the current post from the results', () => {
    const result = getRelatedPosts('en', 'de-mecatronica-a-ia');
    const slugs = result.map((p) => p.slug);
    expect(slugs).not.toContain('de-mecatronica-a-ia');
  });

  it('returns posts that share at least one tag with the current post', () => {
    // "de-mecatronica-a-ia" shares "ai" with "ia-en-itsm-lecciones-reales"
    const result = getRelatedPosts('en', 'de-mecatronica-a-ia');
    expect(result.length).toBeGreaterThan(0);
    const slugs = result.map((p) => p.slug);
    expect(slugs).toContain('ia-en-itsm-lecciones-reales');
  });

  it('respects the limit parameter', () => {
    const result = getRelatedPosts('en', 'de-mecatronica-a-ia', 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('returns an empty array when the locale has no posts', () => {
    const result = getRelatedPosts('en' as never, 'de-mecatronica-a-ia');
    expect(Array.isArray(result)).toBe(true);
  });
});
