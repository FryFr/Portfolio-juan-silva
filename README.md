# Juan Silva — Portfolio v2

Personal portfolio and digital presence for **Juan Silva**, Mechatronics Engineer & AI Specialist.

**Live:** [portfolio-juan-silva-eight.vercel.app](https://portfolio-juan-silva-eight.vercel.app)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + RSC) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 (Oxide engine) |
| Content | Content Collections + MDX |
| i18n | next-intl v4 (`/es`, `/en`) |
| Theme | next-themes (dark / light) |
| Animation | Motion (Framer Motion v12+) |
| Lint / Format | Biome |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright + axe-core a11y |
| CI | GitHub Actions |
| Deploy | Vercel (Analytics + Speed Insights) |

## Architecture

Feature-based with **screaming architecture** — each domain has its own directory under `src/features/`.

```
src/
  app/[locale]/             # i18n routes (es | en)
  features/
    hero/                   # Landing hero + role rotator
    about/                  # Bio, skills grid, timeline, soft skills
    projects/               # Project cards + grid
    case-study/             # MDX renderer for project detail
    blog/                   # Blog posts + related posts
    talks/                  # Talks & workshops
    contact/                # WhatsApp + LinkedIn CTAs
    cursor/                 # Cursor interaction system
      context/              #   Global cursor position provider
      effects/              #   DistortHeading, ProximityReveal
      ui/                   #   Morphing blob, spotlight glow
  shared/
    ui/                     # Reusable atoms (Button, Container, Tag)
    lib/                    # Utilities (cn, formatDate)
    config/                 # Site config, contact helpers
    i18n/                   # next-intl routing + request config
    mdx/                    # MDX component map, callouts, code blocks
    content/                # Content collection helpers + filters
content/
  projects/*.mdx            # 13 projects (en + es)
  posts/*.mdx               # Blog posts (en + es)
  talks/*.mdx               # Conference talks (en + es)
```

**Patterns:**
- Server Components by default, `'use client'` only where needed
- Container / Presentational separation per feature
- Content Collections with Zod schemas for type-safe MDX
- Zero global state — URL + server state only

## Cursor Interaction System

Custom cursor effects built with `requestAnimationFrame` loops and `IntersectionObserver` for performance:

- **Morphing blob** — follows cursor with spring physics, morphs shape via SVG filter
- **Spotlight glow** — dual-layer radial gradient that illuminates content near cursor
- **DistortHeading** — per-character gravity distortion on headings (distance-based)
- **ProximityReveal** — text glows warm gold as cursor approaches (edge-distance calculation)

All effects respect `prefers-reduced-motion` and disable on touch devices.

## Getting Started

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000` — redirects to `/es` by default.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript type check |
| `pnpm check` | Biome lint + format |
| `pnpm check:fix` | Auto-fix Biome issues |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright E2E + a11y tests |
| `pnpm lhci` | Lighthouse CI budget audit |

## CI Pipeline

GitHub Actions runs on every push to `main` and `refactor/**`:

1. **Lint, typecheck, unit tests** — content-collections build, tsc, Biome, Vitest
2. **Playwright E2E + a11y** — production build smoke test, Playwright with axe-core WCAG 2.1 AA
3. **Lighthouse CI budget** — performance, a11y, best practices, SEO (threshold: 0.95)

## Content

All content lives in `content/` as MDX files with Zod-validated frontmatter. Each file is suffixed with its locale (`.en.mdx`, `.es.mdx`).

**Projects (13):** N8N Automations, Dynapro Tracking System, Zoho AI Automation, Robotic Arm, MichiBot, Smart Orchard, Milu Web, Krea Catalog, Val Verso, Personal Finances, Sistema de Llenado, Sensor de Distancia, Diomedes Chan.

**Blog posts (2):** De Mecatronica a IA, IA en ITSM.

**Talks (2):** ManageEngine Partner Training 2024, ManageEngine Partner Training 2025.

## License

Personal portfolio. All content and images are copyright Juan Silva.
