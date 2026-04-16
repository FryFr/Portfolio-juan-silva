import type { Post, Project, Talk } from '@/content-collections';
import { allPosts, allProjects, allTalks } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function getProjects(locale: Locale): Project[] {
  return allProjects
    .filter((p) => p.locale === locale)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return b.year - a.year;
    });
}

export function getFeaturedProjects(locale: Locale): Project[] {
  return getProjects(locale).filter((p) => p.featured);
}

export function getProjectBySlug(locale: Locale, slug: string): Project | undefined {
  return allProjects.find((p) => p.locale === locale && p.slug === slug);
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export function getPosts(locale: Locale): Post[] {
  return allPosts
    .filter((p) => p.locale === locale && !p.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(locale: Locale, slug: string): Post | undefined {
  return allPosts.find((p) => p.locale === locale && p.slug === slug);
}

// ---------------------------------------------------------------------------
// Talks
// ---------------------------------------------------------------------------

export function getTalks(locale: Locale): Talk[] {
  return allTalks.filter((t) => t.locale === locale).sort((a, b) => b.year - a.year);
}

export function getTalkBySlug(locale: Locale, slug: string): Talk | undefined {
  return allTalks.find((t) => t.locale === locale && t.slug === slug);
}

// ---------------------------------------------------------------------------
// Adjacent projects + related posts
// ---------------------------------------------------------------------------

export function getAdjacentProjects(
  locale: Locale,
  slug: string,
): { prev: Project | undefined; next: Project | undefined } {
  const list = getProjects(locale);
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? list[index - 1] : undefined,
    next: index < list.length - 1 ? list[index + 1] : undefined,
  };
}

export function getRelatedPosts(locale: Locale, slug: string, limit = 3): Post[] {
  const all = getPosts(locale);
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const currentTags = new Set(current.tags);
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      overlap: p.tags.filter((t) => currentTags.has(t)).length,
    }))
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.post);
}
