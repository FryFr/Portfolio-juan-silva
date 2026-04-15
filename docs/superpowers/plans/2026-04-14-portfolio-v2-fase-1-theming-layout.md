# Portfolio v2 — Fase 1: Theming + Layout Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar dark/light theming sin flash, extender los design tokens con paleta dark, crear los componentes base de `shared/ui` (Container, Link i18n, Button, Tag, ThemeToggle, LocaleSwitcher), armar Navbar + Footer editorial, cablearlos en el root layout, y dejar SEO baseline completo (sitemap.ts, robots.ts, JSON-LD Person+ProfilePage, metadata OG/Twitter).

**Architecture:** `next-themes` con `attribute="class"` y CSS vars duplicadas en `.dark` selector (no en `@theme` — Tailwind 4 no soporta `@theme` condicional). `shared/ui` como capa de átomos/moléculas reusables. Navbar y Footer son Server Components que reciben traducciones via `getTranslations`; los switches (theme, locale, menu mobile) son Client Components mínimos. SEO via `generateMetadata` + JSON-LD inline en layout.

**Tech Stack:** next-themes, next-intl (ya configurado), Next.js metadata API, schema.org via JSON-LD script tag.

---

## User Constraints (leer antes de ejecutar)

1. **Never commit without explicit request.** Confirmar con usuario antes de cualquier `git commit`.
2. **Never build.** Verificar con `pnpm typecheck` + `pnpm check` + `pnpm dev`. Nunca `pnpm build`.
3. **Never use cat/grep/find/sed/ls.** Usar `bat`, `rg`, `fd`. Tools nativas del agente (Read, Grep, Glob) son OK.
4. **Plataforma Windows + Git Bash.** Forward slashes, unix syntax.
5. **Comentarios:** solo si el WHY no es obvio. No docstrings largas, no "used by X".

## File Structure

Files creados o modificados en esta fase:

```
refactor/v2 branch (continuando desde Fase 0):
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx              (MODIFY: ThemeProvider, Navbar, Footer, JSON-LD)
│   │   │   └── page.tsx                (MODIFY: usar Container y tokens sin `[--var]`)
│   │   ├── globals.css                 (MODIFY: agregar .dark tokens + no-flash)
│   │   ├── sitemap.ts                  (NEW: rutas estáticas por locale)
│   │   └── robots.ts                   (NEW: allow all + sitemap ref)
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── container.tsx           (NEW: wrapper ancho + padding)
│   │   │   ├── link.tsx                (NEW: re-export i18n Link tipado)
│   │   │   ├── button.tsx              (NEW: variants primary/ghost/link)
│   │   │   ├── tag.tsx                 (NEW: pill para stacks)
│   │   │   ├── theme-provider.tsx      (NEW: next-themes wrapper client)
│   │   │   ├── theme-toggle.tsx        (NEW: client button con íconos)
│   │   │   ├── locale-switcher.tsx     (NEW: client select ES/EN)
│   │   │   ├── navbar.tsx              (NEW: server component)
│   │   │   ├── footer.tsx              (NEW: server component)
│   │   │   └── json-ld.tsx             (NEW: script tag para schema.org)
│   │   ├── config/
│   │   │   └── site.ts                 (MODIFY: agregar nav items, social completos)
│   │   └── lib/
│   │       └── cn.ts                   (NEW: clsx + tailwind-merge helper)
│   └── messages/
│       ├── es.json                     (MODIFY: agregar nav, footer, theme strings)
│       └── en.json                     (MODIFY: agregar nav, footer, theme strings)
```

---

## Prerequisites Check

- [ ] **Step 0.1: Verificar que estamos en refactor/v2 con Fase 0 commiteada**

```bash
git branch --show-current
git log --oneline -1
```
Expected: branch `refactor/v2`, HEAD con `feat: bootstrap portfolio v2 with Next 16 + i18n + Biome`.

- [ ] **Step 0.2: Verificar working tree limpio**

```bash
git status
```
Expected: `nothing to commit, working tree clean`. Si hay cambios, parar y preguntar al usuario.

---

## Task 1: Instalar next-themes + clsx + tailwind-merge

**Files:**
- Modify: `package.json`

- [ ] **Step 1.1: Instalar runtime deps**

```bash
pnpm add next-themes clsx tailwind-merge
```
Expected: `+ next-themes X.Y.Z`, `+ clsx X.Y.Z`, `+ tailwind-merge X.Y.Z`.

- [ ] **Step 1.2: Verificar instalación**

```bash
pnpm typecheck
```
Expected: exit code 0.

---

## Task 2: Crear helper `cn` (clsx + tailwind-merge)

**Files:**
- Create: `src/shared/lib/cn.ts`

- [ ] **Step 2.1: Crear el archivo**

Create `src/shared/lib/cn.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2.2: Verificar typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 3: Extender globals.css con tokens dark + no-flash

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 3.1: Leer estado actual**

Usar Read tool en `src/app/globals.css` para ver los tokens light existentes.

- [ ] **Step 3.2: Reescribir globals.css con light + dark**

Reemplazar contenido completo:
```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-bg-primary: #f5f1ea;
  --color-bg-secondary: #ece3d2;
  --color-bg-tertiary: #e8dfcf;
  --color-bg-invert: #1a1208;

  --color-fg-primary: #1a1208;
  --color-fg-secondary: #3d2e1a;
  --color-fg-tertiary: #6b5943;
  --color-fg-muted: #9a8567;
  --color-fg-subtle: #b8a589;

  --color-accent: #c4a574;
  --color-accent-success: #7a9960;
  --color-accent-warn: #e07856;

  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-serif), Georgia, serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;
}

:root {
  --bg-primary: #f5f1ea;
  --bg-secondary: #ece3d2;
  --bg-tertiary: #e8dfcf;
  --bg-invert: #1a1208;
  --fg-primary: #1a1208;
  --fg-secondary: #3d2e1a;
  --fg-tertiary: #6b5943;
  --fg-muted: #9a8567;
  --fg-subtle: #b8a589;
  --accent: #c4a574;
  --accent-success: #7a9960;
  --accent-warn: #e07856;
}

.dark {
  --bg-primary: #1a1208;
  --bg-secondary: #241a0e;
  --bg-tertiary: #2e2214;
  --bg-invert: #f5f1ea;
  --fg-primary: #f5f1ea;
  --fg-secondary: #e8dfcf;
  --fg-tertiary: #b8a589;
  --fg-muted: #9a8567;
  --fg-subtle: #6b5943;
  --accent: #d4b584;
  --accent-success: #8ba970;
  --accent-warn: #f08866;
}

html {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  color-scheme: light dark;
}

body {
  background-color: var(--bg-primary);
  color: var(--fg-primary);
  font-feature-settings: "ss01", "ss02", "cv11";
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Nota:** `@custom-variant dark` le dice a Tailwind 4 que trate `dark:` como un variant que matchea cuando hay clase `.dark` ancestral. Los tokens se redefinen en `.dark` sin tocar `@theme`.

- [ ] **Step 3.3: Verificar biome sigue ignorando .css**

```bash
pnpm check
```
Expected: 0 issues (CSS excluido via `!**/*.css`).

---

## Task 4: Crear ThemeProvider client wrapper

**Files:**
- Create: `src/shared/ui/theme-provider.tsx`

- [ ] **Step 4.1: Crear el provider**

Create `src/shared/ui/theme-provider.tsx`:
```typescript
'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 4.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 5: Crear Container atom

**Files:**
- Create: `src/shared/ui/container.tsx`

- [ ] **Step 5.1: Crear Container**

Create `src/shared/ui/container.tsx`:
```typescript
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: 'narrow' | 'default' | 'wide';
};

const sizeMap = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
} as const;

export function Container({ size = 'default', className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-6 md:px-8', sizeMap[size], className)} {...props} />;
}
```

- [ ] **Step 5.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 6: Crear Link i18n wrapper y Button

**Files:**
- Create: `src/shared/ui/link.tsx`
- Create: `src/shared/ui/button.tsx`

- [ ] **Step 6.1: Crear Link**

Create `src/shared/ui/link.tsx`:
```typescript
export { Link } from '@/shared/i18n/navigation';
```

Este re-export hace que los componentes consuman un `Link` único desde `@/shared/ui/link` en lugar de importar de `next-intl` directamente.

- [ ] **Step 6.2: Crear Button con variants**

Create `src/shared/ui/button.tsx`:
```typescript
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'ghost' | 'link';
type Size = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantMap: Record<Variant, string> = {
  primary:
    'bg-[var(--fg-primary)] text-[var(--bg-primary)] hover:bg-[var(--fg-secondary)]',
  ghost:
    'bg-transparent text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]',
  link: 'bg-transparent text-[var(--fg-primary)] underline-offset-4 hover:underline',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-none font-mono uppercase tracking-[0.15em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50',
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6.3: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 7: Crear Tag atom

**Files:**
- Create: `src/shared/ui/tag.tsx`

- [ ] **Step 7.1: Crear Tag**

Create `src/shared/ui/tag.tsx`:
```typescript
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type TagProps = HTMLAttributes<HTMLSpanElement>;

export function Tag({ className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-[var(--fg-muted)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)]',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 7.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 8: Crear ThemeToggle client component

**Files:**
- Create: `src/shared/ui/theme-toggle.tsx`

- [ ] **Step 8.1: Crear ThemeToggle**

Create `src/shared/ui/theme-toggle.tsx`:
```typescript
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Props = {
  labelLight: string;
  labelDark: string;
  className?: string;
};

export function ThemeToggle({ labelLight, labelDark, className }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const nextLabel = isDark ? labelLight : labelDark;

  return (
    <button
      type="button"
      aria-label={nextLabel}
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-8 items-center gap-2 px-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        className,
      )}
    >
      <span aria-hidden="true">{mounted ? (isDark ? '◐' : '◑') : '◐'}</span>
      <span>{mounted ? (isDark ? 'dark' : 'light') : '—'}</span>
    </button>
  );
}
```

`suppressHydrationWarning` es necesario porque el server no conoce el tema. `mounted` evita pintar el label final hasta el client.

- [ ] **Step 8.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 9: Crear LocaleSwitcher client component

**Files:**
- Create: `src/shared/ui/locale-switcher.tsx`

- [ ] **Step 9.1: Crear LocaleSwitcher**

Create `src/shared/ui/locale-switcher.tsx`:
```typescript
'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/shared/i18n/navigation';
import { routing } from '@/shared/i18n/routing';
import { cn } from '@/shared/lib/cn';

type Props = {
  currentLocale: string;
  className?: string;
};

export function LocaleSwitcher({ currentLocale, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div className={cn('flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.15em]', className)}>
      {routing.locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            disabled={isActive || isPending}
            onClick={() => {
              startTransition(() => {
                router.replace(pathname, { locale });
              });
            }}
            className={cn(
              'h-8 px-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              isActive
                ? 'text-[var(--fg-primary)] underline underline-offset-4'
                : 'text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]',
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 9.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 10: Extender siteConfig con nav + socials y actualizar messages

**Files:**
- Modify: `src/shared/config/site.ts`
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`

- [ ] **Step 10.1: Extender siteConfig**

Reemplazar contenido de `src/shared/config/site.ts`:
```typescript
export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Senior Architect',
  description:
    'Portfolio personal de Juan Silva. Senior Architect, Google Developer Expert, Microsoft MVP. Construyendo software, enseñando gente, diseñando sistemas que perduran.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'juansilva',
    email: 'hello@juan-silva.dev',
    jobTitle: 'Senior Software Architect',
  },
  social: {
    github: 'https://github.com/juansilva',
    linkedin: 'https://linkedin.com/in/juansilva',
    twitter: 'https://twitter.com/juansilva',
  },
  nav: [
    { key: 'work', href: '/' },
    { key: 'writing', href: '/' },
    { key: 'talks', href: '/' },
    { key: 'about', href: '/' },
  ],
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
} as const;

export type SiteConfig = typeof siteConfig;
export type NavKey = (typeof siteConfig.nav)[number]['key'];
```

**Nota:** los `href: '/'` son placeholders. Fases siguientes los cambiarán a `/projects`, `/blog`, `/talks`, `/about` cuando esas rutas existan.

- [ ] **Step 10.2: Reescribir es.json**

Reemplazar `src/messages/es.json`:
```json
{
  "common": {
    "siteName": "Juan Silva",
    "siteTagline": "Senior Architect",
    "nav": {
      "work": "Trabajos",
      "writing": "Escritos",
      "talks": "Charlas",
      "about": "Sobre mí",
      "toggleMenu": "Abrir menú"
    },
    "theme": {
      "toLight": "Cambiar a tema claro",
      "toDark": "Cambiar a tema oscuro"
    },
    "footer": {
      "builtWith": "Construido con Next.js + Tailwind + demasiado café",
      "copyright": "© {year} Juan Silva. Todos los derechos reservados.",
      "rssLabel": "RSS"
    }
  },
  "home": {
    "hero": {
      "prompt": "whoami — portfolio · 2026",
      "title": "Juan Silva.",
      "subtitle": "Construyendo software, enseñando gente, diseñando sistemas que perduran."
    }
  },
  "placeholder": {
    "itWorks": "Funciona. Esta es la base del portfolio v2."
  }
}
```

- [ ] **Step 10.3: Reescribir en.json**

Reemplazar `src/messages/en.json`:
```json
{
  "common": {
    "siteName": "Juan Silva",
    "siteTagline": "Senior Architect",
    "nav": {
      "work": "Work",
      "writing": "Writing",
      "talks": "Talks",
      "about": "About",
      "toggleMenu": "Open menu"
    },
    "theme": {
      "toLight": "Switch to light theme",
      "toDark": "Switch to dark theme"
    },
    "footer": {
      "builtWith": "Built with Next.js + Tailwind + too much coffee",
      "copyright": "© {year} Juan Silva. All rights reserved.",
      "rssLabel": "RSS"
    }
  },
  "home": {
    "hero": {
      "prompt": "whoami — portfolio · 2026",
      "title": "Juan Silva.",
      "subtitle": "Building software, teaching people, designing systems that last."
    }
  },
  "placeholder": {
    "itWorks": "It works. This is the base of portfolio v2."
  }
}
```

- [ ] **Step 10.4: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 11: Crear Navbar server component

**Files:**
- Create: `src/shared/ui/navbar.tsx`

- [ ] **Step 11.1: Crear Navbar**

Create `src/shared/ui/navbar.tsx`:
```typescript
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/shared/config/site';
import { Container } from '@/shared/ui/container';
import { Link } from '@/shared/ui/link';
import { LocaleSwitcher } from '@/shared/ui/locale-switcher';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

type Props = {
  locale: string;
};

export async function Navbar({ locale }: Props) {
  const t = await getTranslations('common');

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--bg-tertiary)] bg-[var(--bg-primary)]/80 backdrop-blur">
      <Container size="wide">
        <nav className="flex h-14 items-center justify-between gap-6" aria-label="Primary">
          <Link
            href="/"
            className="font-serif text-lg font-normal tracking-tight text-[var(--fg-primary)] hover:text-[var(--fg-secondary)]"
          >
            {t('siteName')}
            <span className="text-[var(--accent)]">.</span>
          </Link>

          <ul className="hidden items-center gap-6 md:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle labelLight={t('theme.toLight')} labelDark={t('theme.toDark')} />
            <LocaleSwitcher currentLocale={locale} />
          </div>
        </nav>
      </Container>
    </header>
  );
}
```

- [ ] **Step 11.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0. Si falla por tipo del `href` de `Link`, es porque `typedRoutes` está activado — ajustar los `href` en siteConfig a `'/'` de momento (ya lo están).

---

## Task 12: Crear Footer server component

**Files:**
- Create: `src/shared/ui/footer.tsx`

- [ ] **Step 12.1: Crear Footer**

Create `src/shared/ui/footer.tsx`:
```typescript
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/shared/config/site';
import { Container } from '@/shared/ui/container';

export async function Footer() {
  const t = await getTranslations('common.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[var(--bg-tertiary)] py-10">
      <Container size="wide">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <p className="font-serif text-sm italic text-[var(--fg-tertiary)]">{t('builtWith')}</p>
          <ul className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-tertiary)]">
            <li>
              <a
                href={siteConfig.social.github}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                github
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                linkedin
              </a>
            </li>
            <li>
              <a
                href={siteConfig.social.twitter}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                twitter
              </a>
            </li>
          </ul>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
            {t('copyright', { year })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 12.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 13: Crear JSON-LD component

**Files:**
- Create: `src/shared/ui/json-ld.tsx`

- [ ] **Step 13.1: Crear JsonLd**

Create `src/shared/ui/json-ld.tsx`:
```typescript
type Props = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org JSON-LD is static trusted content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 13.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 14: Actualizar `[locale]/layout.tsx` — ThemeProvider + Navbar + Footer + JSON-LD + metadata

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 14.1: Leer estado actual**

Usar Read tool en `src/app/[locale]/layout.tsx`.

- [ ] **Step 14.2: Reescribir el layout completo**

Reemplazar contenido de `src/app/[locale]/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { siteConfig } from '@/shared/config/site';
import { routing } from '@/shared/i18n/routing';
import { Footer } from '@/shared/ui/footer';
import { JsonLd } from '@/shared/ui/json-ld';
import { Navbar } from '@/shared/ui/navbar';
import { ThemeProvider } from '@/shared/ui/theme-provider';
import '../globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

type MetadataProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: siteConfig.name,
      template: `%s — ${siteConfig.name}`,
    },
    description: siteConfig.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: '/es',
        en: '/en',
      },
    },
    openGraph: {
      type: 'profile',
      locale,
      url: `${siteConfig.url}/${locale}`,
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
      firstName: 'Juan',
      lastName: 'Silva',
      username: siteConfig.author.handle,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteConfig.name,
      description: siteConfig.description,
      creator: `@${siteConfig.author.handle}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.ico',
    },
    authors: [{ name: siteConfig.author.name, url: siteConfig.url }],
    creator: siteConfig.author.name,
    // Silence the unused `t` binding — will be used in later phases for localized titles.
    other: { 'x-i18n-ns': t('siteTagline') },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.author.name,
    url: siteConfig.url,
    email: siteConfig.author.email,
    jobTitle: siteConfig.author.jobTitle,
    sameAs: [siteConfig.social.github, siteConfig.social.linkedin, siteConfig.social.twitter],
  };

  const profilePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: siteConfig.name,
    url: `${siteConfig.url}/${locale}`,
    inLanguage: locale,
    about: personSchema,
  };

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            <Navbar locale={locale} />
            <div className="flex-1">{children}</div>
            <Footer />
          </NextIntlClientProvider>
          <JsonLd data={personSchema} />
          <JsonLd data={profilePageSchema} />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Notas:**
- `suppressHydrationWarning` en `<html>` porque next-themes agrega la clase `.dark` en client.
- El `t('siteTagline')` en `other` es para que biome no marque `t` como unused. Se eliminará cuando tengamos títulos localizados reales en Fases 3+.
- JSON-LD va fuera del `NextIntlClientProvider` para no re-renderear con navegación client-side.

- [ ] **Step 14.3: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

Si falla por `other.x-i18n-ns` no siendo string, cambiar a `other: { 'x-i18n-ns': String(t('siteTagline')) }`.

---

## Task 15: Actualizar `[locale]/page.tsx` para usar Container y tokens Tailwind

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 15.1: Leer estado actual**

Usar Read tool.

- [ ] **Step 15.2: Reescribir page.tsx**

Reemplazar contenido de `src/app/[locale]/page.tsx`:
```typescript
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home.hero');
  const tPlaceholder = await getTranslations('placeholder');

  return (
    <main>
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
        <div className="mt-16 max-w-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]/60 p-6 font-mono text-sm text-[var(--fg-tertiary)]">
          {tPlaceholder('itWorks')}
        </div>
      </Container>
    </main>
  );
}
```

**Cambios:** `[--var]` arbitrary selectors → `var(--var)` explícito (más robusto), usa `Container`, colores coherentes con dark mode.

- [ ] **Step 15.3: Typecheck + check**

```bash
pnpm typecheck && pnpm check
```
Expected: ambos exit 0.

---

## Task 16: Crear sitemap.ts

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 16.1: Crear sitemap**

Create `src/app/sitemap.ts`:
```typescript
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
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${siteConfig.url}/${l}`]),
      ),
    },
  }));
}
```

- [ ] **Step 16.2: Typecheck**

```bash
pnpm typecheck
```
Expected: exit 0.

---

## Task 17: Crear robots.ts

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 17.1: Crear robots**

Create `src/app/robots.ts`:
```typescript
import type { MetadataRoute } from 'next';
import { siteConfig } from '@/shared/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
```

- [ ] **Step 17.2: Typecheck + biome**

```bash
pnpm typecheck && pnpm check
```
Expected: ambos exit 0.

---

## Task 18: Verificación end-to-end

**Files:**
- (Ninguno — solo verificación)

- [ ] **Step 18.1: Typecheck completo**

```bash
pnpm typecheck
```
Expected: exit 0, sin errors.

- [ ] **Step 18.2: Biome check**

```bash
pnpm check
```
Expected: 0 issues. Si hay formatting issues, correr `pnpm check:fix`.

- [ ] **Step 18.3: Dev server**

```bash
pnpm dev
```
Esperar `✓ Ready in Xms`. NO seguir hasta que diga Ready.

- [ ] **Step 18.4: Verificar /es con curl**

```bash
curl -s http://localhost:3000/es | grep -oE "Juan Silva\.|Funciona|Trabajos|dark|light" | sort -u
```
Expected output incluye: `Funciona`, `Juan Silva.`, `Trabajos`, y `light` o `dark`.

- [ ] **Step 18.5: Verificar /en**

```bash
curl -s http://localhost:3000/en | grep -oE "Juan Silva\.|Building software|Work|Writing" | sort -u
```
Expected: `Building software`, `Juan Silva.`, `Work`, `Writing`.

- [ ] **Step 18.6: Verificar /sitemap.xml**

```bash
curl -s http://localhost:3000/sitemap.xml
```
Expected: XML con `<url><loc>https://juan-silva.dev/es</loc>...` y `<loc>https://juan-silva.dev/en</loc>`.

- [ ] **Step 18.7: Verificar /robots.txt**

```bash
curl -s http://localhost:3000/robots.txt
```
Expected: texto con `User-Agent: *`, `Allow: /`, `Disallow: /api/`, `Sitemap: https://juan-silva.dev/sitemap.xml`.

- [ ] **Step 18.8: Verificar JSON-LD presente**

```bash
curl -s http://localhost:3000/es | grep -c "application/ld+json"
```
Expected: `2` (Person + ProfilePage).

- [ ] **Step 18.9: Verificar el <html lang=es> sin flash de tema**

Abrir http://localhost:3000/es en browser:
1. Inspeccionar el DOM → `<html lang="es">` debe tener class con `fraunces_*`, `inter_*`, `jetbrains_mono_*`.
2. next-themes agrega `class="... light"` o `class="... dark"` en client — aceptable.
3. Click en el toggle de tema en la Navbar → el fondo cambia de cream (`#f5f1ea`) a dark brown (`#1a1208`) sin flash ni errores de hidratación.
4. Click en `EN` del LocaleSwitcher → debe navegar a `/en` y los textos cambian a inglés.
5. Recargar → el tema elegido persiste.

- [ ] **Step 18.10: Parar el dev server**

`Ctrl+C` en la terminal.

---

## Task 19: Commit con confirmación del usuario

**Files:**
- (Solo git)

- [ ] **Step 19.1: git status**

```bash
git status --short
```
Revisar que todos los archivos de la fase están presentes.

- [ ] **Step 19.2: Pedir confirmación**

**STOP y preguntar:** "Fase 1 terminada. Dark/light funciona sin flash, Navbar con LocaleSwitcher y ThemeToggle, Footer, sitemap, robots, JSON-LD Person+ProfilePage. Todo verifica. ¿Hago commit a `refactor/v2`?"

NO commit sin confirmación explícita.

- [ ] **Step 19.3: Si confirma, staging explícito**

```bash
git add package.json pnpm-lock.yaml src/app/globals.css src/app/[locale]/layout.tsx src/app/[locale]/page.tsx src/app/sitemap.ts src/app/robots.ts src/messages/ src/shared/config/site.ts src/shared/lib/ src/shared/ui/
```

- [ ] **Step 19.4: Commit**

```bash
git commit -m "feat: add theming, layout base, and SEO baseline

- next-themes with class strategy and no-flash via suppressHydrationWarning
- Dark mode tokens via @custom-variant dark + .dark selector (Tailwind 4)
- shared/ui atoms: Container, Link, Button, Tag, ThemeProvider
- ThemeToggle and LocaleSwitcher client components
- Navbar (server) with nav links, theme toggle, locale switcher
- Footer (server) with social links and copyright
- JSON-LD Person + ProfilePage schemas
- generateMetadata with OpenGraph, Twitter, alternates, robots
- sitemap.ts and robots.ts dynamic routes
- Extended siteConfig with nav items and author.jobTitle
- Extended messages with nav, theme, footer namespaces"
```

- [ ] **Step 19.5: Verificar commit**

```bash
git log --oneline -2
```
Expected: el commit nuevo arriba, bootstrap de Fase 0 abajo.

---

## Success Criteria (end of Fase 1)

- [ ] `pnpm typecheck` pasa con 0 errors
- [ ] `pnpm check` pasa con 0 issues
- [ ] `pnpm dev` arranca sin errors
- [ ] `/` redirige a `/es`, `/es` y `/en` renderean con Navbar + Footer + Hero
- [ ] Click en ThemeToggle cambia bg de cream a dark brown (y viceversa) sin flash
- [ ] Click en LocaleSwitcher navega entre `/es` y `/en` preservando el path
- [ ] `/sitemap.xml` responde con XML válido incluyendo ambos locales
- [ ] `/robots.txt` responde con allow /, disallow /api/, sitemap ref
- [ ] View-source de `/es` tiene 2 bloques `<script type="application/ld+json">` (Person + ProfilePage)
- [ ] Meta tags incluyen `og:type=profile`, `og:locale`, `twitter:card=summary_large_image`, `link rel=alternate hreflang`
- [ ] Recarga del browser preserva el tema elegido (next-themes localStorage)
- [ ] No hay hydration warnings en la consola del browser
- [ ] Commit creado en `refactor/v2`

## What's NOT in this plan (deferido)

- Rutas reales `/projects`, `/blog`, `/talks`, `/about` → Fases 3-4 (nav items quedan con `href: '/'` de momento)
- Content Collections + MDX → Fase 2
- Hero animation (variable font morph + particles) → Fase 3
- OG image dinámica → Fase 4 o 6
- Tests reales → Fase 6
- CI/Lighthouse budget → Fase 6

## Engram save at end of phase

Al completar Fase 1:
```
mem_save({
  title: "Portfolio v2 — Fase 1 Theming + Layout completed",
  type: "pattern",
  topic_key: "portfolio-v2/fase-1-theming",
  project: "portfolio-juan-silva",
  content: "..."
})
```
Y `mem_session_summary` con Goal / Accomplished / Discoveries / Next Steps / Relevant Files.

---

## Self-Review Notes

**Spec coverage (Fase 1 scope):**
- ✅ Dark/light theming sin flash (next-themes + @custom-variant dark + suppressHydrationWarning)
- ✅ Paleta dark complementaria a warm editorial
- ✅ Shared/ui base components (Container, Link, Button, Tag, ThemeToggle, LocaleSwitcher)
- ✅ Navbar + Footer server components + i18n
- ✅ SEO: generateMetadata con OG/Twitter/alternates/robots
- ✅ JSON-LD Person + ProfilePage
- ✅ sitemap.ts + robots.ts
- ⏳ Rutas internas /projects /blog /talks → diferidas a fases siguientes (href placeholders)
- ⏳ OG image dinámica → diferida

**Placeholder scan:** `href: '/'` en siteConfig.nav es un placeholder consciente documentado. No hay "TBD", "fill in details", ni steps sin código.

**Type consistency:** `routing` exportado en `routing.ts`, consumido en `request.ts`, `navigation.ts`, `locale-switcher.tsx`, `layout.tsx`, `sitemap.ts`. `siteConfig` exportado en `site.ts`, consumido en `layout.tsx`, `navbar.tsx`, `footer.tsx`, `sitemap.ts`, `robots.ts`. `cn` en `lib/cn.ts`, consumido en todos los UI components. `ThemeProvider`, `Navbar`, `Footer`, `JsonLd` → imports consistentes desde `@/shared/ui/*`.

**Ambiguity:** Step 19.2 requiere confirmación del usuario antes de commit — explícito. Todo lo demás es determinístico.
