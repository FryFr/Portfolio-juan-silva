import { describe, expect, it, vi } from 'vitest';
import ProjectDetailPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/[locale]/projects/[slug]/page';
import sitemap from '@/app/sitemap';
import { allProjects } from '@/content-collections';
import {
  getAdjacentProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjects,
} from '@/shared/content';
import { isProjectVisible, projectVisibilitySchema } from '@/shared/content/project-visibility';

vi.mock('@/content-collections', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content-collections')>();
  const base = actual.allProjects[0];
  if (!base) throw new Error('Expected existing MDX projects');
  const fixtures = ['public', 'private-teaser', 'manual-only', 'hidden'].flatMap(
    (visibility, order) =>
      ['es', 'en'].map((locale) => ({
        ...base,
        visibility,
        slug: `contract-${visibility}`,
        locale,
        url: `/${locale}/projects/contract-${visibility}`,
        featured: true,
        order: -10 + order,
      })),
  );
  // One locale hidden, the other visible: sitemap alternates must respect this.
  const visible = fixtures[0];
  const hidden = fixtures[7];
  if (!visible || !hidden) throw new Error('Expected visibility fixtures');
  fixtures.push({ ...visible, slug: 'mixed', url: '/es/projects/mixed' });
  fixtures.push({
    ...hidden,
    slug: 'mixed',
    url: '/en/projects/mixed',
  });
  return { ...actual, allProjects: [...actual.allProjects, ...fixtures] };
});

vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn(), getTranslations: vi.fn() }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/shared/mdx/mdx-body', () => ({ MdxBody: () => null }));

describe('project visibility contract', () => {
  it('defaults legacy MDX to public and rejects unknown visibility', () => {
    expect(projectVisibilitySchema.parse(undefined)).toBe('public');
    expect(isProjectVisible({})).toBe(true);
    for (const value of ['private', '', null, false]) {
      expect(projectVisibilitySchema.safeParse(value).success).toBe(false);
    }
  });

  it('preserves all 26 existing projects as public', () => {
    const original = allProjects.filter(
      (p) => !p.slug.startsWith('contract-') && p.slug !== 'mixed',
    );
    expect(original).toHaveLength(26);
    for (const project of original) {
      expect(project.visibility).toBe('public');
      expect(getProjectBySlug(project.locale, project.slug)).toEqual(project);
    }
  });

  it.each([
    'public',
    'private-teaser',
    'manual-only',
  ] as const)('publishes curated %s entries', (visibility) => {
    expect(projectVisibilitySchema.parse(visibility)).toBe(visibility);
    for (const locale of ['es', 'en'] as const) {
      const slug = `contract-${visibility}`;
      expect(getProjects(locale).some((p) => p.slug === slug)).toBe(true);
      expect(getFeaturedProjects(locale).some((p) => p.slug === slug)).toBe(true);
      expect(getProjectBySlug(locale, slug)).toBeDefined();
      expect(generateStaticParams()).toContainEqual({ locale, slug });
    }
  });

  it.each([
    'es',
    'en',
  ] as const)('excludes hidden entries from every public surface in %s', async (locale) => {
    const slug = 'contract-hidden';
    expect(getProjects(locale).some((p) => p.slug === slug)).toBe(false);
    expect(getFeaturedProjects(locale).some((p) => p.slug === slug)).toBe(false);
    expect(getProjectBySlug(locale, slug)).toBeUndefined();
    expect(generateStaticParams()).not.toContainEqual({ locale, slug });
    expect(getAdjacentProjects(locale, slug)).toEqual({ prev: undefined, next: undefined });
    for (const project of getProjects(locale)) {
      const { prev, next } = getAdjacentProjects(locale, project.slug);
      expect(prev?.visibility).not.toBe('hidden');
      expect(next?.visibility).not.toBe('hidden');
    }
    const props = { params: Promise.resolve({ locale, slug }) };
    expect(await generateMetadata(props)).toEqual({});
    await expect(ProjectDetailPage(props)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('keeps visible project metadata tied to curated titles and summaries in both locales', async () => {
    for (const locale of ['es', 'en'] as const) {
      for (const project of getProjects(locale)) {
        const metadata = await generateMetadata({
          params: Promise.resolve({ locale, slug: project.slug }),
        });
        expect(metadata).toEqual({ title: project.title, description: project.summary });
      }
    }
  });

  it('excludes hidden URLs from sitemap entries and language alternates', () => {
    const entries = sitemap();
    expect(JSON.stringify(entries)).not.toContain('contract-hidden');
    expect(JSON.stringify(entries)).not.toContain('/en/projects/mixed');
    expect(entries.some((entry) => entry.url.endsWith('/es/projects/mixed'))).toBe(true);
    for (const locale of ['es', 'en']) {
      for (const visibility of ['public', 'private-teaser', 'manual-only']) {
        expect(
          entries.some((entry) => entry.url.endsWith(`/${locale}/projects/contract-${visibility}`)),
        ).toBe(true);
      }
    }
  });
});
