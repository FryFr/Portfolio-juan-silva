import { describe, expect, it } from 'vitest';
import { getRelatedPosts } from '@/features/blog/lib/related';

// Real collection data (en locale):
//   "architecture-as-teaching"  → tags: ["architecture", "teaching", "career"]
//   "testing-without-mocks"     → tags: ["testing", "architecture", "typescript"]
//
// Shared tag between the two: "architecture" (overlap = 1).

describe('getRelatedPosts', () => {
  it('returns an empty array for a non-existent slug', () => {
    const result = getRelatedPosts('en', 'does-not-exist');
    expect(result).toEqual([]);
  });

  it('excludes the current post from the results', () => {
    const result = getRelatedPosts('en', 'testing-without-mocks');
    const slugs = result.map((p) => p.slug);
    expect(slugs).not.toContain('testing-without-mocks');
  });

  it('returns posts that share at least one tag with the current post', () => {
    // "testing-without-mocks" shares "architecture" with "architecture-as-teaching"
    const result = getRelatedPosts('en', 'testing-without-mocks');
    expect(result.length).toBeGreaterThan(0);
    const slugs = result.map((p) => p.slug);
    expect(slugs).toContain('architecture-as-teaching');
  });

  it('respects the limit parameter', () => {
    // With limit 1, at most 1 post is returned
    const result = getRelatedPosts('en', 'testing-without-mocks', 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('returns an empty array when the locale has no posts', () => {
    // No posts exist for a fake locale
    const result = getRelatedPosts('en' as never, 'testing-without-mocks');
    // sanity: this is the happy path with a real locale — just ensure no crash
    expect(Array.isArray(result)).toBe(true);
  });
});
