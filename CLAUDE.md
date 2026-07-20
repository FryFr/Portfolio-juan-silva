# CLAUDE.md

Working notes for this repo. Everything here is something that has already caused
a bug, a wasted hour, or a silent failure.

## Stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript strict + `noUncheckedIndexedAccess`
· Tailwind v4 (CSS-first, no config file) · next-intl v4 · Content Collections + MDX + Zod
· next-themes · Biome · pnpm 10 · Vitest · Playwright + axe · Lighthouse CI.

## Architecture

Feature-sliced. `src/features/<domain>/{ui,lib,context,effects,data.ts}` for
hero, about, projects, case-study, blog, talks, contact, cursor.
`src/shared/{ui,lib,config,i18n,mdx,content}` for cross-cutting.

Dependencies run one way: features → shared, app → features + shared. No
feature imports another feature.

Aliases: `@/features/*`, `@/shared/*`, `@/content-collections`.

## Hard rules

**Copy lives in `src/messages/{es,en}.json`. Never in a component.** Both locales
must have identical key sets — next-intl throws at runtime in the locale missing
a key, so a one-locale edit ships a broken page in the other language.

**Content filenames are a contract: `<slug>.{es,en}.mdx`.** `parseFilename` in
`content-collections.ts` *throws* on anything else, so a bad name fails the build
rather than silently dropping a document. This is deliberate.

**`proxy.ts` at the repo root is the middleware.** Next 16 renamed
`middleware.ts`. Looking for `middleware.ts` wastes ten minutes.

**Never write `text-[var(--fg-primary)]` again.** Colour tokens are real Tailwind
utilities — see below.

## Colour tokens

Raw variables live in `@layer base` under `:root` / `.dark` in
`src/app/globals.css`. They are mapped to utilities in a separate `@theme inline`
block.

**`inline` is load-bearing.** A plain `@theme { --color-foreground: #1a1208 }`
bakes the literal value into every generated utility, so the `.dark` overrides
never reach it and dark mode breaks silently. `@theme inline` emits
`color: var(--fg-primary)`, which follows the cascade.

Names describe the role, not the original variable:

| utility | raw var | notes |
|---|---|---|
| `text-foreground` | `--fg-primary` | headings |
| `text-body` | `--fg-secondary` | body copy |
| `text-subtle` | `--fg-tertiary` | de-emphasised |
| `text-muted` | `--fg-muted` | eyebrows, labels |
| `bg-background` | `--bg-primary` | page |
| `bg-surface` | `--bg-secondary` | raised band |
| `border-border` | `--bg-tertiary` | it is a border, not a background |
| `bg-invert` / `text-on-invert` | `--bg-invert` / `--fg-invert` | always a **pair** |
| `text-accent` | `--accent` | |

`--accent-rgb`, `--fg-rgb`, `--fg-invert-rgb` are channel triplets for canvas
work, which needs `rgb()` with a runtime alpha and cannot interpolate a hex.

### The contrast invariant

Any effect that interpolates a colour must keep **both endpoints on the same side
of the background** in both themes. The original `ProximityReveal` lerped toward a
hardcoded `rgb(245,241,234)` — the literal value of `--bg-primary` in light mode —
so body text faded to exactly the page background as the cursor approached. 1:1
contrast, invisible, shipped for months.

Corollary: **an effect that reads theme tokens cannot be dropped onto a surface
those tokens do not describe.** `.reveal-text` mixes `--fg-secondary` toward
`--accent`, both calibrated against `--bg-primary`, so on the inverted contact
band it would resolve to dark text on a dark ground. `FieldCanvas` takes a
`tone="invert"` prop for exactly this reason.

Guarded by `e2e/contrast-proximity.spec.ts`.

## Motion

**CSS scroll-driven animation is the primary layer**, not Motion's `whileInView`.
`whileInView` requires `'use client'` on every animated component, which here
means Hero, About, ProjectsGrid and ContactSection — all of which call
`getTranslations` on the server. Adopting it pushes next-intl's server API across
the client boundary for the sake of a fade. `Reveal` is a server component.

Primitives in `globals.css`: `.reveal`, `.reveal-stagger > *` (staggered by a
`--i` custom property), `.timeline-charge`, `.timeline-node`. Each has an
`@supports not (animation-timeline: view())` fallback that sets the final visible
state explicitly.

**Reduced motion must be handled explicitly for scroll-driven animation.** The
global block clamps `animation-duration` to `0.01ms`, which does nothing to a
progress-based timeline — those are driven by scroll position, not elapsed time.
Left alone, every revealed element stays at `opacity: 0` and the page is blank for
those users. Guarded by `e2e/reduced-motion.spec.ts`.

JS motion is allowed only where CSS genuinely cannot reach: `CountUp` interpolates
text content, and the canvas fields draw pixels. Both bail on reduced motion,
gate on `IntersectionObserver`, and cap DPR at 1.5.

Cursor-driven effects read the ref from `CursorProvider`. Do not add a second
`mousemove` listener.

## Testing

```
pnpm exec content-collections build   # MUST run before typecheck — generates types
pnpm typecheck && pnpm check && pnpm test
pnpm exec playwright test --workers=1
```

**`--workers=1` locally.** At default concurrency the Next dev server buckles and
21 of 24 specs fail on timeouts that look like real failures. CI already pins it.

**The axe gate includes `moderate`.** It previously filtered to serious+critical
and let two real WCAG failures ship. Do not narrow it back.

**Never use `waitUntil: 'networkidle'`.** Next prefetches every in-viewport link,
so the network never goes quiet for the 500ms it requires and the spec times out
instead of reporting. Playwright's own docs discourage it.

Lighthouse runs twice: `.lighthouserc.json` (desktop, 0.95) and
`.lighthouserc.mobile.json` (mobile, 4x CPU throttle, 0.80). Desktop-only auditing
is how a mobile regression ships. Resource budgets cap script/font/image/total —
a category score is too coarse to catch a re-added 4MB image.

## Environment

`pnpm` is not on the default PATH. `export PATH="/opt/homebrew/bin:$PATH"`.
Installed via `brew install pnpm`; it self-manages to the version in
`packageManager`.

## Tooling traps, all hit in this repo

- **`sd -F` treats the replacement literally too.** `\n` lands as a backslash and
  an `n`, corrupting JSON and imports. Use an editor for multi-line inserts.
- **zsh does not word-split unquoted parameter expansions** the way bash does.
  `for f in $files` passes the whole list as one argument. Use
  `rg -l … | while IFS= read -r f`.
- **`sd` uses Rust regex — no lookahead or lookbehind.**
- **Turbopack caches the Tailwind scan.** After editing `globals.css` the dev
  server can serve stale CSS with none of the new utilities, which looks exactly
  like a broken `@theme`. `rm -rf .next` and restart before concluding anything.
- **Verify `pnpm start` actually bound before trusting a Lighthouse run.** It fails
  with `EADDRINUSE` if a dev server is up, and lhci will happily measure the dev
  server instead.

## Looking at the output

Several defects in this codebase were invisible in source and obvious in a
screenshot: headings breaking mid-word, an image squashed by a `scaleX` transform,
coverless project tiles rendering as bright blocks in dark mode, heading
characters colliding across lines. **Screenshot the rendered page in both themes
before believing a visual change is done.** Playwright is already installed; a
short script is enough.
