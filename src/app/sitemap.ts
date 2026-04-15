import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config/site';
import { routing } from '@/shared/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routing.locales.map((locale) => ({
    url: `${siteConfig.url}/${locale}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}`])),
    },
  }));
}
