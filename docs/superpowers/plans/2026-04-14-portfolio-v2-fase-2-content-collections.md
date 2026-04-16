# Portfolio v2 — Fase 2: Content Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introducir una capa de contenido tipada basada en Content Collections + Zod + MDX para los tres tipos de contenido del portfolio (projects, posts, talks), con seeds bilingües, syntax highlighting via shiki, MDX components map reusable, y tipos autogenerados accesibles desde `@/content`.

**Architecture:** `content-collections` corre en dev/build y genera `.content-collections/generated/` con tipos + data derivada. Una colección por tipo de contenido (`projects`, `posts`, `talks`), con schema Zod que incluye frontmatter + `locale` + slug derivado del filename. MDX body procesado con `compileMDX` del package oficial `@content-collections/mdx`, con `rehype-pretty-code` (shiki wrapper) para code blocks. Shared MDX components centralizados en `src/shared/mdx/components.tsx`. La renderización de páginas (/projects/[slug], etc.) queda **fuera de scope** de Fase 2 — solo dejamos la capa de data lista.

**Tech Stack:** @content-collections/core, @content-collections/next, @content-collections/mdx, zod (ya instalado para futuras fases), shiki, rehype-pretty-code, remark-gfm.

---

## User Constraints (leer antes de ejecutar)

1. **Never commit without explicit request.** Confirmar con usuario antes de `git commit`.
2. **Never build.** Verificar con `pnpm typecheck` + `pnpm check` + `pnpm dev`. Nunca `pnpm build`.
3. **Never cat/grep/find/sed/ls.** Usar Read, Grep, Glob, o bat/rg/fd.
4. **Plataforma Windows + Git Bash.** Forward slashes, unix syntax.
5. **Save memory after each batch.** `mem_save` con topic_key `portfolio-v2/fase-2-batch-{x}`.
6. **Comentarios solo cuando el WHY no es obvio.**

## Prerequisites

- En branch `refactor/v2`, HEAD = `d94fc8a feat(fase-1): theming, layout base, and SEO baseline`.
- Working tree limpio: `git status` → nothing to commit.
- Node + pnpm funcionando, deps de Fase 0-1 instaladas.

## File Structure

Files creados/modificados en esta fase:

```
refactor/v2 branch:
├── content-collections.ts              (NEW: root config con schemas Zod + compileMDX)
├── next.config.ts                      (MODIFY: envolver con withContentCollections)
├── tsconfig.json                       (MODIFY: agregar path @/content → .content-collections/generated)
├── package.json                        (MODIFY: deps nuevas + script postinstall)
├── .gitignore                          (MODIFY: agregar .content-collections/)
├── content/
│   ├── projects/
│   │   ├── acme-platform.es.mdx        (NEW: seed project ES)
│   │   ├── acme-platform.en.mdx        (NEW: seed project EN)
│   │   ├── devtool-x.es.mdx            (NEW: seed project ES)
│   │   └── devtool-x.en.mdx            (NEW: seed project EN)
│   ├── posts/
│   │   ├── architecture-as-teaching.es.mdx  (NEW)
│   │   ├── architecture-as-teaching.en.mdx  (NEW)
│   │   ├── testing-without-mocks.es.mdx     (NEW)
│   │   └── testing-without-mocks.en.mdx     (NEW)
│   └── talks/
│       ├── reactconf-2024.es.mdx       (NEW)
│       ├── reactconf-2024.en.mdx       (NEW)
│       ├── devtalks-2023.es.mdx        (NEW)
│       └── devtalks-2023.en.mdx        (NEW)
└── src/
    └── shared/
        ├── mdx/
        │   ├── components.tsx          (NEW: MDX components map)
        │   ├── pre.tsx                 (NEW: code block wrapper con copy button placeholder)
        │   └── callout.tsx             (NEW: Note/Warning/Tip variants)
        └── content/
            └── index.ts                (NEW: re-exports tipados de @/content-collections)
```

**Decisión de locale:** una colección por tipo, con locale en el filename (`name.{locale}.mdx`). El schema lo extrae vía transform. Alternativa descartada: `content/{locale}/...` requiere dos colecciones por tipo.

---

## Task 1: Instalar deps de content-collections

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1.1: Instalar runtime + peer deps**

```bash
pnpm add @content-collections/core @content-collections/next @content-collections/mdx
pnpm add shiki rehype-pretty-code remark-gfm
```

- [ ] **Step 1.2: Verificar versiones instaladas**

```bash
pnpm list @content-collections/core @content-collections/next @content-collections/mdx shiki rehype-pretty-code remark-gfm
```
Expected: todas listadas con versión. Si `@content-collections/next` reporta incompatibilidad con Next 16, reportar al usuario antes de seguir.

- [ ] **Step 1.3: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 2: Agregar `.content-collections/` a .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 2.1: Leer .gitignore actual**

Usar Read tool en `.gitignore`.

- [ ] **Step 2.2: Agregar línea si no existe**

El archivo ya tiene `# Content collections generated` + `.content-collections` (Fase 0). Confirmar que está. Si falta, agregar al final:
```
# Content collections generated
.content-collections
```

- [ ] **Step 2.3: git status debe seguir limpio**

```bash
git status --short
```
Si `.gitignore` se modificó, mostrarlo. Si no, sin cambios.

---

## Task 3: Agregar path alias en tsconfig.json

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 3.1: Leer tsconfig.json actual**

Usar Read tool.

- [ ] **Step 3.2: Agregar path `@/content-collections`**

En `compilerOptions.paths`, agregar (manteniendo los existentes):
```json
"@/content-collections": ["./.content-collections/generated"]
```
Ubicación: justo después de `"@/content/*": ["./content/*"]`.

- [ ] **Step 3.3: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0. Si reporta "Cannot find module '@/content-collections'", es esperado — todavía no creamos el archivo generado. El typecheck actual no importa ese módulo en ningún lado, así que debe pasar igual.

---

## Task 4: Crear `content-collections.ts` con schemas Zod

**Files:**
- Create: `content-collections.ts` (root del proyecto)

- [ ] **Step 4.1: Crear el config con schemas completos**

Create `content-collections.ts`:
```typescript
import { defineCollection, defineConfig } from '@content-collections/core';
import { compileMDX } from '@content-collections/mdx';
import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

const SUPPORTED_LOCALES = ['es', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function parseFilename(filePath: string): { slug: string; locale: SupportedLocale } {
  const base = filePath.split('/').pop() ?? filePath;
  const withoutExt = base.replace(/\.mdx$/, '');
  const match = withoutExt.match(/^(.+)\.(es|en)$/);
  if (!match) {
    throw new Error(
      `Invalid content filename: "${filePath}". Expected "<slug>.{es,en}.mdx".`,
    );
  }
  const [, slug, locale] = match as [string, string, SupportedLocale];
  return { slug, locale };
}

const mdxOptions = {
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
} as const;

const projects = defineCollection({
  name: 'projects',
  directory: 'content/projects',
  include: '**/*.mdx',
  schema: (z) => ({
    title: z.string().min(1),
    summary: z.string().min(1).max(200),
    role: z.string().min(1),
    year: z.number().int().min(2000).max(2100),
    stack: z.array(z.string().min(1)).min(1),
    client: z.string().optional(),
    cover: z.string().optional(),
    links: z
      .object({
        live: z.string().url().optional(),
        repo: z.string().url().optional(),
        caseStudy: z.string().url().optional(),
      })
      .optional(),
    featured: z.boolean().default(false),
    order: z.number().int().default(0),
  }),
  transform: async (document, context) => {
    const { slug, locale } = parseFilename(document._meta.filePath);
    const body = await compileMDX(context, document, mdxOptions);
    return {
      ...document,
      slug,
      locale,
      url: `/${locale}/projects/${slug}`,
      body,
    };
  },
});

const posts = defineCollection({
  name: 'posts',
  directory: 'content/posts',
  include: '**/*.mdx',
  schema: (z) => ({
    title: z.string().min(1),
    summary: z.string().min(1).max(240),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  schema: (z) => ({
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
```

- [ ] **Step 4.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0. Si se queja de `compileMDX` o del shape del context, ajustar al API real del package instalado.

---

## Task 5: Integrar content-collections en next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 5.1: Leer next.config.ts actual**

Usar Read tool.

- [ ] **Step 5.2: Envolver con `withContentCollections`**

Reemplazar contenido de `next.config.ts` (conservando cualquier flag custom que ya exista — leer primero para saberlo). Estructura esperada si era default:
```typescript
import { withContentCollections } from '@content-collections/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default withContentCollections(nextConfig);
```

Si el file actual tiene otra shape (ej `module.exports = ...`), adaptar manteniendo el wrapper.

- [ ] **Step 5.3: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 6: Crear seed files de projects (4 archivos)

**Files:**
- Create: `content/projects/acme-platform.es.mdx`
- Create: `content/projects/acme-platform.en.mdx`
- Create: `content/projects/devtool-x.es.mdx`
- Create: `content/projects/devtool-x.en.mdx`

- [ ] **Step 6.1: Crear `content/projects/acme-platform.es.mdx`**

```mdx
---
title: "Acme Platform"
summary: "Plataforma SaaS multi-tenant con arquitectura hexagonal y 99.95% uptime."
role: "Lead Architect"
year: 2025
stack: ["Next.js", "TypeScript", "PostgreSQL", "AWS", "Terraform"]
client: "Acme Inc."
featured: true
order: 1
links:
  live: "https://example.com"
  caseStudy: "https://example.com/case-study"
---

## El problema

Acme necesitaba migrar su legacy PHP monolito a una plataforma moderna capaz de soportar 50+ tenants con aislamiento estricto de datos y latencias sub-200ms.

## La solución

Diseñé una arquitectura hexagonal con bounded contexts por dominio de negocio, persistencia multi-schema en Postgres para aislamiento tenant, y una capa de caching distribuida con Redis Cluster. CI/CD con Terraform + GitHub Actions desplegando a ECS con blue/green.

## Impacto

- **Latencia p95:** 1.8s → 140ms
- **Deploys:** 1/mes → 20/día
- **Uptime:** 99.2% → 99.95%
```

- [ ] **Step 6.2: Crear `content/projects/acme-platform.en.mdx`**

```mdx
---
title: "Acme Platform"
summary: "Multi-tenant SaaS platform with hexagonal architecture and 99.95% uptime."
role: "Lead Architect"
year: 2025
stack: ["Next.js", "TypeScript", "PostgreSQL", "AWS", "Terraform"]
client: "Acme Inc."
featured: true
order: 1
links:
  live: "https://example.com"
  caseStudy: "https://example.com/case-study"
---

## The problem

Acme needed to migrate their legacy PHP monolith to a modern platform capable of handling 50+ tenants with strict data isolation and sub-200ms latencies.

## The solution

I designed a hexagonal architecture with bounded contexts per business domain, multi-schema Postgres persistence for tenant isolation, and a distributed caching layer with Redis Cluster. CI/CD with Terraform + GitHub Actions deploying to ECS with blue/green.

## Impact

- **p95 latency:** 1.8s → 140ms
- **Deploys:** 1/month → 20/day
- **Uptime:** 99.2% → 99.95%
```

- [ ] **Step 6.3: Crear `content/projects/devtool-x.es.mdx`**

```mdx
---
title: "DevTool X"
summary: "CLI de productividad para arquitectos que automatiza scaffolding de bounded contexts."
role: "Creator & Maintainer"
year: 2024
stack: ["TypeScript", "Node.js", "Commander", "Vitest"]
featured: true
order: 2
links:
  repo: "https://github.com/example/devtool-x"
---

## El problema

Crear un nuevo bounded context en proyectos hexagonales implica ~30 archivos boilerplate. Los equipos lo evitaban y terminaban acoplando dominios.

## La solución

CLI que genera la estructura completa (domain, application, infrastructure, presentation) desde un schema YAML con validación Zod. Integrado con Vitest para tests de contract automáticos entre capas.

## Impacto

- **500+ stars** en GitHub
- Adoptado por 8 equipos en 3 empresas
```

- [ ] **Step 6.4: Crear `content/projects/devtool-x.en.mdx`**

```mdx
---
title: "DevTool X"
summary: "Productivity CLI for architects that automates bounded context scaffolding."
role: "Creator & Maintainer"
year: 2024
stack: ["TypeScript", "Node.js", "Commander", "Vitest"]
featured: true
order: 2
links:
  repo: "https://github.com/example/devtool-x"
---

## The problem

Creating a new bounded context in hexagonal projects requires ~30 boilerplate files. Teams avoided it and ended up coupling domains.

## The solution

CLI that generates the full structure (domain, application, infrastructure, presentation) from a YAML schema with Zod validation. Integrated with Vitest for automated contract tests between layers.

## Impact

- **500+ stars** on GitHub
- Adopted by 8 teams across 3 companies
```

---

## Task 7: Crear seed files de posts (4 archivos)

**Files:**
- Create: `content/posts/architecture-as-teaching.es.mdx`
- Create: `content/posts/architecture-as-teaching.en.mdx`
- Create: `content/posts/testing-without-mocks.es.mdx`
- Create: `content/posts/testing-without-mocks.en.mdx`

- [ ] **Step 7.1: Crear `content/posts/architecture-as-teaching.es.mdx`**

```mdx
---
title: "Arquitectura como enseñanza"
summary: "Por qué la mejor arquitectura es la que tu equipo puede explicar en la pizarra."
publishedAt: "2026-03-10"
tags: ["architecture", "teaching", "team"]
readingTimeMinutes: 6
---

## La métrica que nadie mide

Si tu arquitecto se va mañana, ¿puede tu equipo mantener el sistema? Esa es la pregunta que importa. No la pregunta de si el diagrama es bonito.

```ts
// Un bounded context bien enseñado
interface PaymentGateway {
  charge(amount: Money, customer: CustomerId): Promise<Receipt>;
}
```

## Señales de que fallaste enseñando

1. Nadie toca ciertos archivos "porque son del arquitecto".
2. Los PRs se estancan esperando tu review.
3. Las decisiones se justifican con "lo dijo X".
```

- [ ] **Step 7.2: Crear `content/posts/architecture-as-teaching.en.mdx`**

```mdx
---
title: "Architecture as teaching"
summary: "Why the best architecture is the one your team can explain on a whiteboard."
publishedAt: "2026-03-10"
tags: ["architecture", "teaching", "team"]
readingTimeMinutes: 6
---

## The metric nobody measures

If your architect leaves tomorrow, can your team maintain the system? That's the question that matters. Not whether the diagram is pretty.

```ts
// A well-taught bounded context
interface PaymentGateway {
  charge(amount: Money, customer: CustomerId): Promise<Receipt>;
}
```

## Signs you failed at teaching

1. Nobody touches certain files "because they belong to the architect".
2. PRs stall waiting for your review.
3. Decisions are justified with "X said so".
```

- [ ] **Step 7.3: Crear `content/posts/testing-without-mocks.es.mdx`**

```mdx
---
title: "Testing sin mocks"
summary: "Cómo los mocks te protegen del bug real y qué hacer en su lugar."
publishedAt: "2026-02-18"
tags: ["testing", "integration", "pragmatism"]
readingTimeMinutes: 8
---

## La mentira confortable

Un test que mockea la DB pasa siempre. Y no te dice nada sobre producción. Llevo quince años viendo equipos caer en el mismo agujero: el test verde, el deploy rojo.

## Qué hago en su lugar

- **Integration tests con Postgres real** corriendo en Docker.
- **Contract tests** entre bounded contexts usando schemas Zod compartidos.
- **Tests de humo** que pegan al endpoint real en un ambiente efímero.
```

- [ ] **Step 7.4: Crear `content/posts/testing-without-mocks.en.mdx`**

```mdx
---
title: "Testing without mocks"
summary: "How mocks shield you from the real bug and what to do instead."
publishedAt: "2026-02-18"
tags: ["testing", "integration", "pragmatism"]
readingTimeMinutes: 8
---

## The comfortable lie

A test that mocks the DB always passes. And tells you nothing about production. I've spent fifteen years watching teams fall into the same hole: green test, red deploy.

## What I do instead

- **Integration tests with a real Postgres** running in Docker.
- **Contract tests** between bounded contexts using shared Zod schemas.
- **Smoke tests** hitting the real endpoint in an ephemeral environment.
```

---

## Task 8: Crear seed files de talks (4 archivos)

**Files:**
- Create: `content/talks/reactconf-2024.es.mdx`
- Create: `content/talks/reactconf-2024.en.mdx`
- Create: `content/talks/devtalks-2023.es.mdx`
- Create: `content/talks/devtalks-2023.en.mdx`

- [ ] **Step 8.1: Crear `content/talks/reactconf-2024.es.mdx`**

```mdx
---
title: "Arquitectura hexagonal en React"
summary: "Cómo llevar DDD estratégico al frontend sin sobre-ingeniería."
event: "ReactConf LATAM"
city: "Buenos Aires"
year: 2024
language: "es"
slides: "https://example.com/slides/reactconf-2024"
video: "https://example.com/video/reactconf-2024"
---

Charla de 45 minutos explorando bounded contexts en aplicaciones React reales, con ejemplos de un SaaS en producción.
```

- [ ] **Step 8.2: Crear `content/talks/reactconf-2024.en.mdx`**

```mdx
---
title: "Hexagonal architecture in React"
summary: "Bringing strategic DDD to the frontend without over-engineering."
event: "ReactConf LATAM"
city: "Buenos Aires"
year: 2024
language: "es"
slides: "https://example.com/slides/reactconf-2024"
video: "https://example.com/video/reactconf-2024"
---

45-minute talk exploring bounded contexts in real React applications, with examples from a production SaaS.
```

- [ ] **Step 8.3: Crear `content/talks/devtalks-2023.es.mdx`**

```mdx
---
title: "Testing que importa"
summary: "Por qué los tests de integración son la única verdad."
event: "DevTalks"
city: "Montevideo"
year: 2023
language: "es"
slides: "https://example.com/slides/devtalks-2023"
---

Workshop de 2 horas sobre testing pragmático — mocks al mínimo, integración al máximo.
```

- [ ] **Step 8.4: Crear `content/talks/devtalks-2023.en.mdx`**

```mdx
---
title: "Testing that matters"
summary: "Why integration tests are the only truth."
event: "DevTalks"
city: "Montevideo"
year: 2023
language: "es"
slides: "https://example.com/slides/devtalks-2023"
---

2-hour workshop on pragmatic testing — minimum mocks, maximum integration.
```

---

## Task 9: Primer build de content-collections (descubrir errores reales del API)

**Files:**
- (Ninguno — verificación)

- [ ] **Step 9.1: Ejecutar dev una vez para trigger de content-collections**

```bash
pnpm dev
```
Esperar hasta ver "Ready". El plugin `@content-collections/next` debería generar `.content-collections/generated/` al arrancar.

**Importante:** si falla con un error de API shape (ej `compileMDX is not a function`, `_meta.filePath undefined`, schema lowercase, etc.) — **para el dev server, reportar el error exacto al usuario**, y hacer los ajustes mínimos necesarios al `content-collections.ts` antes de continuar.

- [ ] **Step 9.2: Verificar que se generaron los archivos**

Usar Glob tool:
```
.content-collections/generated/**/*.{ts,js,json}
```
Expected: al menos `index.ts` / `index.js` con exports `allProjects`, `allPosts`, `allTalks` (o nombres equivalentes del package).

- [ ] **Step 9.3: Matar el dev server**

Ctrl+C o KillBash.

- [ ] **Step 9.4: Typecheck después de generar**

```bash
pnpm typecheck
```
Expected: exit 0. Ahora `@/content-collections` resuelve al archivo generado.

---

## Task 10: Crear `src/shared/content/index.ts` re-exports tipados

**Files:**
- Create: `src/shared/content/index.ts`

- [ ] **Step 10.1: Inspeccionar qué exporta el archivo generado**

Usar Read tool en `.content-collections/generated/index.ts` (o el archivo principal generado) para confirmar los nombres exactos de los exports (`allProjects`, `allPosts`, `allTalks`). Si los nombres difieren, usar los reales.

- [ ] **Step 10.2: Crear el re-export tipado**

Create `src/shared/content/index.ts` (ajustar nombres si el archivo generado usa otros):
```typescript
import { allPosts, allProjects, allTalks } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

export type Project = (typeof allProjects)[number];
export type Post = (typeof allPosts)[number];
export type Talk = (typeof allTalks)[number];

export function getProjects(locale: Locale): Project[] {
  return allProjects
    .filter((p) => p.locale === locale)
    .sort((a, b) => a.order - b.order || b.year - a.year);
}

export function getFeaturedProjects(locale: Locale): Project[] {
  return getProjects(locale).filter((p) => p.featured);
}

export function getProjectBySlug(locale: Locale, slug: string): Project | undefined {
  return allProjects.find((p) => p.locale === locale && p.slug === slug);
}

export function getPosts(locale: Locale): Post[] {
  return allPosts
    .filter((p) => p.locale === locale && !p.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(locale: Locale, slug: string): Post | undefined {
  return allPosts.find((p) => p.locale === locale && p.slug === slug);
}

export function getTalks(locale: Locale): Talk[] {
  return allTalks
    .filter((t) => t.locale === locale)
    .sort((a, b) => b.year - a.year);
}

export function getTalkBySlug(locale: Locale, slug: string): Talk | undefined {
  return allTalks.find((t) => t.locale === locale && t.slug === slug);
}
```

- [ ] **Step 10.3: Verificar que `Locale` type existe en routing**

Leer `src/shared/i18n/routing.ts`. Si no exporta `Locale`, agregarlo al final:
```typescript
export type Locale = (typeof routing.locales)[number];
```

- [ ] **Step 10.4: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 11: Crear MDX components map (headings, pre, callouts)

**Files:**
- Create: `src/shared/mdx/callout.tsx`
- Create: `src/shared/mdx/pre.tsx`
- Create: `src/shared/mdx/components.tsx`

- [ ] **Step 11.1: Crear `src/shared/mdx/callout.tsx`**

```typescript
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type CalloutVariant = 'note' | 'warning' | 'tip';

type CalloutProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CalloutVariant;
  title?: string;
};

const variantMap: Record<CalloutVariant, string> = {
  note: 'border-[var(--fg-muted)] bg-[var(--bg-secondary)]/60',
  warning: 'border-[var(--accent-warn)] bg-[var(--bg-secondary)]/60',
  tip: 'border-[var(--accent-success)] bg-[var(--bg-secondary)]/60',
};

export function Callout({ variant = 'note', title, className, children, ...props }: CalloutProps) {
  return (
    <div
      className={cn('my-6 border-l-2 px-5 py-4 text-[var(--fg-secondary)]', variantMap[variant], className)}
      {...props}
    >
      {title ? (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)]">
          {title}
        </p>
      ) : null}
      <div className="font-serif text-base leading-relaxed">{children}</div>
    </div>
  );
}
```

- [ ] **Step 11.2: Crear `src/shared/mdx/pre.tsx`**

```typescript
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type PreProps = HTMLAttributes<HTMLPreElement>;

export function Pre({ className, children, ...props }: PreProps) {
  return (
    <pre
      className={cn(
        'my-6 overflow-x-auto border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4 font-mono text-[13px] leading-relaxed text-[var(--fg-secondary)]',
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  );
}
```

- [ ] **Step 11.3: Crear `src/shared/mdx/components.tsx`**

```typescript
import type { ComponentProps } from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/cn';
import { Callout } from '@/shared/mdx/callout';
import { Pre } from '@/shared/mdx/pre';

function H2({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'mt-16 mb-4 font-serif text-3xl font-normal tracking-tight text-[var(--fg-primary)] md:text-4xl',
        className,
      )}
      {...props}
    />
  );
}

function H3({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'mt-10 mb-3 font-serif text-2xl font-normal tracking-tight text-[var(--fg-primary)]',
        className,
      )}
      {...props}
    />
  );
}

function P({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn('my-4 font-serif text-lg leading-relaxed text-[var(--fg-secondary)]', className)}
      {...props}
    />
  );
}

function Ul({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('my-4 list-disc space-y-2 pl-6 font-serif text-lg text-[var(--fg-secondary)]', className)}
      {...props}
    />
  );
}

function Ol({ className, ...props }: ComponentProps<'ol'>) {
  return (
    <ol
      className={cn(
        'my-4 list-decimal space-y-2 pl-6 font-serif text-lg text-[var(--fg-secondary)]',
        className,
      )}
      {...props}
    />
  );
}

function InlineCode({ className, ...props }: ComponentProps<'code'>) {
  return (
    <code
      className={cn(
        'border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--fg-primary)]',
        className,
      )}
      {...props}
    />
  );
}

function A({ className, ...props }: ComponentProps<'a'>) {
  return (
    <a
      className={cn(
        'underline decoration-[var(--accent)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--accent)]',
        className,
      )}
      {...props}
    />
  );
}

function MdxImage({ alt = '', ...props }: ComponentProps<typeof Image>) {
  return (
    <Image
      alt={alt}
      className="my-8 h-auto w-full border border-[var(--bg-tertiary)]"
      {...props}
    />
  );
}

export const mdxComponents = {
  h2: H2,
  h3: H3,
  p: P,
  ul: Ul,
  ol: Ol,
  code: InlineCode,
  pre: Pre,
  a: A,
  Image: MdxImage,
  Callout,
};
```

- [ ] **Step 11.4: Typecheck + check**

```bash
pnpm typecheck && pnpm check
```
Expected: ambos exit 0. Si biome se queja de algo, correr `pnpm check:fix` una vez.

---

## Task 12: Verificación end-to-end de content layer

**Files:**
- (Ninguno — verificación)

- [ ] **Step 12.1: Typecheck final**

```bash
pnpm typecheck
```
Expected: exit 0.

- [ ] **Step 12.2: Biome check**

```bash
pnpm check
```
Expected: 0 issues.

- [ ] **Step 12.3: Regenerar content-collections arrancando dev**

```bash
pnpm dev
```
Esperar "Ready".

- [ ] **Step 12.4: Verificar imports en una página existente**

Editar temporalmente `src/app/[locale]/page.tsx` para agregar un import debug y logs server-side (solo para verificar, revertir en el siguiente step):

Agregar arriba del `export default`:
```typescript
import { getFeaturedProjects, getPosts, getTalks } from '@/shared/content';
```

Y adentro del handler, después del `setRequestLocale(locale)`:
```typescript
const debug = {
  projects: getFeaturedProjects(locale as 'es' | 'en').length,
  posts: getPosts(locale as 'es' | 'en').length,
  talks: getTalks(locale as 'es' | 'en').length,
};
console.log('[content-layer]', debug);
```

- [ ] **Step 12.5: Hit /es y /en para forzar el log**

```bash
curl -s -o /dev/null http://localhost:3000/es
curl -s -o /dev/null http://localhost:3000/en
```
Mirar la salida del dev server — debe loggear `[content-layer] { projects: 2, posts: 2, talks: 2 }` para ambos locales.

- [ ] **Step 12.6: Revertir los cambios temporales del page.tsx**

Quitar el import debug y el `console.log` del step 12.4. `page.tsx` queda exactamente como estaba antes de Task 12.

- [ ] **Step 12.7: Typecheck post-revert**

```bash
pnpm typecheck && pnpm check
```
Expected: exit 0.

- [ ] **Step 12.8: Matar dev server**

Ctrl+C o KillBash.

---

## Task 13: Commit con confirmación del usuario

**Files:**
- (Solo git)

- [ ] **Step 13.1: git status**

```bash
git status --short
```
Revisar que están TODOS los archivos de la fase y NINGÚN archivo del directorio `.content-collections/` (debe estar ignorado).

- [ ] **Step 13.2: STOP — pedir confirmación**

Preguntar al usuario textualmente: "Fase 2 terminada. Content Collections configurado con schemas Zod para projects/posts/talks, 12 seed files bilingües, MDX components map con callouts + shiki, helpers tipados en `@/shared/content`. Todo verifica. ¿Hago commit a `refactor/v2`?"

**NO commit sin confirmación explícita.**

- [ ] **Step 13.3: Si confirma, staging explícito**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts content-collections.ts content/ src/shared/content/ src/shared/mdx/ docs/superpowers/plans/2026-04-14-portfolio-v2-fase-2-content-collections.md
```

Y también `src/shared/i18n/routing.ts` si se modificó en Task 10 para exportar `Locale`:
```bash
git add src/shared/i18n/routing.ts
```

- [ ] **Step 13.4: Commit**

```bash
git commit -m "feat(fase-2): content collections layer with zod schemas and MDX pipeline

- @content-collections/core + next + mdx integration
- Zod schemas for projects, posts, talks with frontmatter validation
- Locale extracted from filename (<slug>.<es|en>.mdx)
- rehype-pretty-code + shiki for syntax highlighting
- remark-gfm for GFM support
- Seed files: 2 projects, 2 posts, 2 talks (bilingual, 12 total)
- Typed helpers in @/shared/content: getProjects, getPosts, getTalks + by-slug variants
- MDX components map: H2, H3, P, Ul, Ol, code, pre, Callout, next/image
- Path alias @/content-collections → .content-collections/generated
- withContentCollections wrapper in next.config.ts"
```

- [ ] **Step 13.5: Verificar commit**

```bash
git log --oneline -3
```
Expected: commit nuevo arriba, `d94fc8a fase-1` en medio, `1616452 fase-0` abajo.

---

## Success Criteria (end of Fase 2)

- [ ] `pnpm typecheck` pasa con 0 errors
- [ ] `pnpm check` pasa con 0 issues
- [ ] `pnpm dev` arranca sin errors y regenera `.content-collections/`
- [ ] `.content-collections/generated/` existe y contiene `allProjects`, `allPosts`, `allTalks`
- [ ] `@/shared/content` expone helpers `getProjects(locale)`, `getPosts(locale)`, `getTalks(locale)` y variantes `BySlug` + `getFeaturedProjects`
- [ ] Los 12 MDX seeds parsean sin errores contra los schemas
- [ ] `mdxComponents` map listo para consumir en Fases 3-4 cuando se renderee body
- [ ] Commit creado en `refactor/v2`

## What's NOT in this plan (deferido)

- Páginas `/projects`, `/blog`, `/talks` (index + detail) → Fases 3 y 4
- Hero animation + featured projects grid en home → Fase 3
- OG image dinámica por post/project → Fase 4 o 6
- RSS feed del blog → Fase 5 o 6
- Tests de unidad sobre los helpers → Fase 6
- Content de verdad (reemplazar seeds) → paralelo a Fases 3-7 conforme Juan pase material

## Engram save at end of phase

```
mem_save({
  title: "Portfolio v2 — Fase 2 Content Collections shipped",
  type: "architecture",
  topic_key: "portfolio-v2/fase-2-content",
  project: "portfolio-juan-silva",
  content: "..."
})
```
Y `mem_session_summary` con Goal / Accomplished / Discoveries / Next Steps / Relevant Files.

---

## Self-Review Notes

**Spec coverage (Fase 2 scope from original plan):**
- ✅ `content-collections.ts` con schemas Zod para projects/posts/talks (Task 4)
- ✅ Seed con 2-3 ejemplos por tipo, bilingüe (Tasks 6-8)
- ✅ MDX components map: headings, code blocks con shiki, callouts, images con next/image (Task 11)
- ✅ Build de collections pasa, tipos auto-generados disponibles (Task 9, 10)

**Placeholder scan:** No hay "TBD" ni steps sin código. Los seed files contienen texto placeholder consciente que Juan reemplazará con contenido real — documentado en "What's NOT".

**Type consistency:**
- `Project`, `Post`, `Talk` types derivados de `(typeof allX)[number]` — consistentes entre Task 10 y Tasks 4, 9
- `Locale` type introducido en Task 10.3 y consumido en helpers — single source of truth
- `SupportedLocale` dentro de `content-collections.ts` (Task 4) duplica el concepto pero vive en el build-time config, no se importa a runtime — OK por límite de Zod/config scope
- `parseFilename` retorna `{slug, locale}`, consumido uniformemente en los 3 `transform` (Task 4)
- `mdxComponents` export (Task 11) es el map consumido por el MDX runtime en fases posteriores — nombres de keys matchean los tags HTML estándar

**Ambiguity:** La única incertidumbre real es el API exacto de `compileMDX` y del `context` en `transform` — el plan instruye en Task 9 a capturar el error real y ajustar, en lugar de adivinar. Esto es deliberado: el package puede tener cambios menores entre versiones y no queremos un plan que se rompa por una firma.
