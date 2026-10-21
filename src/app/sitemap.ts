import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config/site';
import { getPosts, getTalks, getVisibleProjects } from '@/shared/content';
import { type Locale, routing } from '@/shared/i18n/routing';

type Entry = MetadataRoute.Sitemap[number];

/** Static pages, posts and talks have paired locales; projects are filtered separately. */
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

  // Visibility can differ by locale: never invent a route or a hidden alternate.
  const visibleProjects = getVisibleProjects();
  const projects: Entry[] = visibleProjects.map((project) => ({
    url: `${siteConfig.url}${project.url}`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: project.locale === defaultLocale ? 0.7 : 0.6,
    alternates: {
      languages: Object.fromEntries(
        visibleProjects
          .filter((translation) => translation.slug === project.slug)
          .map((translation) => [translation.locale, `${siteConfig.url}${translation.url}`]),
      ),
    },
  }));

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
