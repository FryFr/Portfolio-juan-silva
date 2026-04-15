# Portfolio v2 — Fase 4: Case Studies + Blog + Talks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship bilingual MDX-rendered routes for case studies (`/projects`, `/projects/[slug]`), blog (`/blog`, `/blog/[slug]`) and talks index (`/talks`), wired to the existing content-collections pipeline and navbar.

**Architecture:** Server Components consume typed helpers from `@/shared/content`. A new `MdxBody` client-island renders the compiled MDX body via `@content-collections/react`'s `useMDXComponent`, reusing the existing `mdxComponents` map. Each list/detail page exports `generateStaticParams` + `generateMetadata`. Next/prev navigation for case studies and tag-overlap related posts for blog are pure pre-computed arrays — no client state, no filters (YAGNI). Talks have no detail route; cards link out to slides/video.

**Tech Stack:** Next.js 16 App Router · React 19 · next-intl 4 · content-collections 0.14 + `@content-collections/react` · Tailwind 4 · Biome 2 · TypeScript strict.

---

## File Structure

**Create:**
- `src/shared/mdx/mdx-body.tsx` — client island: `useMDXComponent(code)` + `mdxComponents`
- `src/features/case-study/ui/case-study-header.tsx` — server, title/year/role/stack/links block
- `src/features/case-study/ui/case-study-nav.tsx` — server, prev/next links
- `src/features/blog/ui/post-card.tsx` — server, list card for posts
- `src/features/blog/ui/post-header.tsx` — server, title/date/reading time/tags
- `src/features/blog/ui/related-posts.tsx` — server, takes `Post[]`
- `src/features/blog/lib/reading-time.ts` — pure util: 220 wpm fallback when frontmatter missing
- `src/features/blog/lib/related.ts` — pure util: tag overlap ranking
- `src/features/talks/ui/talk-card.tsx` — server, card with event/year/city/slides/video
- `src/features/talks/ui/talks-grid.tsx` — server async, calls `getTalks(locale)`
- `src/app/[locale]/projects/page.tsx` — projects index (ALL, not just featured)
- `src/app/[locale]/projects/[slug]/page.tsx` — case study detail
- `src/app/[locale]/blog/page.tsx` — blog index
- `src/app/[locale]/blog/[slug]/page.tsx` — blog detail
- `src/app/[locale]/talks/page.tsx` — talks index

**Modify:**
- `src/shared/content/index.ts` — add `getAdjacentProjects(locale, slug)` and `getRelatedPosts(locale, slug, limit)`
- `src/messages/es.json`, `src/messages/en.json` — add `projects.index`, `blog`, `talks` namespaces
- `src/features/projects/ui/project-card.tsx` — fix link target to internal `/[locale]/projects/[slug]` (currently only external links)
- `src/shared/ui/navbar.tsx` (or wherever nav lives) — wire work→`/projects`, writing→`/blog`, talks→`/talks`
- `content/projects/*.mdx` — add a second featured project variant if missing so index has >1 item (verify only)
- `package.json` — add `@content-collections/react`

---

## Task Batches

### Batch A — MDX body runtime

**Files:**
- Create: `src/shared/mdx/mdx-body.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install runtime**

```bash
pnpm add @content-collections/react
```

- [ ] **Step 2: Create client island**

```tsx
'use client';

import { useMDXComponent } from '@content-collections/react';
import { mdxComponents } from './components';

type Props = { code: string };

export function MdxBody({ code }: Props) {
  const Component = useMDXComponent(code);
  return <Component components={mdxComponents} />;
}
```

- [ ] **Step 3: Typecheck + Biome**

```bash
pnpm typecheck && pnpm biome check src/shared/mdx/mdx-body.tsx
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/shared/mdx/mdx-body.tsx
git commit -m "feat(fase-4): mdx body client island"
```

---

### Batch B — Content helpers: adjacent + related

**Files:**
- Modify: `src/shared/content/index.ts`
- Create: `src/features/blog/lib/reading-time.ts`
- Create: `src/features/blog/lib/related.ts`

- [ ] **Step 1: Add adjacent + related helpers**

Append to `src/shared/content/index.ts`:

```ts
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
```

- [ ] **Step 2: Reading-time util**

Create `src/features/blog/lib/reading-time.ts`:

```ts
const WORDS_PER_MINUTE = 220;

export function estimateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 1;
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}
```

- [ ] **Step 3: Related util re-export (trivial passthrough for co-location)**

Create `src/features/blog/lib/related.ts`:

```ts
export { getRelatedPosts } from '@/shared/content';
```

- [ ] **Step 4: Typecheck + Biome**

```bash
pnpm typecheck && pnpm biome check src/shared/content src/features/blog/lib
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/content/index.ts src/features/blog/lib
git commit -m "feat(fase-4): content helpers for adjacent projects and related posts"
```

---

### Batch C — i18n messages

**Files:**
- Modify: `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Add `projects.index`, `blog`, `talks` to es.json**

Under the existing top-level object, add these keys (merge alongside existing `home`):

```json
"projects": {
  "index": {
    "title": "Proyectos",
    "subtitle": "Trabajos seleccionados y casos de estudio.",
    "empty": "Todavía no hay proyectos publicados."
  },
  "detail": {
    "backToList": "← Todos los proyectos",
    "prev": "Anterior",
    "next": "Siguiente",
    "role": "Rol",
    "year": "Año",
    "stack": "Stack",
    "client": "Cliente",
    "live": "Sitio live",
    "repo": "Código",
    "caseStudy": "Caso de estudio externo"
  }
},
"blog": {
  "index": {
    "title": "Escritos",
    "subtitle": "Notas sobre arquitectura, testing y enseñanza.",
    "empty": "Todavía no hay publicaciones.",
    "readingTime": "{minutes} min de lectura"
  },
  "detail": {
    "backToList": "← Todas las notas",
    "publishedOn": "Publicado el",
    "updatedOn": "Actualizado",
    "readingTime": "{minutes} min",
    "relatedTitle": "Seguí leyendo"
  }
},
"talks": {
  "index": {
    "title": "Charlas",
    "subtitle": "Conferencias y workshops recientes.",
    "empty": "Todavía no hay charlas cargadas.",
    "slides": "Slides",
    "video": "Video",
    "deliveredIn": "Idioma de la charla"
  }
}
```

- [ ] **Step 2: Mirror in en.json**

```json
"projects": {
  "index": {
    "title": "Projects",
    "subtitle": "Selected work and case studies.",
    "empty": "No projects published yet."
  },
  "detail": {
    "backToList": "← All projects",
    "prev": "Previous",
    "next": "Next",
    "role": "Role",
    "year": "Year",
    "stack": "Stack",
    "client": "Client",
    "live": "Live site",
    "repo": "Code",
    "caseStudy": "External case study"
  }
},
"blog": {
  "index": {
    "title": "Writing",
    "subtitle": "Notes on architecture, testing and teaching.",
    "empty": "No posts yet.",
    "readingTime": "{minutes} min read"
  },
  "detail": {
    "backToList": "← All posts",
    "publishedOn": "Published on",
    "updatedOn": "Updated",
    "readingTime": "{minutes} min",
    "relatedTitle": "Keep reading"
  }
},
"talks": {
  "index": {
    "title": "Talks",
    "subtitle": "Recent conference talks and workshops.",
    "empty": "No talks yet.",
    "slides": "Slides",
    "video": "Video",
    "deliveredIn": "Talk language"
  }
}
```

- [ ] **Step 3: Typecheck (next-intl will validate keys at runtime; tsc checks JSON imports if typed)**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/messages/es.json src/messages/en.json
git commit -m "feat(fase-4): i18n messages for projects, blog and talks pages"
```

---

### Batch D — Case studies: index + detail

**Files:**
- Create: `src/features/case-study/ui/case-study-header.tsx`
- Create: `src/features/case-study/ui/case-study-nav.tsx`
- Create: `src/app/[locale]/projects/page.tsx`
- Create: `src/app/[locale]/projects/[slug]/page.tsx`
- Modify: `src/features/projects/ui/project-card.tsx` (add internal link)

- [ ] **Step 1: Case study header**

```tsx
// src/features/case-study/ui/case-study-header.tsx
import { getTranslations } from 'next-intl/server';
import type { Project } from '@/content-collections';

type Props = { project: Project };

export async function CaseStudyHeader({ project }: Props) {
  const t = await getTranslations('projects.detail');
  return (
    <header className="mb-10 border-b border-[var(--border)] pb-8">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-[var(--fg-tertiary)]">
        {project.year} · {project.role}
      </p>
      <h1 className="mb-4 font-serif text-4xl text-[var(--fg-primary)] md:text-5xl">
        {project.title}
      </h1>
      <p className="mb-6 max-w-2xl text-lg text-[var(--fg-secondary)]">{project.summary}</p>
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {project.client ? (
          <div>
            <dt className="font-mono text-xs uppercase text-[var(--fg-tertiary)]">{t('client')}</dt>
            <dd className="text-[var(--fg-primary)]">{project.client}</dd>
          </div>
        ) : null}
        <div className="col-span-2 md:col-span-3">
          <dt className="font-mono text-xs uppercase text-[var(--fg-tertiary)]">{t('stack')}</dt>
          <dd className="flex flex-wrap gap-2 text-[var(--fg-primary)]">
            {project.stack.map((item) => (
              <span
                key={item}
                className="rounded border border-[var(--border)] px-2 py-0.5 text-xs"
              >
                {item}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      {project.links ? (
        <ul className="mt-6 flex flex-wrap gap-4 text-sm">
          {project.links.live ? (
            <li>
              <a
                href={project.links.live}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('live')} ↗
              </a>
            </li>
          ) : null}
          {project.links.repo ? (
            <li>
              <a
                href={project.links.repo}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('repo')} ↗
              </a>
            </li>
          ) : null}
          {project.links.caseStudy ? (
            <li>
              <a
                href={project.links.caseStudy}
                target="_blank"
                rel="noreferrer noopener"
                className="underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('caseStudy')} ↗
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </header>
  );
}
```

- [ ] **Step 2: Case study nav (prev/next)**

```tsx
// src/features/case-study/ui/case-study-nav.tsx
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import type { Project } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = {
  locale: Locale;
  prev: Project | undefined;
  next: Project | undefined;
};

export async function CaseStudyNav({ locale, prev, next }: Props) {
  const t = await getTranslations('projects.detail');
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="case study pagination"
      className="mt-16 grid gap-4 border-t border-[var(--border)] pt-8 md:grid-cols-2"
    >
      {prev ? (
        <Link
          href={`/${locale}/projects/${prev.slug}`}
          className="block rounded border border-[var(--border)] p-4 transition-colors hover:border-[var(--accent)]"
        >
          <span className="block font-mono text-xs uppercase text-[var(--fg-tertiary)]">
            {t('prev')}
          </span>
          <span className="block font-serif text-lg text-[var(--fg-primary)]">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/${locale}/projects/${next.slug}`}
          className="block rounded border border-[var(--border)] p-4 text-right transition-colors hover:border-[var(--accent)]"
        >
          <span className="block font-mono text-xs uppercase text-[var(--fg-tertiary)]">
            {t('next')}
          </span>
          <span className="block font-serif text-lg text-[var(--fg-primary)]">{next.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}
```

- [ ] **Step 3: Update `project-card.tsx` to link to internal detail**

Replace the existing title/container render so the card wraps its title in a `Link` to `/${locale}/projects/${project.slug}`. Keep the existing external link list (live/repo) — those stay as separate `<a target="_blank">` elements below. Import:

```tsx
import Link from 'next/link';
import type { Locale } from '@/shared/i18n/routing';
```

Add `locale: Locale` to the card props and pass it from `projects-grid.tsx`. Wrap the title:

```tsx
<Link
  href={`/${locale}/projects/${project.slug}`}
  className="underline-offset-4 hover:underline"
>
  {project.title}
</Link>
```

Update `src/features/projects/ui/projects-grid.tsx` to pass `locale={locale}` to each `<ProjectCard />`.

- [ ] **Step 4: Projects index page**

```tsx
// src/app/[locale]/projects/page.tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/shared/i18n/routing';
import { getProjects } from '@/shared/content';
import { ProjectCard } from '@/features/projects/ui/project-card';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects.index' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function ProjectsIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations('projects.index');
  const projects = getProjects(typedLocale);

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <header className="mb-12">
        <h1 className="mb-3 font-serif text-5xl text-[var(--fg-primary)]">{t('title')}</h1>
        <p className="text-lg text-[var(--fg-secondary)]">{t('subtitle')}</p>
      </header>
      {projects.length === 0 ? (
        <p className="text-[var(--fg-secondary)]">{t('empty')}</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.slug}>
              <ProjectCard project={project} locale={typedLocale} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Projects detail page**

```tsx
// src/app/[locale]/projects/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { allProjects } from '@/content-collections';
import { routing, type Locale } from '@/shared/i18n/routing';
import { getProjectBySlug, getAdjacentProjects } from '@/shared/content';
import { MdxBody } from '@/shared/mdx/mdx-body';
import { CaseStudyHeader } from '@/features/case-study/ui/case-study-header';
import { CaseStudyNav } from '@/features/case-study/ui/case-study-nav';
import Link from 'next/link';

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return allProjects.map((project) => ({ locale: project.locale, slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const project = getProjectBySlug(locale as Locale, slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const project = getProjectBySlug(typedLocale, slug);
  if (!project) notFound();
  const { prev, next } = getAdjacentProjects(typedLocale, slug);
  const t = await getTranslations('projects.detail');

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href={`/${locale}/projects`}
        className="mb-8 inline-block font-mono text-xs uppercase text-[var(--fg-tertiary)] hover:text-[var(--accent)]"
      >
        {t('backToList')}
      </Link>
      <CaseStudyHeader project={project} />
      <article className="prose-invert">
        <MdxBody code={project.body} />
      </article>
      <CaseStudyNav locale={typedLocale} prev={prev} next={next} />
    </main>
  );
}
```

- [ ] **Step 6: Typecheck + Biome + dev smoke**

```bash
pnpm typecheck && pnpm biome check src/features/case-study src/features/projects src/app/\[locale\]/projects
```

Start dev, verify `/es/projects` and `/es/projects/<slug>` (one of the seeded projects) render body + header + nav.

- [ ] **Step 7: Commit**

```bash
git add src/features/case-study src/features/projects src/app/\[locale\]/projects
git commit -m "feat(fase-4): case study index and detail routes"
```

---

### Batch E — Blog: index + detail

**Files:**
- Create: `src/features/blog/ui/post-card.tsx`
- Create: `src/features/blog/ui/post-header.tsx`
- Create: `src/features/blog/ui/related-posts.tsx`
- Create: `src/app/[locale]/blog/page.tsx`
- Create: `src/app/[locale]/blog/[slug]/page.tsx`

- [ ] **Step 1: Post card**

```tsx
// src/features/blog/ui/post-card.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Post } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = { post: Post; locale: Locale };

export async function PostCard({ post, locale }: Props) {
  const t = await getTranslations('blog.index');
  const reading = post.readingTimeMinutes ?? 5;
  return (
    <article className="border-b border-[var(--border)] pb-6">
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="group block"
      >
        <h2 className="mb-2 font-serif text-2xl text-[var(--fg-primary)] group-hover:text-[var(--accent)]">
          {post.title}
        </h2>
        <p className="mb-3 text-[var(--fg-secondary)]">{post.summary}</p>
        <p className="font-mono text-xs uppercase text-[var(--fg-tertiary)]">
          {post.publishedAt} · {t('readingTime', { minutes: reading })}
        </p>
      </Link>
    </article>
  );
}
```

- [ ] **Step 2: Post header**

```tsx
// src/features/blog/ui/post-header.tsx
import { getTranslations } from 'next-intl/server';
import type { Post } from '@/content-collections';

type Props = { post: Post };

export async function PostHeader({ post }: Props) {
  const t = await getTranslations('blog.detail');
  const reading = post.readingTimeMinutes ?? 5;
  return (
    <header className="mb-10 border-b border-[var(--border)] pb-8">
      <h1 className="mb-4 font-serif text-4xl text-[var(--fg-primary)] md:text-5xl">
        {post.title}
      </h1>
      <p className="mb-4 max-w-2xl text-lg text-[var(--fg-secondary)]">{post.summary}</p>
      <p className="font-mono text-xs uppercase text-[var(--fg-tertiary)]">
        {t('publishedOn')} {post.publishedAt} · {t('readingTime', { minutes: reading })}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <li
            key={tag}
            className="rounded border border-[var(--border)] px-2 py-0.5 font-mono text-xs text-[var(--fg-secondary)]"
          >
            {tag}
          </li>
        ))}
      </ul>
    </header>
  );
}
```

- [ ] **Step 3: Related posts**

```tsx
// src/features/blog/ui/related-posts.tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Post } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = { posts: Post[]; locale: Locale };

export async function RelatedPosts({ posts, locale }: Props) {
  if (posts.length === 0) return null;
  const t = await getTranslations('blog.detail');
  return (
    <section className="mt-16 border-t border-[var(--border)] pt-8">
      <h2 className="mb-6 font-serif text-2xl text-[var(--fg-primary)]">{t('relatedTitle')}</h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className="block rounded border border-[var(--border)] p-4 transition-colors hover:border-[var(--accent)]"
            >
              <p className="font-serif text-base text-[var(--fg-primary)]">{post.title}</p>
              <p className="mt-1 font-mono text-xs text-[var(--fg-tertiary)]">{post.publishedAt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Blog index page**

```tsx
// src/app/[locale]/blog/page.tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/shared/i18n/routing';
import { getPosts } from '@/shared/content';
import { PostCard } from '@/features/blog/ui/post-card';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.index' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations('blog.index');
  const posts = getPosts(typedLocale);

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <header className="mb-12">
        <h1 className="mb-3 font-serif text-5xl text-[var(--fg-primary)]">{t('title')}</h1>
        <p className="text-lg text-[var(--fg-secondary)]">{t('subtitle')}</p>
      </header>
      {posts.length === 0 ? (
        <p className="text-[var(--fg-secondary)]">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} locale={typedLocale} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Blog detail page**

```tsx
// src/app/[locale]/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { allPosts } from '@/content-collections';
import { type Locale } from '@/shared/i18n/routing';
import { getPostBySlug, getRelatedPosts } from '@/shared/content';
import { MdxBody } from '@/shared/mdx/mdx-body';
import { PostHeader } from '@/features/blog/ui/post-header';
import { RelatedPosts } from '@/features/blog/ui/related-posts';

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return allPosts
    .filter((post) => !post.draft)
    .map((post) => ({ locale: post.locale, slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale as Locale, slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const post = getPostBySlug(typedLocale, slug);
  if (!post || post.draft) notFound();
  const related = getRelatedPosts(typedLocale, slug, 3);
  const t = await getTranslations('blog.detail');

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href={`/${locale}/blog`}
        className="mb-8 inline-block font-mono text-xs uppercase text-[var(--fg-tertiary)] hover:text-[var(--accent)]"
      >
        {t('backToList')}
      </Link>
      <PostHeader post={post} />
      <article className="prose-invert">
        <MdxBody code={post.body} />
      </article>
      <RelatedPosts posts={related} locale={typedLocale} />
    </main>
  );
}
```

- [ ] **Step 6: Typecheck + Biome + dev smoke**

```bash
pnpm typecheck && pnpm biome check src/features/blog src/app/\[locale\]/blog
```

Verify in browser: `/es/blog`, `/es/blog/<slug>`, `/en/blog`, `/en/blog/<slug>`.

- [ ] **Step 7: Commit**

```bash
git add src/features/blog src/app/\[locale\]/blog
git commit -m "feat(fase-4): blog index and detail routes with related posts"
```

---

### Batch F — Talks index

**Files:**
- Create: `src/features/talks/ui/talk-card.tsx`
- Create: `src/features/talks/ui/talks-grid.tsx`
- Create: `src/app/[locale]/talks/page.tsx`

- [ ] **Step 1: Talk card**

```tsx
// src/features/talks/ui/talk-card.tsx
import { getTranslations } from 'next-intl/server';
import type { Talk } from '@/content-collections';

type Props = { talk: Talk };

export async function TalkCard({ talk }: Props) {
  const t = await getTranslations('talks.index');
  return (
    <article className="flex flex-col gap-3 border-b border-[var(--border)] pb-6">
      <header>
        <p className="font-mono text-xs uppercase text-[var(--fg-tertiary)]">
          {talk.year} · {talk.event}
          {talk.city ? ` · ${talk.city}` : ''}
        </p>
        <h2 className="mt-1 font-serif text-2xl text-[var(--fg-primary)]">{talk.title}</h2>
      </header>
      <p className="text-[var(--fg-secondary)]">{talk.summary}</p>
      <p className="font-mono text-xs text-[var(--fg-tertiary)]">
        {t('deliveredIn')}: {talk.language.toUpperCase()}
      </p>
      <ul className="flex flex-wrap gap-4 text-sm">
        {talk.slides ? (
          <li>
            <a
              href={talk.slides}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-4 hover:text-[var(--accent)]"
            >
              {t('slides')} ↗
            </a>
          </li>
        ) : null}
        {talk.video ? (
          <li>
            <a
              href={talk.video}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-4 hover:text-[var(--accent)]"
            >
              {t('video')} ↗
            </a>
          </li>
        ) : null}
      </ul>
    </article>
  );
}
```

- [ ] **Step 2: Talks grid**

```tsx
// src/features/talks/ui/talks-grid.tsx
import { getTranslations } from 'next-intl/server';
import { getTalks } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { TalkCard } from './talk-card';

type Props = { locale: Locale };

export async function TalksGrid({ locale }: Props) {
  const talks = getTalks(locale);
  const t = await getTranslations('talks.index');
  if (talks.length === 0) {
    return <p className="text-[var(--fg-secondary)]">{t('empty')}</p>;
  }
  return (
    <ul className="flex flex-col gap-8">
      {talks.map((talk) => (
        <li key={talk.slug}>
          <TalkCard talk={talk} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Talks page**

```tsx
// src/app/[locale]/talks/page.tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/shared/i18n/routing';
import { TalksGrid } from '@/features/talks/ui/talks-grid';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'talks.index' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function TalksPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations('talks.index');
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <header className="mb-12">
        <h1 className="mb-3 font-serif text-5xl text-[var(--fg-primary)]">{t('title')}</h1>
        <p className="text-lg text-[var(--fg-secondary)]">{t('subtitle')}</p>
      </header>
      <TalksGrid locale={typedLocale} />
    </main>
  );
}
```

- [ ] **Step 4: Typecheck + Biome**

```bash
pnpm typecheck && pnpm biome check src/features/talks src/app/\[locale\]/talks
```

- [ ] **Step 5: Commit**

```bash
git add src/features/talks src/app/\[locale\]/talks
git commit -m "feat(fase-4): talks index route"
```

---

### Batch G — Navbar wiring

**Files:**
- Modify: navbar component (path TBD — find via `rg "nav.work" src/shared`)

- [ ] **Step 1: Locate navbar**

```bash
pnpm exec rg -n "nav\\.(work|writing|talks|about)" src
```

- [ ] **Step 2: Wire href values**

Replace placeholder hrefs so:
- `nav.work` → `/${locale}/projects`
- `nav.writing` → `/${locale}/blog`
- `nav.talks` → `/${locale}/talks`
- `nav.about` → `/${locale}#about`

Use the existing `useLocale()` or `useParams()` pattern already in the navbar component. Do not introduce new patterns.

- [ ] **Step 3: Typecheck + Biome**

```bash
pnpm typecheck && pnpm biome check src/shared
```

- [ ] **Step 4: Commit**

```bash
git add src/shared
git commit -m "feat(fase-4): wire navbar to projects, blog and talks routes"
```

---

### Batch H — Verification

- [ ] **Step 1: Typecheck, biome, build-safe dev run**

```bash
rm -rf .next .content-collections
pnpm typecheck
pnpm biome check
pnpm dev  # background
```

- [ ] **Step 2: Route smoke tests**

For each of `/es/projects`, `/en/projects`, `/es/projects/<slug>`, `/en/projects/<slug>`, `/es/blog`, `/en/blog`, `/es/blog/<slug>`, `/en/blog/<slug>`, `/es/talks`, `/en/talks`:

```bash
curl -s -o /tmp/page.html -w "%{http_code}" http://localhost:3000<path>
```

Expected: 200 for every route. Grep the HTML for an expected string (e.g. the page title) to confirm SSR actually rendered, not just a 200 shell.

- [ ] **Step 3: Turbopack chunk smoke (same as Fase 3)**

```bash
curl -s http://localhost:3000/es/projects > /tmp/page.html
pnpm exec rg -o 'src="(/_next/static/chunks/[^"]+\.js)"' /tmp/page.html -r '$1' | head -5
# For each chunk: fetch and grep for the known-bad literal
curl -s "http://localhost:3000<chunk>" > /tmp/chunk.js
pnpm exec rg -q "An unexpected Turbopack error" /tmp/chunk.js && echo FAIL || echo OK
```

Expected: `OK` on every chunk. If any `FAIL`, do NOT mark complete — clean caches and rerun.

- [ ] **Step 4: Server log scan**

Inspect dev server output for `ERROR` lines that are NOT `[Browser]`-prefixed. Zero is required.

- [ ] **Step 5: MDX body rendering check**

Open `/es/blog/<slug>` and `/es/projects/<slug>` in a real browser. Confirm headings, lists and code blocks render with the mdxComponents styling (not raw HTML).

- [ ] **Step 6: Kill dev server + commit nothing**

This batch produces no code. It is a gate. If all checks pass, proceed. If anything fails, fix before moving on.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `@content-collections/react` version drift vs. core | Install latest, run typecheck; downgrade if types mismatch |
| `useMDXComponent` requires client boundary but `body` string is huge → bundle bloat | Body is compiled JS already; acceptable for now. Revisit if Lighthouse JS budget fails in Fase 6 |
| `generateStaticParams` returns both locales per slug → duplicate builds | Already filtered by `locale` in params; Next handles this correctly |
| `mdxComponents` is a `Record<string, ElementType>`, typing against `useMDXComponent`'s expected shape may error | If tsc complains, cast the import site: `<Component components={mdxComponents as never} />` with a single targeted cast |
| Talks schema has `language` but no body usage — wasted compile | Keep compiled body in schema; drop rendering for now (YAGNI). Revisit if talks ever need long-form notes |

## Self-review notes

- All files referenced in each task include full code blocks or exact modification instructions.
- Type names (`Project`, `Post`, `Talk`, `Locale`) are imported from the same modules as Fase 2/3.
- Helper names (`getAdjacentProjects`, `getRelatedPosts`, `getProjectBySlug`, `getPostBySlug`) are consistent across tasks.
- No TOC, no filters, no tag pages — scoped out as YAGNI per the master plan Fase 4 scope.
- Navbar wiring batch is intentionally loose because the exact navbar file path wasn't locked in Fase 1; Step 1 finds it first.
