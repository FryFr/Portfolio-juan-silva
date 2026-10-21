import { defineCollection, defineConfig } from '@content-collections/core';
import type { Options as MDXOptions } from '@content-collections/mdx';
import { compileMDX } from '@content-collections/mdx';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';
import { z } from 'zod';
import { projectSchema } from './src/shared/content/project-schema';
import { projectVisibilitySchema } from './src/shared/content/project-visibility';
import { validatePublicationAssets } from './src/shared/content/publication-assets';

const SUPPORTED_LOCALES = ['es', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function parseFilename(filePath: string): { slug: string; locale: SupportedLocale } {
  const base = filePath.split('/').pop() ?? filePath;
  const withoutExt = base.replace(/\.mdx$/, '');
  const match = withoutExt.match(/^(.+)\.(es|en)$/);
  if (!match) {
    throw new Error(`Invalid content filename: "${filePath}". Expected "<slug>.{es,en}.mdx".`);
  }
  const [, slug, locale] = match as [string, string, SupportedLocale];
  return { slug, locale };
}

const mdxOptions: MDXOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    [
      rehypePrettyCode,
      {
        theme: { light: 'github-light', dark: 'github-dark' },
        keepBackground: false,
      },
    ],
  ],
};

const projects = defineCollection({
  name: 'projects',
  directory: 'content/projects',
  include: '**/*.mdx',
  schema: projectSchema.extend({ visibility: projectVisibilitySchema }),
  transform: async (document, context) => {
    const { slug, locale } = parseFilename(document._meta.filePath);
    await validatePublicationAssets(document.publication);
    const body = await compileMDX(context, document, mdxOptions);
    return {
      ...document,
      slug,
      locale,
      visibility: document.visibility ?? 'public',
      url: `/${locale}/projects/${slug}`,
      body,
    };
  },
});

const posts = defineCollection({
  name: 'posts',
  directory: 'content/posts',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1).max(240),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    tags: z.array(z.string().min(1)).min(1),
    draft: z.boolean().default(false),
    readingTimeMinutes: z.number().int().positive().optional(),
  }),
  transform: async (document, context) => {
    const { slug, locale } = parseFilename(document._meta.filePath);
    const body = await compileMDX(context, document, mdxOptions);
    return {
      ...document,
      slug,
      locale,
      url: `/${locale}/blog/${slug}`,
      body,
    };
  },
});

const talks = defineCollection({
  name: 'talks',
  directory: 'content/talks',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1).max(240),
    event: z.string().min(1),
    city: z.string().optional(),
    year: z.number().int().min(2000).max(2100),
    slides: z.string().url().optional(),
    video: z.string().url().optional(),
    language: z.enum(['es', 'en']),
  }),
  transform: async (document, context) => {
    const { slug, locale } = parseFilename(document._meta.filePath);
    const body = await compileMDX(context, document, mdxOptions);
    return {
      ...document,
      slug,
      locale,
      url: `/${locale}/talks/${slug}`,
      body,
    };
  },
});

export default defineConfig({
  collections: [projects, posts, talks],
});
