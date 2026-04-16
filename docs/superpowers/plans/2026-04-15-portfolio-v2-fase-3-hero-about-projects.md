# Portfolio v2 — Fase 3: Hero + About + Projects List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan batch-by-batch. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Fase 1 placeholder home page with three real features — a bilingual Hero with rotating role phrases, an About section with bio + skills + timeline, and a featured Projects list that consumes `content-collections` via the Fase 2 typed helpers.

**Architecture:** Feature-based under `src/features/{hero,about,projects}/`. Each feature owns its own `ui/` folder (presentational) plus (where needed) `data.ts` (static config like role list or skills groups) and `model.ts` (types). All components are **server components by default**; only the Hero's role-rotation UI is `'use client'`. Content for projects comes from `getFeaturedProjects(locale)` from `@/shared/content`. Bilingual copy for Hero / About lives in `src/messages/{es,en}.json` under a new `home.about`, `home.projects`, and extended `home.hero` namespace.

**Tech Stack:** Next.js 16 App Router (RSC) · next-intl 4 · Tailwind 4 · Motion (already installed; for Hero rotation) · Content Collections helpers from Fase 2.

---

## Scope

**In:** Hero feature with rotating role phrases, About feature (bio + skills grid + timeline), featured Projects grid on the home page consuming real content-collections data, updated i18n messages in both locales, composition in `src/app/[locale]/page.tsx`.

**Out:** Dedicated `/projects` index route, case-study detail routes, filtering UI by tag/year, blog, talks pages, contact form. Those land in Fases 4 and 5.

## File Structure

```
src/
  features/
    hero/
      ui/
        hero.tsx              # server component, composes heading + subtitle + role rotator
        role-rotator.tsx      # 'use client', cycles role phrases with motion fade
      data.ts                 # static role keys (mapped to i18n)
    about/
      ui/
        about.tsx             # server, composes bio + skills-grid + timeline
        skills-grid.tsx       # server, renders groups from data
        timeline.tsx          # server, renders entries from data
      data.ts                 # skills groups + timeline entries (keys for i18n)
    projects/
      ui/
        project-card.tsx      # server, one card per project
        projects-grid.tsx     # server, maps featured projects to cards
  app/[locale]/page.tsx       # MODIFIED: compose <Hero/> <About/> <ProjectsGrid/>
  messages/{es,en}.json       # MODIFIED: add home.hero.roles[], home.about.*, home.projects.*
```

**Rationale for file splits:**
- `hero.tsx` stays server so metadata + i18n resolution happen server-side; only `role-rotator.tsx` is a client island.
- `about.tsx` composes two small server components (`skills-grid`, `timeline`) — easier to reason about than one 300-line file.
- `project-card.tsx` is separate so it can be reused on a future `/projects` index in Fase 4 without refactor.
- `data.ts` per feature holds **keys** (not translated strings). Strings live in `messages/*.json` and are resolved via `getTranslations` at render time. This keeps the i18n boundary clean.

---

## Execution Strategy

Seven logical batches. Each batch is one subagent dispatch. Commit happens **once** at the end (Batch G) after user confirmation — matches the Fase 1 / Fase 2 pattern.

- **Batch A** — i18n messages (es + en) for hero roles, about, projects
- **Batch B** — Hero feature (data + role-rotator + hero)
- **Batch C** — About feature (data + skills-grid + timeline + about)
- **Batch D** — Projects feature (project-card + projects-grid)
- **Batch E** — Compose on `src/app/[locale]/page.tsx`
- **Batch F** — Verification (typecheck, biome, dev server real render in both locales, check chunks parse)
- **Batch G** — User review + commit

---

## Batch A — i18n Messages

**Files modified:** `src/messages/es.json`, `src/messages/en.json`

- [ ] **Step 1: Add new namespaces to es.json under `home`**

Replace the current `home` block with:

```json
"home": {
  "hero": {
    "prompt": "whoami — portfolio · 2026",
    "title": "Juan Silva.",
    "subtitle": "Construyendo software, enseñando gente, diseñando sistemas que perduran.",
    "roles": {
      "architect": "Senior Architect",
      "gde": "Google Developer Expert",
      "mvp": "Microsoft MVP",
      "teacher": "Teacher & Mentor"
    },
    "rolesIntro": "Actualmente"
  },
  "about": {
    "eyebrow": "Sobre mí",
    "title": "Arquitectura como forma de enseñar.",
    "bio": [
      "Llevo más de quince años construyendo software: desde microservicios financieros hasta apps móviles con millones de descargas. En todo ese camino, lo que más me importó nunca fue el stack — fue cómo el código se explica solo al próximo que lo lee.",
      "Hoy trabajo como Senior Architect, soy Google Developer Expert y Microsoft MVP, y enseño a equipos enteros a pensar antes de escribir una línea. El portfolio que estás viendo es, en parte, mi forma de seguir enseñando."
    ],
    "skillsTitle": "Lo que hago",
    "skills": {
      "architecture": {
        "label": "Arquitectura",
        "items": ["Clean Architecture", "Hexagonal", "Screaming Architecture", "DDD", "Event-driven"]
      },
      "testing": {
        "label": "Testing",
        "items": ["TDD", "Integration testing", "Contract testing", "Playwright", "Vitest"]
      },
      "tooling": {
        "label": "Tooling",
        "items": ["TypeScript", "Next.js", "Go", "PostgreSQL", "AWS", "Terraform"]
      },
      "teaching": {
        "label": "Enseñanza",
        "items": ["Mentoring 1:1", "Code reviews formativos", "Workshops", "Charlas", "Escritura técnica"]
      }
    },
    "timelineTitle": "Trayectoria",
    "timeline": {
      "current": {
        "period": "2022 — hoy",
        "role": "Senior Software Architect",
        "place": "Consultoría independiente"
      },
      "mvp": {
        "period": "2021 — hoy",
        "role": "Microsoft MVP",
        "place": "Microsoft"
      },
      "gde": {
        "period": "2020 — hoy",
        "role": "Google Developer Expert",
        "place": "Google"
      },
      "lead": {
        "period": "2018 — 2022",
        "role": "Tech Lead",
        "place": "Proyectos fintech y mobile"
      },
      "senior": {
        "period": "2013 — 2018",
        "role": "Senior Developer",
        "place": "Agencias y producto"
      }
    }
  },
  "projects": {
    "eyebrow": "Trabajo destacado",
    "title": "Proyectos que moldearon cómo pienso.",
    "empty": "Todavía no hay proyectos destacados.",
    "year": "Año",
    "role": "Rol",
    "stack": "Stack",
    "caseStudy": "Ver caso de estudio",
    "live": "Sitio live",
    "repo": "Código"
  }
}
```

Keep `common` and `placeholder` blocks untouched.

- [ ] **Step 2: Add matching namespaces to en.json**

Replace `home` block with:

```json
"home": {
  "hero": {
    "prompt": "whoami — portfolio · 2026",
    "title": "Juan Silva.",
    "subtitle": "Building software, teaching people, designing systems that last.",
    "roles": {
      "architect": "Senior Architect",
      "gde": "Google Developer Expert",
      "mvp": "Microsoft MVP",
      "teacher": "Teacher & Mentor"
    },
    "rolesIntro": "Currently"
  },
  "about": {
    "eyebrow": "About",
    "title": "Architecture as a way of teaching.",
    "bio": [
      "I've spent more than fifteen years building software — from fintech microservices to mobile apps with millions of downloads. Through all of it, what mattered most was never the stack. It was how the code explained itself to whoever read it next.",
      "Today I work as a Senior Architect, I'm a Google Developer Expert and Microsoft MVP, and I teach entire teams to think before writing a line. This portfolio is, in part, my way of keeping that conversation going."
    ],
    "skillsTitle": "What I do",
    "skills": {
      "architecture": {
        "label": "Architecture",
        "items": ["Clean Architecture", "Hexagonal", "Screaming Architecture", "DDD", "Event-driven"]
      },
      "testing": {
        "label": "Testing",
        "items": ["TDD", "Integration testing", "Contract testing", "Playwright", "Vitest"]
      },
      "tooling": {
        "label": "Tooling",
        "items": ["TypeScript", "Next.js", "Go", "PostgreSQL", "AWS", "Terraform"]
      },
      "teaching": {
        "label": "Teaching",
        "items": ["1:1 mentoring", "Constructive code reviews", "Workshops", "Talks", "Technical writing"]
      }
    },
    "timelineTitle": "Track record",
    "timeline": {
      "current": {
        "period": "2022 — now",
        "role": "Senior Software Architect",
        "place": "Independent consulting"
      },
      "mvp": {
        "period": "2021 — now",
        "role": "Microsoft MVP",
        "place": "Microsoft"
      },
      "gde": {
        "period": "2020 — now",
        "role": "Google Developer Expert",
        "place": "Google"
      },
      "lead": {
        "period": "2018 — 2022",
        "role": "Tech Lead",
        "place": "Fintech and mobile projects"
      },
      "senior": {
        "period": "2013 — 2018",
        "role": "Senior Developer",
        "place": "Agencies and product teams"
      }
    }
  },
  "projects": {
    "eyebrow": "Featured work",
    "title": "Projects that shaped how I think.",
    "empty": "No featured projects yet.",
    "year": "Year",
    "role": "Role",
    "stack": "Stack",
    "caseStudy": "View case study",
    "live": "Live site",
    "repo": "Code"
  }
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `pnpm typecheck`
Expected: exit 0 (next-intl validates namespaces at type-check time).

---

## Batch B — Hero Feature

**Files created:**
- `src/features/hero/data.ts`
- `src/features/hero/ui/role-rotator.tsx` (`'use client'`)
- `src/features/hero/ui/hero.tsx`

- [ ] **Step 1: Create `src/features/hero/data.ts`**

```ts
export const HERO_ROLE_KEYS = ['architect', 'gde', 'mvp', 'teacher'] as const;

export type HeroRoleKey = (typeof HERO_ROLE_KEYS)[number];
```

- [ ] **Step 2: Create `src/features/hero/ui/role-rotator.tsx`**

```tsx
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

type Props = {
  phrases: string[];
  intervalMs?: number;
};

export function RoleRotator({ phrases, intervalMs = 2400 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [phrases.length, intervalMs]);

  const current = phrases[index] ?? phrases[0] ?? '';

  return (
    <span
      className="relative inline-block min-h-[1.2em] align-baseline"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="inline-block text-[var(--accent)]"
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
```

Notes: `motion/react` is the import path for Motion v11+ (what the stack calls "Motion"). If the installed package is still `framer-motion`, change the import to `framer-motion`. Check `package.json` first.

- [ ] **Step 3: Create `src/features/hero/ui/hero.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { Container } from '@/shared/ui/container';
import { HERO_ROLE_KEYS } from '@/features/hero/data';
import { RoleRotator } from '@/features/hero/ui/role-rotator';

export async function Hero() {
  const t = await getTranslations('home.hero');
  const phrases = HERO_ROLE_KEYS.map((key) => t(`roles.${key}`));

  return (
    <section className="relative">
      <Container size="wide" className="py-24 md:py-32">
        <div className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          <span className="text-[var(--accent)]">$</span> {t('prompt')}
        </div>
        <h1 className="font-serif text-7xl font-normal leading-[0.88] tracking-[-0.03em] text-[var(--fg-primary)] md:text-9xl">
          {t('title')}
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-xl italic text-[var(--fg-tertiary)] md:text-2xl">
          {t('subtitle')}
        </p>
        <p className="mt-10 font-mono text-sm uppercase tracking-[0.15em] text-[var(--fg-muted)]">
          {t('rolesIntro')} ·{' '}
          <RoleRotator phrases={phrases} />
        </p>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0.

---

## Batch C — About Feature

**Files created:**
- `src/features/about/data.ts`
- `src/features/about/ui/skills-grid.tsx`
- `src/features/about/ui/timeline.tsx`
- `src/features/about/ui/about.tsx`

- [ ] **Step 1: Create `src/features/about/data.ts`**

```ts
export const ABOUT_SKILL_KEYS = ['architecture', 'testing', 'tooling', 'teaching'] as const;
export type AboutSkillKey = (typeof ABOUT_SKILL_KEYS)[number];

export const ABOUT_TIMELINE_KEYS = ['current', 'mvp', 'gde', 'lead', 'senior'] as const;
export type AboutTimelineKey = (typeof ABOUT_TIMELINE_KEYS)[number];

export const ABOUT_BIO_PARAGRAPHS = 2;
```

- [ ] **Step 2: Create `src/features/about/ui/skills-grid.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { ABOUT_SKILL_KEYS } from '@/features/about/data';

export async function SkillsGrid() {
  const t = await getTranslations('home.about');

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {ABOUT_SKILL_KEYS.map((key) => {
        const items = t.raw(`skills.${key}.items`) as string[];
        return (
          <div
            key={key}
            className="border-t border-[var(--bg-tertiary)] pt-6"
          >
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              {t(`skills.${key}.label`)}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {items.map((item) => (
                <li
                  key={item}
                  className="font-serif text-base text-[var(--fg-secondary)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
```

Note: `t.raw` returns the untyped message value — we cast to `string[]` because the shape is defined in the JSON files. This is safe as long as Batch A ran correctly.

- [ ] **Step 3: Create `src/features/about/ui/timeline.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { ABOUT_TIMELINE_KEYS } from '@/features/about/data';

export async function Timeline() {
  const t = await getTranslations('home.about');

  return (
    <ol className="mt-8 space-y-6">
      {ABOUT_TIMELINE_KEYS.map((key) => (
        <li
          key={key}
          className="grid grid-cols-[auto_1fr] gap-6 border-t border-[var(--bg-tertiary)] pt-6"
        >
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {t(`timeline.${key}.period`)}
          </span>
          <div>
            <p className="font-serif text-lg text-[var(--fg-primary)]">
              {t(`timeline.${key}.role`)}
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-tertiary)]">
              {t(`timeline.${key}.place`)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Create `src/features/about/ui/about.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import { Container } from '@/shared/ui/container';
import { SkillsGrid } from '@/features/about/ui/skills-grid';
import { Timeline } from '@/features/about/ui/timeline';
import { ABOUT_BIO_PARAGRAPHS } from '@/features/about/data';

export async function About() {
  const t = await getTranslations('home.about');
  const bio = Array.from({ length: ABOUT_BIO_PARAGRAPHS }, (_, i) =>
    t(`bio.${i}`),
  );

  return (
    <section className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl">
          {t('title')}
        </h2>
        <div className="mt-12 max-w-2xl space-y-6 font-serif text-lg leading-relaxed text-[var(--fg-secondary)] md:text-xl">
          {bio.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('skillsTitle')}
          </h3>
          <div className="mt-6">
            <SkillsGrid />
          </div>
        </div>

        <div className="mt-20">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('timelineTitle')}
          </h3>
          <Timeline />
        </div>
      </Container>
    </section>
  );
}
```

**IMPORTANT**: `t('bio.0')` / `t('bio.1')` accesses array indices as keys — next-intl supports this for arrays in messages. If the runtime rejects it, fall back to `t.raw('bio')` and cast to `string[]`. Discover at verification time; fix with the `t.raw` fallback if needed.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0.

---

## Batch D — Projects Feature

**Files created:**
- `src/features/projects/ui/project-card.tsx`
- `src/features/projects/ui/projects-grid.tsx`

- [ ] **Step 1: Create `src/features/projects/ui/project-card.tsx`**

```tsx
import type { Project } from '@/content-collections';
import { getTranslations } from 'next-intl/server';

type Props = {
  project: Project;
};

export async function ProjectCard({ project }: Props) {
  const t = await getTranslations('home.projects');

  return (
    <article className="group relative flex flex-col gap-6 border-t border-[var(--bg-tertiary)] pt-8">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-2xl text-[var(--fg-primary)] md:text-3xl">
          {project.title}
        </h3>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-muted)]">
          {project.year}
        </span>
      </header>

      <p className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)]">
        {project.summary}
      </p>

      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('role')}
          </dt>
          <dd className="mt-1 font-serif text-base text-[var(--fg-secondary)]">
            {project.role}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('stack')}
          </dt>
          <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[var(--fg-secondary)]">
            {project.stack.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </dd>
        </div>
      </dl>

      {(project.links?.live || project.links?.repo || project.links?.caseStudy) && (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.15em]">
          {project.links?.live && (
            <li>
              <a
                href={project.links.live}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('live')}
              </a>
            </li>
          )}
          {project.links?.repo && (
            <li>
              <a
                href={project.links.repo}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('repo')}
              </a>
            </li>
          )}
          {project.links?.caseStudy && (
            <li>
              <a
                href={project.links.caseStudy}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('caseStudy')}
              </a>
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Create `src/features/projects/ui/projects-grid.tsx`**

```tsx
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/shared/i18n/routing';
import { getFeaturedProjects } from '@/shared/content';
import { Container } from '@/shared/ui/container';
import { ProjectCard } from '@/features/projects/ui/project-card';

type Props = {
  locale: Locale;
};

export async function ProjectsGrid({ locale }: Props) {
  const t = await getTranslations('home.projects');
  const projects = getFeaturedProjects(locale);

  return (
    <section className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl">
          {t('title')}
        </h2>

        {projects.length === 0 ? (
          <p className="mt-12 font-serif italic text-[var(--fg-tertiary)]">
            {t('empty')}
          </p>
        ) : (
          <div className="mt-16 space-y-20">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0.

---

## Batch E — Compose on Home Page

**Files modified:** `src/app/[locale]/page.tsx`

- [ ] **Step 1: Replace `src/app/[locale]/page.tsx` contents**

```tsx
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/shared/i18n/routing';
import { Hero } from '@/features/hero/ui/hero';
import { About } from '@/features/about/ui/about';
import { ProjectsGrid } from '@/features/projects/ui/projects-grid';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <About />
      <ProjectsGrid locale={locale as Locale} />
    </main>
  );
}
```

Notes:
- The `placeholder` message namespace is no longer referenced, but it stays in the JSON so other places can still compile. If biome flags it as dead, remove from both es.json and en.json in the same step.
- `locale as Locale` cast is safe here because `hasLocale` already ran in the parent `[locale]/layout.tsx`.

- [ ] **Step 2: Typecheck + biome**

Run:
```
pnpm typecheck
pnpm biome check
```
Expected: both exit 0.

---

## Batch F — Verification

**No files changed.** This batch runs the dev server, fetches both locales **with JS execution validation**, and inspects for errors. The Fase 2 verification missed a Turbopack client error because curl doesn't execute JS — this batch closes that gap.

- [ ] **Step 1: Clear stale Turbopack cache**

Run: `rm -rf .next .content-collections`
Rationale: `next.config.ts` has not changed, but features add new client boundaries; a clean build eliminates false positives.

- [ ] **Step 2: Start dev server in background on port 3000**

Run: `pnpm dev` (background, log to file).

- [ ] **Step 3: Wait for "Ready" in log**

Monitor the log for the line `✓ Ready in Nms`. Also watch for `error`, `Error`, `Failed`, `Module not`, `Cannot`, `EADDR`, `ELIFECYCLE`.

- [ ] **Step 4: Fetch `/es` and `/en` HTML**

```bash
curl -s -o /tmp/es.html -w "es=%{http_code}\n" http://localhost:3000/es
curl -s -o /tmp/en.html -w "en=%{http_code}\n" http://localhost:3000/en
```
Expected: both return 200.

- [ ] **Step 5: Validate HTML contents**

For /es, grep the HTML for required markers (all must be present):
- `Juan Silva.` (hero title)
- `Senior Architect` OR `Google Developer Expert` OR `Microsoft MVP` OR `Teacher & Mentor` (at least one role present — the client rotator initial state renders the first one server-side)
- `Sobre mí` (about eyebrow)
- `Trabajo destacado` (projects eyebrow)
- `Acme` (one of the seed project titles in Spanish)

For /en, grep for:
- `Juan Silva.`
- `Building software`
- `About` (eyebrow)
- `Featured work`
- `Acme` (English seed project title)

Run:
```bash
for term in "Juan Silva." "Sobre mí" "Trabajo destacado" "Acme"; do
  grep -q "$term" /tmp/es.html && echo "es OK: $term" || echo "es MISS: $term"
done
for term in "Juan Silva." "Building software" "About" "Featured work" "Acme"; do
  grep -q "$term" /tmp/en.html && echo "en OK: $term" || echo "en MISS: $term"
done
```

All must print OK. If any MISS, STOP and report.

- [ ] **Step 6: Validate a client chunk parses (Turbopack smoke)**

Extract a JS chunk path from the HTML and fetch it. The response must be 200 AND not empty AND not contain `"An unexpected Turbopack error"` as a literal string.

```bash
chunk=$(grep -oE '/_next/static/chunks/[^"]+\.js' /tmp/es.html | head -1)
echo "chunk=$chunk"
curl -s -o /tmp/chunk.js -w "http=%{http_code} size=%{size_download}\n" "http://localhost:3000$chunk"
grep -c "An unexpected Turbopack error" /tmp/chunk.js && echo "TURBOPACK ERROR IN CHUNK" || echo "chunk clean"
```
Expected: `http=200`, `size` > 1000, `chunk clean`.

- [ ] **Step 7: Scan server log for runtime errors**

Grep the dev server log for `"level":"ERROR"` lines that are NOT browser-echoed:

```bash
grep '"level":"ERROR"' .next/dev/logs/next-development.log | grep -v '"source":"Browser"' | head
```
Expected: no output. If there are errors, STOP and report.

- [ ] **Step 8: Kill dev server**

Stop the background task. Then `netstat -ano | grep ":3000.*LISTENING"` — if a zombie PID remains, kill it with `taskkill //PID <pid> //F`.

- [ ] **Step 9: Final static checks**

```
pnpm typecheck
pnpm biome check
```
Expected: both exit 0.

- [ ] **Step 10: Report status**

Report: READY_TO_COMMIT with the list of files changed, or CONCERNS with specifics.

---

## Batch G — User Review + Commit

**Do not run until the user confirms the home page looks right in their browser.**

- [ ] **Step 1: Ask user to review the running site**

Tell the user: "Fase 3 verificada estática y en curl. ¿Podés abrir `http://localhost:3000/es` y `/en` en el browser y confirmar que la rotación del Hero, el About y los Projects cards se ven bien?"

Wait for explicit confirmation.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(fase-3): hero, about, and featured projects home composition

- Hero feature with client-side role rotator (Motion AnimatePresence)
- About feature with bio, skills grid (4 groups), and timeline
- Projects feature reading featured projects from content-collections
- Extend home i18n namespace for hero roles, about, and projects sections
- Compose <Hero/> <About/> <ProjectsGrid/> on src/app/[locale]/page.tsx"
```

Do not add Co-Authored-By. Uses conventional commit style, matching Fase 1 and Fase 2.

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Motion import path mismatch (`motion/react` vs `framer-motion`) | Batch B Step 2 checks package.json before finalizing imports. If `framer-motion` is installed, rewrite the import in that step before moving on. |
| `t('bio.0')` indexing fails at runtime | Fallback to `t.raw('bio') as string[]`. Covered in Batch C Step 4. |
| Turbopack client error after new `'use client'` boundary | Batch F Step 1 pre-clears `.next` and `.content-collections`. Step 6 validates a chunk actually returns clean JS, which is exactly the gap that Fase 2 verification missed. |
| Hero role rotator hydration mismatch (server renders first role, client immediately replaces it) | Acceptable — same text server and client on first paint; `useState(0)` keeps index 0 on first client render. No mismatch. |
| `placeholder` i18n namespace becomes dead after Batch E | Delete it from both JSON files in Batch E Step 1 if biome/typecheck flags dead messages. next-intl does NOT fail on extra keys, so leaving it is also safe. |

---

## Self-Review Checklist Run

**Spec coverage:**
- Hero with rotating roles → Batch B ✅
- About with bio + skills groups + timeline → Batch C ✅
- Projects grid consuming content-collections → Batch D ✅
- Bilingual (es + en) → Batch A ✅
- Home composition → Batch E ✅
- Verification that catches client errors → Batch F (fixes Fase 2 gap) ✅
- Commit gate → Batch G ✅

**Placeholder scan:** No "TBD", no "add error handling", no "similar to Task N", no skipped code blocks. Every file shows its full contents.

**Type consistency:** `Locale` imported from `@/shared/i18n/routing` everywhere. `Project` imported from `@/content-collections` generated types (same alias configured in Fase 2 Batch A). `HERO_ROLE_KEYS`, `ABOUT_SKILL_KEYS`, `ABOUT_TIMELINE_KEYS` each defined once in the relevant `data.ts` and reused.

**Gaps:** `/projects` index and case-study detail routes are deliberately deferred to Fase 4 per the master plan.
