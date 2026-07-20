import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config/site';
import { getPosts, getProjects, getTalks } from '@/shared/content';
import { type Locale, routing } from '@/shared/i18n/routing';

type Entry = MetadataRoute.Sitemap[number];

/**
 * Previously this emitted two URLs — the locale homepages — while the site had 34
 * documents across projects, posts and talks. Every case study and article was
 * invisible to crawlers unless they happened to follow an internal link.
 *
 * Each entry carries hreflang alternates for both locales, since every piece of
 * content exists as an .es/.en pair by the filename contract in
 * content-collections.ts.
 */
function localisedEntry(
  path: string,
  options: { lastModified?: Date; changeFrequency: Entry['changeFrequency']; priority: number },
): Entry[] {
  return routing.locales.map((locale) => ({
    url: `${siteConfig.url}/${locale}${path}`,
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency,
    priority: locale === routing.defaultLocale ? options.priority : options.priority - 0.1,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteConfig.url}/${l}${path}`]),
      ),
    },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const defaultLocale = routing.defaultLocale as Locale;

  const home = localisedEntry('', { changeFrequency: 'monthly', priority: 1 });

  const indexes = ['/projects', '/blog', '/talks'].flatMap((path) =>
    localisedEntry(path, { changeFrequency: 'weekly', priority: 0.8 }),
  );

  // Slugs are locale-invariant by the <slug>.{es,en}.mdx contract, so reading the
  // default locale enumerates every document exactly once.
  const projects = getProjects(defaultLocale).flatMap((project) =>
    localisedEntry(`/projects/${project.slug}`, { changeFrequency: 'yearly', priority: 0.7 }),
  );

  const posts = getPosts(defaultLocale).flatMap((post) =>
    localisedEntry(`/blog/${post.slug}`, {
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'yearly',
      priority: 0.7,
    }),
  );

  const talks = getTalks(defaultLocale).flatMap((talk) =>
    localisedEntry(`/talks/${talk.slug}`, { changeFrequency: 'yearly', priority: 0.6 }),
  );

  return [...home, ...indexes, ...projects, ...posts, ...talks];
}
