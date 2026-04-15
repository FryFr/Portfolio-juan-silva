# Portfolio v2 — Fase 5: Contact Section + Floating WhatsApp + Footer Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a direct-contact section (WhatsApp + LinkedIn, no email form), a persistent-but-subtle floating WhatsApp button, and a polished footer — all bilingual.

**Architecture:** Contact is a static Server Component section composed at the end of the home page. The WA/LinkedIn links are deep-links built from `siteConfig.contact` with a locale-aware prefilled WA message. A client island (`<FloatingWhatsApp />`) renders a fixed-position anchor, hidden on narrow screens until scroll, dismissible for the session. Footer gets a compact social column and a "last updated" block driven by a generated build timestamp. Achievements section is explicitly NOT built — per Juan's call it adds noise.

**Commit policy:** NO commits inside batches. Each batch ends with `pnpm typecheck` + `pnpm biome check` to keep the working tree valid. A single final commit lands at the end of Batch H once everything passes.

**Tech Stack:** Next.js 16 App Router · React 19 · next-intl 4 · Tailwind 4 · TypeScript strict · Biome 2.

---

## File Structure

**Create:**
- `src/shared/config/contact.ts` — single source of truth for phone, LinkedIn, formatters
- `src/shared/config/contact.test.ts` — Vitest unit tests for `buildWhatsAppUrl` and `buildLinkedInUrl`
- `src/features/contact/ui/contact-section.tsx` — server component, big headline + copy + CTA row
- `src/features/contact/ui/contact-button.tsx` — server component, shared CTA button shell (WA/LinkedIn variants)
- `src/features/contact/ui/floating-whatsapp.tsx` — client island, fixed bottom-right, dismissible
- `src/features/contact/lib/session-dismiss.ts` — tiny hook wrapper over `sessionStorage` with SSR guard

**Modify:**
- `src/shared/config/site.ts` — add `contact: { whatsappE164, linkedin }` block. Remove the stale `author.email` (no email flow).
- `src/messages/es.json` — add `contact` namespace (heading, copy, CTA labels, floating button label, dismissal aria-label) and `footer.lastUpdated`
- `src/messages/en.json` — mirror
- `src/shared/ui/footer.tsx` — add `lastUpdated` line and WhatsApp to social row; build timestamp injected via env
- `src/app/[locale]/page.tsx` — mount `<ContactSection />` after `<ProjectsGrid />`
- `src/app/[locale]/layout.tsx` — mount `<FloatingWhatsApp />` once so it appears on every page
- `next.config.ts` — expose `NEXT_PUBLIC_BUILD_TIMESTAMP` env var (ISO string, set at config load)

**Not built (scope decision):**
- Achievements section — killed per user decision, seniority already evidenced in About/Timeline
- Contact form + Resend + React Email + rate limiting — killed, direct channels only

---

## Content decisions (locked in the plan, not placeholders)

- **WhatsApp number (E.164, no `+`, no spaces):** `573161309551`
- **LinkedIn URL:** `https://www.linkedin.com/in/jsilva-medina/` (already in `siteConfig.social.linkedin`)
- **WA prefilled message (es):** `Hola Juan, te escribo desde tu portfolio. Me gustaría charlar sobre...`
- **WA prefilled message (en):** `Hi Juan, I'm reaching out from your portfolio. I'd love to chat about...`
- **Contact section heading (es):** `¿Hablamos?`
- **Contact section heading (en):** `Let's talk`
- **Contact section copy (es):** `Arquitectura, mentorías, charlas, proyectos ambiciosos — o simplemente una conversación honesta sobre software. Escribime por el canal que prefieras.`
- **Contact section copy (en):** `Architecture, mentoring, talks, ambitious projects — or simply an honest conversation about software. Reach me through whichever channel you prefer.`
- **WA CTA label (es):** `Escribime por WhatsApp`
- **WA CTA label (en):** `Message me on WhatsApp`
- **LinkedIn CTA label (es):** `Conectá en LinkedIn`
- **LinkedIn CTA label (en):** `Connect on LinkedIn`
- **Floating button aria-label (es):** `Abrir conversación por WhatsApp`
- **Floating button aria-label (en):** `Open WhatsApp conversation`
- **Floating button dismiss aria-label (es):** `Ocultar botón de WhatsApp`
- **Floating button dismiss aria-label (en):** `Hide WhatsApp button`
- **Footer last-updated label (es):** `Última actualización`
- **Footer last-updated label (en):** `Last updated`

---

## Task Batches

### Batch A — Contact config + WA/LinkedIn URL builders (TDD)

**Files:**
- Create: `src/shared/config/contact.ts`
- Create: `src/shared/config/contact.test.ts`
- Modify: `src/shared/config/site.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/config/contact.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CONTACT, buildLinkedInUrl, buildWhatsAppUrl } from './contact';

describe('contact config', () => {
  it('exposes the WhatsApp number in E.164 without leading +', () => {
    expect(CONTACT.whatsappE164).toBe('573161309551');
    expect(CONTACT.whatsappE164.startsWith('+')).toBe(false);
  });

  it('exposes the LinkedIn profile URL', () => {
    expect(CONTACT.linkedin).toBe('https://www.linkedin.com/in/jsilva-medina/');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me URL with a url-encoded prefilled message', () => {
    const url = buildWhatsAppUrl('Hola Juan, probando el portfolio');
    expect(url).toBe(
      'https://wa.me/573161309551?text=Hola%20Juan%2C%20probando%20el%20portfolio',
    );
  });

  it('omits the text param when message is empty', () => {
    expect(buildWhatsAppUrl('')).toBe('https://wa.me/573161309551');
  });

  it('handles emoji and accented characters', () => {
    const url = buildWhatsAppUrl('Hola 👋 árbol');
    expect(url).toContain('https://wa.me/573161309551?text=');
    expect(url).toContain(encodeURIComponent('Hola 👋 árbol'));
  });
});

describe('buildLinkedInUrl', () => {
  it('returns the profile URL as-is', () => {
    expect(buildLinkedInUrl()).toBe('https://www.linkedin.com/in/jsilva-medina/');
  });
});
```

- [ ] **Step 2: Run the test — must fail**

```bash
pnpm vitest run src/shared/config/contact.test.ts
```
Expected: FAIL — module `./contact` does not exist.

- [ ] **Step 3: Implement `contact.ts`**

Create `src/shared/config/contact.ts`:

```ts
export const CONTACT = {
  whatsappE164: '573161309551',
  linkedin: 'https://www.linkedin.com/in/jsilva-medina/',
} as const;

export function buildWhatsAppUrl(message: string): string {
  const base = `https://wa.me/${CONTACT.whatsappE164}`;
  if (message.length === 0) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildLinkedInUrl(): string {
  return CONTACT.linkedin;
}
```

- [ ] **Step 4: Run tests — must pass**

```bash
pnpm vitest run src/shared/config/contact.test.ts
```
Expected: 5 tests pass.

- [ ] **Step 5: Wire into `siteConfig` and drop stale `author.email`**

Edit `src/shared/config/site.ts`:
- Add `import { CONTACT } from './contact';` at top.
- Remove the `author.email: 'hello@juan-silva.dev'` line.
- Add a `contact: CONTACT,` property alongside `social`.

Resulting `siteConfig` literal should look like:

```ts
import { CONTACT } from './contact';

export const siteConfig = {
  name: 'Juan Silva',
  title: 'Juan Silva — Senior Architect',
  description:
    'Portfolio personal de Juan Silva. Senior Architect, Google Developer Expert, Microsoft MVP. Construyendo software, enseñando gente, diseñando sistemas que perduran.',
  url: 'https://juan-silva.dev',
  author: {
    name: 'Juan Silva',
    handle: 'FryFr',
    jobTitle: 'Senior Software Architect',
  },
  social: {
    github: 'https://github.com/FryFr',
    linkedin: 'https://www.linkedin.com/in/jsilva-medina/',
  },
  contact: CONTACT,
  nav: [
    { key: 'work', path: '/projects' },
    { key: 'writing', path: '/blog' },
    { key: 'talks', path: '/talks' },
    { key: 'about', path: '/#about' },
  ],
  locales: ['es', 'en'] as const,
  defaultLocale: 'es' as const,
} as const;

export type SiteConfig = typeof siteConfig;
export type NavKey = (typeof siteConfig.nav)[number]['key'];
```

- [ ] **Step 6: Verify no stale email references**

```bash
pnpm exec rg "hello@juan-silva.dev|author\.email" src
```
Expected: zero matches.

- [ ] **Step 7: Typecheck + Biome**

```bash
pnpm typecheck
pnpm biome check src/shared/config
```
Expected: both clean. **Do NOT commit — single commit at the end of Batch H.**

---

### Batch B — i18n messages for contact + footer

**Files:**
- Modify: `src/messages/es.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Extend `src/messages/es.json`**

Add a new top-level `contact` namespace as a sibling of existing top-level keys (`common`, `home`, `projects`, `blog`, `talks`):

```json
"contact": {
  "eyebrow": "Contacto",
  "heading": "¿Hablamos?",
  "copy": "Arquitectura, mentorías, charlas, proyectos ambiciosos — o simplemente una conversación honesta sobre software. Escribime por el canal que prefieras.",
  "whatsappLabel": "Escribime por WhatsApp",
  "whatsappMessage": "Hola Juan, te escribo desde tu portfolio. Me gustaría charlar sobre...",
  "linkedinLabel": "Conectá en LinkedIn",
  "floating": {
    "open": "Abrir conversación por WhatsApp",
    "dismiss": "Ocultar botón de WhatsApp"
  }
}
```

Also add to the existing `common.footer` object a new key:

```json
"lastUpdated": "Última actualización {date}"
```

(add it as a sibling of `builtWith`, `copyright`, `rssLabel`.)

- [ ] **Step 2: Mirror in `src/messages/en.json`**

```json
"contact": {
  "eyebrow": "Contact",
  "heading": "Let's talk",
  "copy": "Architecture, mentoring, talks, ambitious projects — or simply an honest conversation about software. Reach me through whichever channel you prefer.",
  "whatsappLabel": "Message me on WhatsApp",
  "whatsappMessage": "Hi Juan, I'm reaching out from your portfolio. I'd love to chat about...",
  "linkedinLabel": "Connect on LinkedIn",
  "floating": {
    "open": "Open WhatsApp conversation",
    "dismiss": "Hide WhatsApp button"
  }
}
```

And in `common.footer`:

```json
"lastUpdated": "Last updated {date}"
```

- [ ] **Step 3: Verify JSON parses**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/messages/es.json','utf8')); console.log('es ok')"
node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); console.log('en ok')"
```
Expected: `es ok` and `en ok`.

- [ ] **Step 4: Typecheck**

```bash
pnpm typecheck
```
Expected: clean. **Do NOT commit.**

---

### Batch C — ContactButton shared shell

**Files:**
- Create: `src/features/contact/ui/contact-button.tsx`

- [ ] **Step 1: Implement the button**

```tsx
// src/features/contact/ui/contact-button.tsx
import type { ReactNode } from 'react';

type Variant = 'whatsapp' | 'linkedin';

type Props = {
  href: string;
  variant: Variant;
  children: ReactNode;
  ariaLabel?: string;
};

const VARIANT_STYLES: Record<Variant, string> = {
  whatsapp:
    'bg-[var(--accent)] text-[var(--bg-primary)] hover:brightness-110 focus-visible:ring-[var(--accent)]',
  linkedin:
    'border border-[var(--bg-tertiary)] text-[var(--fg-primary)] hover:border-[var(--accent)] focus-visible:ring-[var(--fg-tertiary)]',
};

export function ContactButton({ href, variant, children, ariaLabel }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-3 rounded-sm px-6 py-3 font-mono text-xs uppercase tracking-[0.15em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] ${VARIANT_STYLES[variant]}`}
    >
      {children}
    </a>
  );
}
```

- [ ] **Step 2: Typecheck + Biome**

```bash
pnpm typecheck && pnpm biome check src/features/contact/ui/contact-button.tsx
```
Expected: clean. **Do NOT commit.**

---

### Batch D — Contact section (server component)

**Files:**
- Create: `src/features/contact/ui/contact-section.tsx`
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Implement the contact section**

```tsx
// src/features/contact/ui/contact-section.tsx
import { getTranslations } from 'next-intl/server';
import { Container } from '@/shared/ui/container';
import { buildLinkedInUrl, buildWhatsAppUrl } from '@/shared/config/contact';
import { ContactButton } from './contact-button';

export async function ContactSection() {
  const t = await getTranslations('contact');
  const whatsappHref = buildWhatsAppUrl(t('whatsappMessage'));
  const linkedinHref = buildLinkedInUrl();

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="mt-32 border-t border-[var(--bg-tertiary)] py-20"
    >
      <Container size="wide">
        <div className="flex flex-col gap-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('eyebrow')}
          </p>
          <h2
            id="contact-heading"
            className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
          >
            {t('heading')}
          </h2>
          <p className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)] md:text-xl">
            {t('copy')}
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-4">
            <li>
              <ContactButton href={whatsappHref} variant="whatsapp">
                {t('whatsappLabel')}
              </ContactButton>
            </li>
            <li>
              <ContactButton href={linkedinHref} variant="linkedin">
                {t('linkedinLabel')}
              </ContactButton>
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Mount on the home page**

Edit `src/app/[locale]/page.tsx` — add the import and the section:

```tsx
import { setRequestLocale } from 'next-intl/server';
import { About } from '@/features/about/ui/about';
import { ContactSection } from '@/features/contact/ui/contact-section';
import { Hero } from '@/features/hero/ui/hero';
import { ProjectsGrid } from '@/features/projects/ui/projects-grid';
import type { Locale } from '@/shared/i18n/routing';

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
      <ContactSection />
    </main>
  );
}
```

- [ ] **Step 3: Typecheck + Biome**

```bash
pnpm typecheck
pnpm biome check src/features/contact "src/app/[locale]/page.tsx"
```
Expected: clean. **Do NOT commit.**

---

### Batch E — Floating WhatsApp button (dismissible client island)

**Files:**
- Create: `src/features/contact/lib/session-dismiss.ts`
- Create: `src/features/contact/ui/floating-whatsapp.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Implement the session-dismiss hook**

```tsx
// src/features/contact/lib/session-dismiss.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

export function useSessionDismiss(key: string) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(key) === '1') {
        setDismissed(true);
      }
    } catch {
      // sessionStorage may be unavailable in some browsers (Safari private mode)
    }
  }, [key]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(key, '1');
    } catch {
      // ignore
    }
  }, [key]);

  return { dismissed, dismiss };
}
```

- [ ] **Step 2: Implement the floating button**

```tsx
// src/features/contact/ui/floating-whatsapp.tsx
'use client';

import { useEffect, useState } from 'react';
import { buildWhatsAppUrl } from '@/shared/config/contact';
import { useSessionDismiss } from '../lib/session-dismiss';

type Props = {
  message: string;
  openLabel: string;
  dismissLabel: string;
};

const SCROLL_THRESHOLD_PX = 320;

export function FloatingWhatsApp({ message, openLabel, dismissLabel }: Props) {
  const { dismissed, dismiss } = useSessionDismiss('floating-wa');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handle() {
      setVisible(window.scrollY > SCROLL_THRESHOLD_PX);
    }
    handle();
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  if (dismissed) return null;

  const href = buildWhatsAppUrl(message);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 transition-opacity duration-300 ${
        visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={openLabel}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg-primary)] shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="currentColor"
        >
          <path d="M20.52 3.48A11.8 11.8 0 0 0 12.06 0C5.5 0 .14 5.36.14 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.64a11.87 11.87 0 0 0 5.78 1.48h.01c6.56 0 11.92-5.36 11.92-11.92 0-3.19-1.24-6.19-3.47-8.44ZM12.07 21.8h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.73.98.99-3.64-.23-.37a9.88 9.88 0 0 1-1.52-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.45-4.44 9.87-9.9 9.87Zm5.43-7.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.47.13-.62.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.27-.2-.57-.35Z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={dismissLabel}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--fg-tertiary)] text-xs shadow hover:text-[var(--fg-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg-tertiary)]"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Mount in the locale layout**

Find `src/app/[locale]/layout.tsx`. Add these imports near the existing next-intl/server imports:

```tsx
import { getTranslations } from 'next-intl/server';
import { FloatingWhatsApp } from '@/features/contact/ui/floating-whatsapp';
```

Inside the layout's async function body (before returning JSX), fetch the translations needed:

```tsx
const tContact = await getTranslations('contact');
```

In the JSX returned by the layout, add `<FloatingWhatsApp ... />` immediately before the closing `</body>` (or inside the existing outermost wrapper that represents the page chrome — place it as a sibling of `<Navbar />` and `<Footer />`, right after `<Footer />`):

```tsx
<FloatingWhatsApp
  message={tContact('whatsappMessage')}
  openLabel={tContact('floating.open')}
  dismissLabel={tContact('floating.dismiss')}
/>
```

If the layout signature does not already provide `locale` via params for translations — check the file first, it was set up in Fase 1. `getTranslations` without an explicit locale arg uses `setRequestLocale` from the layout.

- [ ] **Step 4: Typecheck + Biome**

```bash
pnpm typecheck
pnpm biome check src/features/contact "src/app/[locale]/layout.tsx"
```
Expected: clean. **Do NOT commit.**

---

### Batch F — Footer polish: lastUpdated + WA link

**Files:**
- Modify: `next.config.ts`
- Modify: `src/shared/ui/footer.tsx`

- [ ] **Step 1: Expose the build timestamp as a public env var**

Edit `next.config.ts`. Somewhere near the top of the config object (before `withNextIntl`/`withContentCollections` wrapping), add:

```ts
process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ??= new Date().toISOString();
```

Then inside the `nextConfig` object, ensure `env` includes it:

```ts
env: {
  NEXT_PUBLIC_BUILD_TIMESTAMP: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP,
},
```

If the existing `nextConfig` object already has an `env` block, merge this key into it. If it does not have one, add the `env` block as a top-level property of `nextConfig`.

- [ ] **Step 2: Update the footer to consume it and show WA**

Replace `src/shared/ui/footer.tsx` with:

```tsx
import { getLocale, getTranslations } from 'next-intl/server';
import { siteConfig } from '@/shared/config/site';
import { buildWhatsAppUrl } from '@/shared/config/contact';
import { Container } from '@/shared/ui/container';

function formatUpdatedDate(iso: string | undefined, locale: string): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date());
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export async function Footer() {
  const t = await getTranslations('common.footer');
  const tContact = await getTranslations('contact');
  const locale = await getLocale();
  const year = new Date().getFullYear();
  const updated = formatUpdatedDate(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP, locale);
  const whatsappHref = buildWhatsAppUrl(tContact('whatsappMessage'));

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
                href={whatsappHref}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-[var(--fg-primary)]"
              >
                whatsapp
              </a>
            </li>
          </ul>
          <div className="flex flex-col items-start gap-1 md:items-end">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
              {t('copyright', { year })}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--fg-muted)]">
              {t('lastUpdated', { date: updated })}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 3: Typecheck + Biome**

```bash
pnpm typecheck
pnpm biome check src/shared/ui/footer.tsx next.config.ts
```
Expected: clean. **Do NOT commit.**

---

### Batch G — Verification gate

- [ ] **Step 1: Full typecheck + biome on the whole repo**

```bash
pnpm typecheck
pnpm biome check
```
Expected: both clean. Zero errors.

- [ ] **Step 2: Run unit tests**

```bash
pnpm vitest run
```
Expected: `contact.test.ts` — 5 passing. No regressions in other suites.

- [ ] **Step 3: Clean caches and start dev**

```bash
rm -rf .next .content-collections
pnpm dev
```

Wait until the log shows `Ready in` and `finished build of 3 collections`.

- [ ] **Step 4: Home route smoke**

For both locales:

```bash
curl -s -o /tmp/home-es.html -w "%{http_code}\n" http://localhost:3000/es
curl -s -o /tmp/home-en.html -w "%{http_code}\n" http://localhost:3000/en
```
Expected: `200` twice.

Then grep each for the contact heading:

```bash
grep -oE '¿Hablamos\?' /tmp/home-es.html
grep -oE "Let's talk" /tmp/home-en.html
```
Expected: both print one match.

- [ ] **Step 5: WhatsApp URL present and correctly encoded**

```bash
grep -oE 'https://wa.me/573161309551\?text=[^"]+' /tmp/home-es.html | head -1
grep -oE 'https://wa.me/573161309551\?text=[^"]+' /tmp/home-en.html | head -1
```
Expected: each prints one URL-encoded wa.me link. The ES one must contain `Hola` (url-encoded), the EN one must contain `Hi`.

- [ ] **Step 6: LinkedIn URL present**

```bash
grep -oE 'https://www\.linkedin\.com/in/jsilva-medina/' /tmp/home-es.html | head -1
```
Expected: one match.

- [ ] **Step 7: Floating WA button markup present**

```bash
grep -oE 'aria-label="(Abrir conversación por WhatsApp|Open WhatsApp conversation)"' /tmp/home-es.html /tmp/home-en.html
```
Expected: both files show one match each.

- [ ] **Step 8: Footer "last updated" line rendered**

```bash
grep -oE '(Última actualización|Last updated)' /tmp/home-es.html /tmp/home-en.html
```
Expected: `Última actualización` in the es file, `Last updated` in the en file.

- [ ] **Step 9: Turbopack chunk smoke test**

```bash
curl -s http://localhost:3000/es > /tmp/page.html
curl -s http://localhost:3000/es/projects > /tmp/projects.html

# Sample two large chunks
for c in $(grep -oE '/_next/static/chunks/[^"]+\.js' /tmp/page.html | sort -u | head -5); do
  curl -s "http://localhost:3000$c" > /tmp/chunk.js
  size=$(wc -c < /tmp/chunk.js)
  hits=$(grep -c "An unexpected Turbopack error" /tmp/chunk.js)
  echo "$size hits=$hits $c"
done
```
Expected: every `hits=0`. At least one chunk over 100000 bytes.

- [ ] **Step 10: Server log scan**

Check the dev server log file for non-`[Browser]` error lines:

```bash
grep -iE "error|failed|exception" <dev-log-path> | grep -v "\[Browser\]" | head
```
Expected: zero output. If any line appears, investigate before completing Batch G.

- [ ] **Step 11: Manual browser check**

Open these in a real browser in both `es` and `en`:
- `/` — contact section visible at the bottom, CTAs styled, heading readable.
- Scroll ~400px down — floating WA button fades in at bottom-right.
- Click the `×` next to the floating button — it disappears. Refresh — still dismissed (sessionStorage). Open a new tab — reappears.
- Click the WA CTA — opens `wa.me/573161309551?text=...` in a new tab with the prefilled message.
- Click the LinkedIn CTA — opens the profile in a new tab.
- Footer shows: built-with, github/linkedin/whatsapp, copyright, last updated.

- [ ] **Step 12: Kill dev server**

Stop the background dev server before moving on. Batch G is a gate, not a code batch — do NOT commit here.

---

### Batch H — Single Fase 5 commit

All previous batches left the working tree clean (typecheck + biome passing) but uncommitted. This batch lands one conventional commit covering the entire fase.

- [ ] **Step 1: Confirm working tree is healthy**

```bash
pnpm typecheck
pnpm biome check
pnpm vitest run
```
Expected: all clean, `contact.test.ts` 5/5 passing.

- [ ] **Step 2: Review what is about to be committed**

```bash
git status --short
```

Expected (order may vary):
- `M  next.config.ts`
- `M  src/app/[locale]/layout.tsx`
- `M  src/app/[locale]/page.tsx`
- `M  src/messages/en.json`
- `M  src/messages/es.json`
- `M  src/shared/config/site.ts`
- `M  src/shared/ui/footer.tsx`
- `??  src/features/contact/` (whole new folder)
- `??  src/shared/config/contact.ts`
- `??  src/shared/config/contact.test.ts`
- `??  docs/superpowers/plans/2026-04-15-portfolio-v2-fase-5-contact-footer.md`

If anything unexpected shows up, investigate before committing.

- [ ] **Step 3: Stage everything Fase 5 touched**

```bash
git add \
  next.config.ts \
  "src/app/[locale]/layout.tsx" \
  "src/app/[locale]/page.tsx" \
  src/messages/en.json \
  src/messages/es.json \
  src/shared/config/site.ts \
  src/shared/config/contact.ts \
  src/shared/config/contact.test.ts \
  src/shared/ui/footer.tsx \
  src/features/contact \
  docs/superpowers/plans/2026-04-15-portfolio-v2-fase-5-contact-footer.md
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(fase-5): contact section, floating whatsapp, footer polish"
```

- [ ] **Step 5: Verify**

```bash
git log -1 --stat
```
Expected: one commit listing every file from Step 2.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| The floating button competes visually with the CTA in the contact section | Only shows after 320px scroll, dismissible per session, uses same `--accent` color so it reads as one visual family |
| `sessionStorage` unavailable (Safari private mode, iframe sandbox) | Hook wraps access in try/catch; fallback = button stays visible, never crashes |
| `NEXT_PUBLIC_BUILD_TIMESTAMP` changes on every dev restart, noisy in git | Var lives in `next.config.ts`, never committed; footer only reads `process.env` at SSR time |
| WA prefilled message exceeds a reasonable length and looks ugly | Locked at ~90 chars; documented in the content decisions block above |
| Users on desktop without WhatsApp get frustrated | `wa.me` links open web.whatsapp.com in desktop — standard Meta flow, nothing to do from our side |
| next-intl's Link in the navbar vs. external `<a>` in contact | Contact buttons are plain `<a target="_blank">` because they link to external domains — correct pattern, no confusion |

## Self-review notes

- **Spec coverage:** contact config ✅ (Batch A), i18n ✅ (B), shared button ✅ (C), section mounted on home ✅ (D), floating button ✅ (E), footer polish ✅ (F), verification ✅ (G). Achievements section intentionally absent. Email/Resend/form intentionally absent.
- **Type consistency:** `CONTACT`, `buildWhatsAppUrl`, `buildLinkedInUrl` used consistently across Batches A/D/E/F. `siteConfig.contact` points to the same `CONTACT` object — single source of truth. Translation keys `contact.*` and `common.footer.lastUpdated` used identically everywhere they appear.
- **Placeholder scan:** every code block is concrete. No "TBD", no "similar to Task N", no vague "add validation".
- **No fantasy imports:** `@/shared/config/contact`, `@/shared/i18n/routing`, `@/features/contact/ui/contact-button`, `Container` from `@/shared/ui/container` — all either exist in the repo or are created in an earlier batch of this plan.
