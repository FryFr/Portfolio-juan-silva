# Fase 6 — Testing + CI + Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lock quality with Vitest unit + component tests, Playwright E2E (nav + detail routes + metadata), axe a11y audit, GitHub Actions CI with parallel jobs, Lighthouse CI budget ≥95.

**Architecture:** Vitest (happy-dom + Testing Library) for pure logic and component rendering. Playwright E2E against real dev server. axe-core via `@axe-core/playwright` on home + detail pages. GH Actions: 3 parallel jobs (lint/typecheck/vitest, playwright+a11y, lighthouse). Single final commit.

**Tech Stack:** Vitest 4 · happy-dom · Testing Library · Playwright 1.59 · @axe-core/playwright · GitHub Actions · Lighthouse CI

**Commit Policy:** ONE commit at the very end (Batch J). Memory save after every batch.

---

## File Structure

- Create: `tests/lib/reading-time.test.ts`, `tests/lib/related.test.ts`, `tests/lib/content-helpers.test.ts`
- Create: `tests/components/contact-button.test.tsx`, `tests/components/contact-section.test.tsx`, `tests/components/floating-whatsapp.test.tsx`, `tests/components/footer.test.tsx`, `tests/components/project-card.test.tsx`
- Create: `tests/helpers/render-with-intl.tsx`
- Create: `e2e/home.spec.ts`, `e2e/navigation.spec.ts`, `e2e/theme-locale.spec.ts`, `e2e/contact-floating.spec.ts`, `e2e/case-study.spec.ts`, `e2e/blog-detail.spec.ts`, `e2e/metadata.spec.ts`, `e2e/a11y.spec.ts`
- Create: `.github/workflows/ci.yml`, `.lighthouserc.json`
- Modify: `package.json` (add `test:a11y`, `lhci` scripts; dev deps `@axe-core/playwright`, `@lhci/cli`)

---

## Batch A — Vitest component test scaffolding

**Files:**
- Create: `tests/helpers/render-with-intl.tsx`

- [ ] **Step 1:** Create helper that wraps RTL render with NextIntlClientProvider.

```tsx
import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

type Locale = 'es' | 'en';

const messagesByLocale = { es: esMessages, en: enMessages } as const;

export function renderWithIntl(
  ui: ReactElement,
  { locale = 'es', ...options }: RenderOptions & { locale?: Locale } = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      {children}
    </NextIntlClientProvider>
  );
  return render(ui, { wrapper: Wrapper, ...options });
}
```

- [ ] **Step 2:** `pnpm typecheck` → clean.
- [ ] **Step 3:** mem_save topic `portfolio-v2/fase-6-batch-a`.

---

## Batch B — Unit tests for pure logic

**Files:**
- Create: `tests/lib/reading-time.test.ts`, `tests/lib/related.test.ts`, `tests/lib/content-helpers.test.ts`

- [ ] **Step 1:** Read `src/features/blog/lib/reading-time.ts` and `src/features/blog/lib/related.ts` and `src/shared/content/index.ts` to learn signatures.
- [ ] **Step 2:** Write failing tests:

```ts
// tests/lib/reading-time.test.ts
import { describe, expect, it } from 'vitest';
import { calculateReadingTime } from '@/features/blog/lib/reading-time';

describe('calculateReadingTime', () => {
  it('returns 1 for very short content', () => {
    expect(calculateReadingTime('hello world')).toBe(1);
  });
  it('scales with word count (≈200 wpm)', () => {
    const words = Array.from({ length: 600 }, () => 'word').join(' ');
    expect(calculateReadingTime(words)).toBe(3);
  });
  it('strips markdown syntax', () => {
    const md = '# Title\n\n**bold** [link](https://x) word '.repeat(100);
    expect(calculateReadingTime(md)).toBeGreaterThanOrEqual(1);
  });
});
```

```ts
// tests/lib/related.test.ts
import { describe, expect, it } from 'vitest';
import { findRelated } from '@/features/blog/lib/related';

type Post = { slug: string; tags: readonly string[]; locale: 'es' | 'en' };

const posts: Post[] = [
  { slug: 'a', tags: ['arch', 'ddd'], locale: 'es' },
  { slug: 'b', tags: ['arch'], locale: 'es' },
  { slug: 'c', tags: ['ddd', 'testing'], locale: 'es' },
  { slug: 'd', tags: ['react'], locale: 'en' },
];

describe('findRelated', () => {
  it('excludes the current post', () => {
    const result = findRelated(posts, 'a', 3);
    expect(result.map((p) => p.slug)).not.toContain('a');
  });
  it('ranks by shared tag count', () => {
    const result = findRelated(posts, 'a', 3);
    expect(result[0]?.slug).toMatch(/^(b|c)$/);
  });
  it('respects the limit', () => {
    expect(findRelated(posts, 'a', 1).length).toBeLessThanOrEqual(1);
  });
});
```

```ts
// tests/lib/content-helpers.test.ts
import { describe, expect, it } from 'vitest';
import { getAdjacentProjects } from '@/shared/content';

describe('getAdjacentProjects', () => {
  it('returns null prev for first item', () => {
    // real data from collection — adjust slugs after reading collection
    const result = getAdjacentProjects('es', '__non-existent__');
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });
});
```

- [ ] **Step 3:** Run `pnpm test` → expect all PASS (or adjust signatures by reading actual source). If a helper signature doesn't match, update the test to the real API (this batch is about coverage, not forcing new APIs).
- [ ] **Step 4:** mem_save topic `portfolio-v2/fase-6-batch-b`.

---

## Batch C — Component tests (Testing Library + happy-dom)

**Files:**
- Create: `tests/components/contact-button.test.tsx`, `tests/components/floating-whatsapp.test.tsx`, `tests/components/project-card.test.tsx`

- [ ] **Step 1:** ContactButton test — renders label, correct href, variant classes, target=_blank+rel.

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactButton } from '@/features/contact/ui/contact-button';

describe('ContactButton', () => {
  it('renders label and href', () => {
    render(<ContactButton variant="whatsapp" href="https://wa.me/1" label="Message me" />);
    const link = screen.getByRole('link', { name: 'Message me' });
    expect(link).toHaveAttribute('href', 'https://wa.me/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
```

- [ ] **Step 2:** FloatingWhatsApp test — uses `renderWithIntl`, initial render shows button, click dismiss hides and writes sessionStorage.

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '@/../tests/helpers/render-with-intl';
import { FloatingWhatsApp } from '@/features/contact/ui/floating-whatsapp';

describe('FloatingWhatsApp', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('renders open link initially', async () => {
    renderWithIntl(<FloatingWhatsApp />);
    expect(await screen.findByRole('link', { name: /WhatsApp/i })).toBeInTheDocument();
  });

  it('hides after dismiss click and persists', async () => {
    const user = userEvent.setup();
    renderWithIntl(<FloatingWhatsApp />);
    await user.click(await screen.findByRole('button', { name: /Ocultar|Hide/i }));
    expect(screen.queryByRole('link', { name: /WhatsApp/i })).toBeNull();
    expect(window.sessionStorage.getItem('floating-wa-dismissed')).toBe('1');
  });
});
```

- [ ] **Step 3:** ProjectCard test — renders title, year, stack chips, link points to `/${locale}/projects/${slug}`.

```tsx
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithIntl } from '@/../tests/helpers/render-with-intl';
import { ProjectCard } from '@/features/projects/ui/project-card';

describe('ProjectCard', () => {
  it('renders title and links to detail', () => {
    const project = {
      slug: 'demo',
      title: 'Demo Project',
      summary: 'A demo',
      role: 'Architect',
      year: 2025,
      stack: ['Next.js', 'Go'],
      locale: 'es' as const,
    };
    renderWithIntl(<ProjectCard project={project as never} locale="es" />);
    expect(screen.getByText('Demo Project')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Demo Project/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/projects/demo'),
    );
  });
});
```

- [ ] **Step 4:** Run `pnpm test` → adjust to real ProjectCard/ContactButton props by reading sources. Every assertion must match actual markup.
- [ ] **Step 5:** mem_save topic `portfolio-v2/fase-6-batch-c`.

---

## Batch D — Playwright E2E: home, nav, locale, theme, floating WA

**Files:**
- Create: `e2e/home.spec.ts`, `e2e/navigation.spec.ts`, `e2e/theme-locale.spec.ts`, `e2e/contact-floating.spec.ts`

- [ ] **Step 1:** `home.spec.ts` — visits `/es`, asserts hero title visible, ContactSection heading visible.

```ts
import { test, expect } from '@playwright/test';

test('es home renders hero and contact', async ({ page }) => {
  await page.goto('/es');
  await expect(page.getByRole('heading', { name: 'Juan Silva.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '¿Hablamos?' })).toBeVisible();
});

test('en home renders hero and contact', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { name: "Let's talk" })).toBeVisible();
});
```

- [ ] **Step 2:** `navigation.spec.ts` — clicks nav links (Trabajos, Escritos, Charlas) and asserts URL + heading.

```ts
import { test, expect } from '@playwright/test';

test('nav links route correctly in es', async ({ page }) => {
  await page.goto('/es');
  await page.getByRole('link', { name: 'Trabajos' }).click();
  await expect(page).toHaveURL('/es/projects');
  await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible();

  await page.getByRole('link', { name: 'Escritos' }).click();
  await expect(page).toHaveURL('/es/blog');

  await page.getByRole('link', { name: 'Charlas' }).click();
  await expect(page).toHaveURL('/es/talks');
});
```

- [ ] **Step 3:** `theme-locale.spec.ts` — toggle theme adds `dark` class on html; locale switch takes `/es` → `/en`.

```ts
import { test, expect } from '@playwright/test';

test('theme toggle flips html class', async ({ page }) => {
  await page.goto('/es');
  const html = page.locator('html');
  const initialClass = (await html.getAttribute('class')) ?? '';
  await page.getByRole('button', { name: /tema/i }).click();
  await expect(html).not.toHaveClass(initialClass);
});

test('locale switcher moves to /en', async ({ page }) => {
  await page.goto('/es');
  await page.getByRole('link', { name: /EN/i }).click();
  await expect(page).toHaveURL(/\/en/);
});
```

- [ ] **Step 4:** `contact-floating.spec.ts` — floating WA visible, click dismiss, verify not visible, reload same session still not visible.

```ts
import { test, expect } from '@playwright/test';

test('floating WA can be dismissed for session', async ({ page }) => {
  await page.goto('/es');
  const wa = page.getByRole('link', { name: /WhatsApp/i }).last();
  await expect(wa).toBeVisible();
  await page.getByRole('button', { name: /Ocultar/i }).click();
  await expect(wa).toBeHidden();
});
```

- [ ] **Step 5:** `pnpm e2e` → all green. Fix selectors if needed (real markup is source of truth).
- [ ] **Step 6:** mem_save topic `portfolio-v2/fase-6-batch-d`.

---

## Batch E — Playwright E2E: case study + blog detail

**Files:**
- Create: `e2e/case-study.spec.ts`, `e2e/blog-detail.spec.ts`

- [ ] **Step 1:** Case study — go `/es/projects`, click first project card, verify detail page has title + "← Todos los proyectos" back link.
- [ ] **Step 2:** Blog detail — go `/es/blog`, click first post, verify reading time visible + "Seguí leyendo" section.

```ts
// e2e/case-study.spec.ts
import { test, expect } from '@playwright/test';

test('projects index → detail', async ({ page }) => {
  await page.goto('/es/projects');
  const firstCard = page.getByRole('link').filter({ hasText: /./ }).first();
  await firstCard.click();
  await expect(page).toHaveURL(/\/es\/projects\/.+/);
  await expect(page.getByRole('link', { name: /Todos los proyectos/ })).toBeVisible();
});
```

```ts
// e2e/blog-detail.spec.ts
import { test, expect } from '@playwright/test';

test('blog index → detail with reading time', async ({ page }) => {
  await page.goto('/es/blog');
  const firstPost = page.getByRole('link').filter({ hasText: /./ }).first();
  await firstPost.click();
  await expect(page).toHaveURL(/\/es\/blog\/.+/);
  await expect(page.getByText(/min/)).toBeVisible();
});
```

- [ ] **Step 3:** `pnpm e2e` → green. If there are no projects/posts in content, skip with `test.skip`.
- [ ] **Step 4:** mem_save topic `portfolio-v2/fase-6-batch-e`.

---

## Batch F — Playwright E2E: metadata + JSON-LD

**Files:**
- Create: `e2e/metadata.spec.ts`

- [ ] **Step 1:** Verify `<title>`, canonical link, og:locale, Person/ProfilePage JSON-LD present.

```ts
import { test, expect } from '@playwright/test';

test('home has canonical, og, and JSON-LD', async ({ page }) => {
  await page.goto('/es');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/es$/);
  const ogLocale = page.locator('meta[property="og:locale"]');
  await expect(ogLocale).toHaveAttribute('content', 'es');

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = scripts.join('\n');
  expect(joined).toContain('"@type":"Person"');
  expect(joined).toContain('"@type":"ProfilePage"');
});

test('en home canonical and og:locale', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/en$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en');
});
```

- [ ] **Step 2:** `pnpm e2e` → green.
- [ ] **Step 3:** mem_save topic `portfolio-v2/fase-6-batch-f`.

---

## Batch G — Accessibility audit with axe

**Files:**
- Create: `e2e/a11y.spec.ts`
- Modify: `package.json` (add `@axe-core/playwright`)

- [ ] **Step 1:** Install dev dep.

```bash
pnpm add -D @axe-core/playwright
```

- [ ] **Step 2:** Write a11y spec — scans home (es + en), projects index, blog index, talks. Fail on serious+critical violations.

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/es', '/en', '/es/projects', '/es/blog', '/es/talks'];

for (const route of routes) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
```

- [ ] **Step 3:** `pnpm e2e` → green. If violations appear, fix at source (alt text, aria, contrast). Don't silence them.
- [ ] **Step 4:** mem_save topic `portfolio-v2/fase-6-batch-g`.

---

## Batch H — GitHub Actions CI (parallel jobs)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1:** Workflow with 3 parallel jobs: `lint-test` (typecheck+biome+vitest), `e2e` (playwright+a11y against build), `lighthouse` (after e2e).

```yaml
name: CI

on:
  push:
    branches: [main, 'refactor/**']
  pull_request:
    branches: [main]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm check
      - run: pnpm test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm exec playwright test
        env:
          CI: 'true'
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  lighthouse:
    runs-on: ubuntu-latest
    needs: e2e
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm exec lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

- [ ] **Step 2:** Validate YAML locally (paste into https://rhysd.github.io/actionlint — or just visual review).
- [ ] **Step 3:** mem_save topic `portfolio-v2/fase-6-batch-h`.

---

## Batch I — Lighthouse CI budget

**Files:**
- Create: `.lighthouserc.json`
- Modify: `package.json` (add `@lhci/cli` dev dep + `lhci` script)

- [ ] **Step 1:** Install.

```bash
pnpm add -D @lhci/cli
```

- [ ] **Step 2:** Config targets `/es`, `/en`, `/es/projects`, `/es/blog`, budget 0.95 on all four categories.

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "pnpm start",
      "startServerReadyPattern": "Ready in",
      "url": [
        "http://localhost:3000/es",
        "http://localhost:3000/en",
        "http://localhost:3000/es/projects",
        "http://localhost:3000/es/blog"
      ],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 3:** Add script `"lhci": "lhci autorun"` in `package.json`.
- [ ] **Step 4:** Optional local run: `pnpm build && pnpm lhci`. If any score < 0.95, fix root cause (images, font display, meta) — do NOT lower the budget.
- [ ] **Step 5:** mem_save topic `portfolio-v2/fase-6-batch-i`.

---

## Batch J — Verification + single final commit

- [ ] **Step 1:** Run the full gate locally:

```bash
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm e2e
```

All green required.

- [ ] **Step 2:** `git status` — confirm expected files.
- [ ] **Step 3:** Stage + single commit:

```bash
git add tests/ e2e/ .github/workflows/ci.yml .lighthouserc.json package.json pnpm-lock.yaml docs/superpowers/plans/2026-04-15-portfolio-v2-fase-6-testing-ci.md
git commit -m "feat(fase-6): testing suite, ci pipeline, a11y audit, lighthouse budget"
```

- [ ] **Step 4:** mem_save topic `portfolio-v2/fase-6-complete`.

---

## Self-Review Notes

- Test files reference helpers/components that exist; adjust selectors to real markup when they differ (not a plan failure — plan says "read source first").
- Every batch verifies with `pnpm test`/`pnpm e2e` before saving memory.
- No intermediate commits; single commit in Batch J.
- CI budget is a hard 0.95 — no escape hatch.
