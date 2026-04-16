# Portfolio Juan Silva v2 — Design Spec

**Date:** 2026-04-14
**Author:** Juan Silva (with Claude)
**Status:** Draft — pending user review

---

## 1. Purpose

Rewrite completo del portfolio personal de Juan Silva para reflejar su seniority real (Senior Architect 15+ años, GDE, MVP, teacher). El portfolio actual (Next 13, JS, 2 años sin tocar, SEO boilerplate, a11y floja, contenido desactualizado) no cumple esa función. Este documento define el sistema visual y estructural del v2; el plan de implementación técnica se deriva de acá en un paso siguiente.

**Outcome esperado:** portfolio moderno bilingüe, con blog técnico en MDX, case studies profundos, talks section, estética editorial cálida con identidad técnica, arquitectura feature-based en Next.js 15 + TypeScript strict, Lighthouse ≥ 95 en los cuatro ejes.

## 2. Visual Direction

### 2.1 Mood — "Warm Editorial + Dev Touches"

Base editorial cálida (craft, autoría, 15+ años) con accents técnicos selectivos (identidad dev sin cliché terminal).

**Lo que es:**
- Serif display dominante (Fraunces o similar) para headlines — itálico protagonista
- Paleta cálida off-white/cream, negros cálidos, acentos sepia/terracota
- Whitespace generoso, tipografía como elemento estructural
- JetBrains Mono para micro-details técnicos (labels, metadata, prompts, TOC, status)
- Micro-elementos CLI sutiles (`$ whoami`, `→`, `● status`) como accents puntuales

**Lo que NO es:**
- No dark-first (light-first con opcional dark mode)
- No grid brutalist expuesto
- No accent chillón flat (indigo, azul vivo)
- No ASCII art ni terminal completo
- No gradientes decorativos

### 2.2 Tipografía

| Uso | Familia | Variantes |
|---|---|---|
| Display / Headlines | **Fraunces** (serif variable) | Regular 400, Light 300, Italic — opsz para escalar |
| Body UI / Nav | **Inter** (sans variable) | Regular, Medium |
| Metadata / Code / Labels | **JetBrains Mono** | Regular, Medium |

**Fallbacks:** `Georgia, serif` · `-apple-system, sans-serif` · `ui-monospace, monospace`

**Escala (clamp, light-mode base):**
- Display XL (hero): `clamp(64px, 10vw, 120px)` · Fraunces 400 · line-height 0.86 · letter-spacing -0.04em
- Display L (case study title): `clamp(48px, 7vw, 88px)` · Fraunces 400 · line-height 0.88
- Display M (section headers): `clamp(28px, 3.5vw, 44px)` · Fraunces 400 · line-height 1.05
- Body L (deck, lead): `clamp(18px, 1.8vw, 24px)` · Fraunces 300 italic
- Body M (prose): `15-17px` · Fraunces 400 · line-height 1.65 (reading column)
- UI M: `13-15px` · Inter 400
- Label / Meta: `10-11px` · JetBrains Mono · letter-spacing 0.15em · uppercase

### 2.3 Paleta

**Light mode (default):**

| Token | Value | Uso |
|---|---|---|
| `--bg-primary` | `#f5f1ea` | Fondo base (cream) |
| `--bg-secondary` | `#ece3d2` | Fondos secundarios, placeholders |
| `--bg-tertiary` | `#e8dfcf` | Bordes suaves, dividers |
| `--bg-invert` | `#1a1208` | Hero dark, code blocks, contact section |
| `--fg-primary` | `#1a1208` | Texto principal (near-black warm) |
| `--fg-secondary` | `#3d2e1a` | Texto body, párrafos |
| `--fg-tertiary` | `#6b5943` | Texto secundario |
| `--fg-muted` | `#9a8567` | Labels, metadata, placeholder |
| `--fg-subtle` | `#b8a589` | Dividers textuales, secondary meta |
| `--accent` | `#c4a574` | Sepia/gold, TOC activo, prompts CLI |
| `--accent-success` | `#7a9960` | Status indicators (`● available`) |
| `--accent-warn` | `#e07856` | Error states, code highlights |

**Dark mode (opt-in):** inversión con `--bg-primary: #1a1208`, mantiene warmth — NO es un dark mode frío estándar. Acento sepia conserva el sello visual.

### 2.4 Espaciado y Grid

- **Grid base:** 12 columnas desktop, gutter 24px, margin exterior `clamp(24px, 5vw, 64px)`
- **Asimetría deliberada** en secciones de Home y grids de proyectos — spans variables (col-span-7/5, 8/4, 5/7 alternando) en vez de grillas simétricas
- **Spacing scale (8px base):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160px

### 2.5 Iconografía y media

- **Iconos:** Lucide (reemplaza Heroicons), stroke-width 1.5, color heredado del texto
- **Imágenes:** next/image con placeholder blur, quality 90, formats AVIF + WebP
- **Tratamiento fotos/screenshots:** borde 1px `--bg-tertiary`, border-radius 2px (casi nulo), sin sombras pesadas
- **Figures:** labels tipo `fig.01 —` en JetBrains Mono, abajo-izquierda o caption inferior

### 2.6 Micro-interacciones y animación

- **Librería general:** Motion (ex Framer Motion 11+)
- **Librería hero (canvas):** vanilla `requestAnimationFrame` — no depende de Motion
- **Principios:**
  - Transiciones sobrias (duration 300-500ms, easing `[0.22, 1, 0.36, 1]`)
  - Reveals al entrar en viewport: fade + translate-y 12-16px — nunca parallax decorativo
  - Hover states honestos: underline animado, color shift sepia, sin escalas grandes
  - Cursor contextual opcional en cards de proyectos (custom cursor pointer con label)
  - Respect `prefers-reduced-motion` — desactiva todos los reveals, transitions > 200ms, y el canvas del hero
  - **Excepción hero:** el hero tiene un sistema propio de animación descrito en §2.7 — es la única sección con interactividad ambiental

### 2.7 Hero Animation System

El hero de la home tiene dos capas de animación/interactividad combinadas. Es la pieza más expresiva del sitio y el reemplazo on-brand de la TypeAnimation del portfolio original.

#### 2.7.1 Capa 1 — Fraunces Variable Font Morph (cursor-reactive)

Fraunces es una variable font con múltiples ejes: `opsz` (optical size, 9-144), `SOFT` (softness, 0-100), `WONK` (0-1). El título "Juan *Silva.*" explota estos ejes como animación.

**On load:**
- Arranca con estado "rígido": `opsz: 48, SOFT: 0, WONK: 0`
- Hace morph a estado "cálido": `opsz: 144, SOFT: 100, WONK: 1`
- Duration: 600ms, easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Ocurre una sola vez al montar el componente

**Cursor-reactive (desktop only):**
- La distancia entre el cursor y el centro del headline se mapea a modulación sutil de los ejes
- Cerca (< 200px): `SOFT` sube hasta 120, `WONK` activo, headline "respira"
- Lejos (> 500px): vuelve al estado base cálido
- Interpolación con lerp suave (factor 0.08 por frame) para evitar jitter
- NO distorsión grotesca — el usuario apenas lo nota, pero lo siente

**Implementación:**
- CSS `font-variation-settings` animado con `style` props reactivos
- Hook `useCursorProximity(elementRef)` custom en `features/hero/hooks/`
- Fuente servida como WOFF2 self-hosted desde `next/font/local`

#### 2.7.2 Capa 2 — Typographic Ghosts Particles

Partículas decorativas de fondo que evocan tipografía viva.

**Composition:**
- 20-30 glyphs renderizados en canvas 2D (desktop), 10-15 en mobile
- Glyph set: `&`, `,`, `—`, `§`, `¶`, `†`, `·`, `*`, `'`, `"`, `.`, `;` — punctuation + ornamentos serif
- Font: Fraunces italic/regular variants
- Tamaños: aleatorios entre 10-22px
- Color: `--accent` (`#c4a574`) con opacidades aleatorias 0.2-0.4
- Z-index: detrás de todo el contenido del hero (z-0), contenido en z-10

**Ambient motion:**
- Cada partícula tiene velocidad inicial aleatoria mínima (`±0.15px/frame`) en X e Y
- Boundary wrap: cuando sale del canvas por un borde, entra por el opuesto
- Rotación lenta opcional (`±0.5°/frame`) para variación visual

**Cursor interaction:**
- Radio de influencia: 150px desde el cursor
- Dentro del radio, cada partícula experimenta fuerza de orbitación (tangencial, no radial) alrededor del cursor
- Magnitud inversa a la distancia (más cerca = más fuerza)
- Al salir del radio, vuelve a drift libre con damping (factor 0.92 por frame)
- La orbitación NO es atracción/repulsión — es órbita elíptica suave, como si el cursor tuviera gravedad débil

**Performance:**
- Canvas 2D con `requestAnimationFrame`
- Target: 60fps en MacBook Air M1 base / equivalente
- Budget CPU: ≤ 5% idle en hardware mid-range
- `will-change: auto` en el canvas, no transform 3D
- Pausa el rAF cuando el canvas sale del viewport (IntersectionObserver)

**Accessibility:**
- Canvas con `aria-hidden="true"` — es 100% decorativo
- El hero es completamente legible y funcional sin la capa de partículas
- `prefers-reduced-motion`:
  - Capa 1 (morph): se aplica el estado final inmediatamente, sin transición, sin cursor-react
  - Capa 2 (ghosts): se renderizan estáticas en sus posiciones iniciales aleatorias, sin motion ni interacción

**Mobile:**
- Desktop (≥1024px): ambas capas activas, cursor-react completo
- Tablet (768-1023px): capa 1 morph on-load únicamente (sin cursor-react), capa 2 con ambient motion sin touch interaction
- Mobile (<768px): capa 1 morph on-load, capa 2 reducida a 10 glyphs estáticos

#### 2.7.3 Boundary

El sistema vive aislado en `features/hero/`:
- `features/hero/ui/Hero.tsx` — server component, orquesta
- `features/hero/ui/HeroTitle.tsx` — client component, morph + cursor proximity
- `features/hero/ui/HeroCanvas.tsx` — client component, canvas + rAF loop
- `features/hero/hooks/useCursorProximity.ts` — hook compartido
- `features/hero/hooks/useReducedMotion.ts` — wrapper sobre `window.matchMedia`
- `features/hero/lib/particles.ts` — pure functions (init, update, draw) — testeable en Vitest

Nada del sistema de hero animation escapa al resto del app. Si se remueve, el resto sigue funcionando.

## 3. Layout System

### 3.1 Home (`/[locale]`)

**Decisión:** Asymmetric Magazine.

```
┌─────────────────────────────────────────────┐
│ nav: juan-silva.dev  │  work writing talks  │
├─────────────────────────────────────────────┤
│ $ whoami — portfolio · 2026                 │
│                                             │
│ Juan Silva.                                 │
│ Building software,                          │
│ teaching people,                            │
│ designing systems that last.                │
│                                             │
│ ● available · 15y · GDE·MVP · AR            │
│ [Read case studies →]  [Get in touch]       │
│ — SCROLL · 01 / 06                          │
├─────────────────────────────────────────────┤
│ — 01 / SELECTED WORK                        │
│ ┌──────────┐ ┌───┐                          │  grid asimétrico,
│ │ Proj 01  │ │ 02│                          │  col-spans variables,
│ │          │ └───┘                          │  aspect ratios distintos,
│ └──────────┘ ┌──────┐                       │  labels numerados
│ ┌────┐       │ 03   │                       │
│ │ 04 │       │      │                       │
│ └────┘       └──────┘                       │
├─────────────────────────────────────────────┤
│ — 02 / ABOUT (offset left)                  │
│         ┌──────────────────────┐            │
│         │ bio serif, skills,   │            │
│         │ timeline, philosophy │            │
│         └──────────────────────┘            │
├─────────────────────────────────────────────┤
│ — 03 / WRITING (offset right)               │
│ ┌────┐ ┌────┐ ┌────┐   → all posts          │
│ └────┘ └────┘ └────┘                        │
├─────────────────────────────────────────────┤
│ — 04 / TALKS                                │
│ list of talks con venue/year/link           │
├─────────────────────────────────────────────┤
│ — 05 / GET IN TOUCH   (dark full-bleed)     │
│ formulario + redes                          │
└─────────────────────────────────────────────┘
```

**Principios:**
- Cada sección numerada en JetBrains Mono con guión (`— 01 / SELECTED WORK`)
- Secciones 2 y 3 entran con offset del margen (no full-width) para romper simetría
- Section 1 (work) usa grid asimétrico de 4 proyectos featured con spans distintos — NO grid uniforme
- Section 5 (contact) full-bleed con fondo `--bg-invert`

### 3.2 Case Study (`/[locale]/projects/[slug]`)

**Decisión:** Visual First + metadata sidebar sticky.

```
┌─────────────────────────────────────────────┐
│ nav                                         │
├─────────────────────────────────────────────┤
│ ← BACK TO WORK                              │
│ CASE STUDY · 2022—2025       (dark bg)      │
│                                             │
│ Rebuilding the                              │
│ billing system at scale.                    │
│ A three-year migration...                   │
├─────────────────────────────────────────────┤
│ ┌────────┐ ┌──┐ ┌──┐                        │
│ │ fig.01 │ │02│ │03│        (figures grid)  │
│ │        │ └──┘ └──┘                        │
│ │        │ ┌───────┐                        │
│ └────────┘ │ fig.04│                        │
│            └───────┘                        │
├─────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌───────────────┐  │
│ │ — 01 THE PROBLEM     │ │ // METADATA   │  │
│ │ Headline serif       │ │ role: Lead    │  │
│ │ prose prose prose    │ │ year: 22—25   │  │
│ │ ┌─ code block ─┐     │ │ team: 12      │  │
│ │ │ dark bg      │     │ │ client: ...   │  │
│ │ └──────────────┘     │ │               │  │
│ │                      │ │ // STACK      │  │
│ │ — 02 THE DECISIONS   │ │ [kafka][go]   │  │
│ │ ...                  │ │ [postgres]    │  │
│ │ ┌─ figure ──────┐    │ │               │  │
│ │ │ fig.05        │    │ │ // CONTENTS   │  │
│ │ └───────────────┘    │ │ → 01 Problem  │  │
│ │                      │ │   02 Decision │  │
│ │ — 03 THE IMPACT      │ │   03 Impact   │  │
│ │ ┌─┐ ┌─┐ ┌─┐          │ │   04 Lessons  │  │
│ │ │−40% 10×  12→1      │ │               │  │
│ │ └─┘ └─┘ └─┘          │ │ read · 12 min │  │
│ │                      │ │ (sticky)      │  │
│ │ — 04 LESSONS         │ └───────────────┘  │
│ └──────────────────────┘                    │
├─────────────────────────────────────────────┤
│ ← previous case study │ next case study →   │
└─────────────────────────────────────────────┘
```

**Columnas:** `grid-template-columns: 2fr 1fr` con gap 48px. Gap colapsa a columna única <1024px, sidebar se convierte en top sticky bar con metadata colapsable + TOC button.

**Code blocks:** fondo `--bg-invert`, texto `--accent`, comments `--accent-success`, highlights `--accent-warn`. Font JetBrains Mono 11-13px.

**Impact cards:** white bg con border, cifra grande Fraunces, label mono uppercase.

### 3.3 Projects Index (`/[locale]/projects`)

Aplicación del mismo asymmetric grid de la Home Featured Work pero al conjunto completo. Filtros top (All / Web / Mobile / Architecture / Year) en JetBrains Mono como pills. Orden por año descendente. Paginación infinite scroll o "load more" (a definir en implementación).

### 3.4 Blog Index y Post

**Blog index (`/[locale]/blog`):** lista editorial — cada post ocupa una fila con meta `— date · tag · read time` mono, título Fraunces, deck subtitle italic. Sin tarjetas, solo lista. Filtros por tag opcionales.

**Blog post (`/[locale]/blog/[slug]`):** estructura similar a Case Study pero sin hero dark — hero light con título serif + deck + metadata inline, body single column centered (max-width 680px para reading), sidebar TOC sticky solo en desktop. MDX con components tipados: Callout, CodeBlock (shiki), Figure, Quote, Footnote.

### 3.5 Talks (`/[locale]/talks`)

Lista cronológica descendente. Cada talk: año grande mono como marker, título Fraunces, venue + ciudad + link slides/video mono. Sin imágenes — minimalista, declarativo.

### 3.6 About (`/[locale]/about`)

Página dedicada (además del teaser en home). Estructura:
1. Hero: retrato + párrafo bio extendido serif
2. Philosophy: 3-4 principios en formato manifesto (Fraunces grande)
3. Skills agrupadas por categoría (Architecture, Testing, Tooling, Teaching, etc.)
4. Timeline: años + rol + contexto como lista asimétrica
5. Certifications / Awards (GDE, MVP) como cards mono-accent

### 3.7 Navigation

**Top bar permanente:** `juan-silva.dev` en JetBrains Mono a la izquierda (linkea a home), links `Work · Writing · Talks · About` en Inter al centro/derecha, locale switcher `ES / en` en mono a la derecha. Theme toggle como icono pequeño al final.

**Mobile:** hamburger custom (tres líneas asimétricas), drawer full-screen con tipografía Fraunces grande, mismo locale+theme toggles abajo.

**Scroll behavior:** bar se achica al scrollear (padding vertical colapsa ~30%), background gana `backdrop-filter: blur(12px)` con `rgba(245, 241, 234, 0.82)`.

## 4. Content Architecture

### 4.1 Schema (Content Collections + Zod)

**Projects** (`content/projects/*.mdx`):
```yaml
title: string
slug: string (derived from filename)
summary: string (máx 140 chars)
deck: string (subtitle, 2-3 líneas)
role: string
yearStart: number
yearEnd: number | "ongoing"
teamSize: number | null
client: string | null
stack: string[]
tags: ("web" | "mobile" | "architecture" | "cli" | "open-source")[]
cover: image
figures: { src: image, caption: string }[]
links:
  live: url | null
  repo: url | null
  writeup: url | null
featured: boolean
locale: "es" | "en"
publishedAt: date
impact: { metric: string, value: string }[]
---
body: MDX (sections: Problem, Decisions, Impact, Lessons)
```

**Posts** (`content/posts/*.mdx`):
```yaml
title · slug · summary · publishedAt · tags[] · readingTime (auto)
locale · featured · cover? · draft: boolean
---
body: MDX
```

**Talks** (`content/talks/*.mdx`):
```yaml
title · event · city · country · year · language
slidesUrl? · videoUrl? · repoUrl?
summary · type: "talk" | "workshop" | "keynote"
```

### 4.2 i18n

Estrategia `next-intl` con rutas `/es` (default) y `/en`. Messages en `messages/{es,en}.json` para UI strings. Contenido MDX duplicado en dos archivos por locale (`project-a.es.mdx`, `project-a.en.mdx`) con el mismo `slug` canónico — Content Collections filtra por locale al query time.

### 4.3 Ingesta

Ver sección "Ingesta de contenido" en `C:\Users\sebas\.claude\plans\inherited-kindling-sky.md`. Schema arriba es la contraparte técnica de ese ritual.

## 5. Componentes clave (boundaries)

Cada uno independiente, testeable, con una responsabilidad clara.

| Componente | Responsabilidad | Depende de |
|---|---|---|
| `<SiteHeader>` | Top nav, locale switch, theme toggle, scroll behavior | next-intl, next-themes |
| `<SiteFooter>` | Socials, copyright, last updated, locale switch | site.config |
| `<Hero>` | Server component orquestador del hero, compone HeroTitle + HeroCanvas + status bar | Content Collections |
| `<HeroTitle>` | Client component, Fraunces variable morph on load + cursor-reactive axes modulation | `useCursorProximity`, `useReducedMotion` |
| `<HeroCanvas>` | Client component, canvas 2D con rAF, typographic ghosts particles + cursor orbital interaction | `lib/particles` pure fns, `useReducedMotion` |
| `<FeaturedWorkGrid>` | Grid asimétrico de proyectos featured | ProjectCard, Content Collections |
| `<ProjectCard variant="..." />` | Card de proyecto con variants de aspect ratio | next/image |
| `<CaseStudyHero>` | Dark hero con título + deck + meta chips | — |
| `<CaseStudyLayout>` | 2-col layout con sidebar sticky | `<MetadataSidebar>` |
| `<MetadataSidebar>` | Role/year/team/client + stack chips + TOC activo | `<TOC>` |
| `<TOC>` | Tabla de contenidos con scroll-spy (IntersectionObserver) | — |
| `<MDXComponents>` | Map h1-6, code, callouts, figures, quotes | shiki |
| `<CodeBlock>` | Code con shiki, copy button, language label | shiki |
| `<Figure>` | next/image + caption mono | next/image |
| `<ContactForm>` | RHF + Zod + server action → Resend | react-hook-form, zod, resend |
| `<LocaleSwitcher>` | Alterna entre ES/EN manteniendo path | next-intl |
| `<ThemeToggle>` | Light/dark toggle, no-flash | next-themes |

**Boundary rules:**
- UI components en `features/{name}/ui/` son server components por default
- Client components (marked `"use client"`) solo para: `<ThemeToggle>`, `<LocaleSwitcher>`, `<ContactForm>`, `<MobileNav>`, `<TOC>` (scroll-spy), `<TypeAnimation>`
- Data flows: Content Collections → server component → props → UI. No fetching en client.
- Shared atoms (`Button`, `Link`, `Tag`, `Container`) viven en `shared/ui/` y no conocen features

## 6. Accesibilidad

- **Semantic HTML:** `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>` correctamente usados
- **Landmarks labeled:** `aria-label` en nav principal, footer, aside sidebar
- **Alt text:** obligatorio en todas las imágenes — proyectos, figures, retratos. Lint rule para prevenir regresión.
- **Focus management:** focus visible en sepia outline 2px, skip link "skip to content" en top
- **Contrast:** todos los pares texto/fondo pasan WCAG AA. `--fg-muted` (#9a8567) sobre `--bg-primary` (#f5f1ea) es el borderline — verificar 4.5:1 y ajustar si no cumple
- **Keyboard navigation:** drawer mobile, locale switcher, theme toggle, TOC, form — todos operables con teclado. Tab order lógico.
- **Reduced motion:** `@media (prefers-reduced-motion)` desactiva Motion reveals y transitions > 200ms
- **Screen reader:** TOC anuncia sección activa con `aria-current`. Form errors con `aria-describedby`. Code blocks con `aria-label` descriptivo.
- **Auditoría:** axe en CI, manual sweep con NVDA + VoiceOver antes de deploy

## 7. SEO

- Metadata API de Next 15 — title templates, OG images generadas con `next/og`
- JSON-LD:
  - `Person` / `ProfilePage` en home
  - `Article` en blog posts
  - `CreativeWork` en case studies
  - `Event` en talks pasadas
- `sitemap.ts` dinámico que incluye todos los slugs de ambos locales
- `robots.ts` permitiendo todo excepto `/api/`
- Canonical URLs con hreflang alternates entre locales
- Open Graph images por case study/post, generadas server-side con el título + author

## 8. Testing strategy

- **Vitest** para lógica pura: helpers i18n, filters de projects, formatDate, reading time, slug derivation
- **Testing Library** para componentes con lógica: `<ContactForm>`, `<TOC>` scroll-spy, `<LocaleSwitcher>`, `<ThemeToggle>`
- **Playwright E2E:**
  - Home carga en ambos locales sin errores
  - Nav funciona: link entre secciones
  - Theme toggle persiste entre reloads
  - Locale switch mantiene la ruta equivalente
  - Contact form valida, envía (Resend mocked), muestra success/error
  - Case study renderiza MDX, TOC highlightea, sidebar sticky funciona
- **Axe** en CI contra una matriz de páginas clave
- **Lighthouse CI** con budget: performance ≥95, a11y ≥95, seo ≥95, best-practices ≥95

## 9. Error handling boundaries

- **System boundary (user input):** ContactForm valida client (Zod) + server (Zod) con mismo schema compartido
- **System boundary (external APIs):** Resend send wrapped en try/catch, errores log server-side, usuario ve mensaje genérico + retry button
- **Internal trust:** server components y props no validan — confiamos en types
- **404s:** `not-found.tsx` custom con estética warm + link back home
- **500s:** `error.tsx` con mensaje humano + retry

## 10. Out of scope (explicit)

Lo siguiente NO está en scope del v2 MVP para evitar scope creep:
- CMS headless (Sanity/Contentlayer) — Content Collections es suficiente
- Comments en blog posts
- RSS feed (puede agregarse trivialmente después, pero no bloquea)
- Newsletter signup
- Analytics custom (Vercel Analytics built-in es suficiente)
- Search funcional
- View transitions API
- Más de 2 idiomas
- Third-party integrations (Twitter/X embeds, etc.)

Todo lo anterior es agregable post-MVP sin romper el sistema.

## 11. Critical files referenced

- [C:\Users\sebas\.claude\plans\inherited-kindling-sky.md](file:///C:/Users/sebas/.claude/plans/inherited-kindling-sky.md) — plan maestro del refactor
- [.superpowers/brainstorm/6714-1776222868/content/visual-direction.html](.superpowers/brainstorm/6714-1776222868/content/visual-direction.html) — mockup de dirección
- [.superpowers/brainstorm/6714-1776222868/content/visual-direction-v2.html](.superpowers/brainstorm/6714-1776222868/content/visual-direction-v2.html) — blend hero
- [.superpowers/brainstorm/6714-1776222868/content/home-layout.html](.superpowers/brainstorm/6714-1776222868/content/home-layout.html) — opciones home
- [.superpowers/brainstorm/6714-1776222868/content/case-study-layout.html](.superpowers/brainstorm/6714-1776222868/content/case-study-layout.html) — opciones case study
- [.superpowers/brainstorm/6714-1776222868/content/case-study-blend.html](.superpowers/brainstorm/6714-1776222868/content/case-study-blend.html) — case study final blend

## 12. Next step

Invoke `superpowers:writing-plans` skill para derivar un plan de implementación detallado a partir de este spec. El plan implementation existente en `inherited-kindling-sky.md` se reemplaza o complementa con uno más granular y ejecutable.
