# Cursor Interaction System — Design Spec

## Goal

Global cursor interaction system that gives the portfolio a distinct visual identity through three combined effects: morphing blob cursor, spotlight glow, and per-character gravity text distortion. Uses `motion/react` (already installed) for blob/spotlight springs and vanilla rAF for per-character distortion (performance-critical path).

## Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Scope | Global system, all sections | Consistent identity across the entire portfolio |
| Mobile | Desktop full + touch tap glow | No hover on mobile; tap feedback keeps it alive |
| Intensity | Statement (B) | Part of the identity, not decoration. Inspired by Rauno, Emil Kowalski |
| Blob style | Morphing blob | Deforms with velocity, stretches on fast movement, relaxes when still |
| Distortion | Per-character gravity | Each letter attracted individually toward cursor, quadratic falloff, scale boost |
| Spotlight | Dual layer | Background glow + proximity text brightness/glow on nearby content |
| Architecture | Hybrid (Motion springs + vanilla rAF) | Springs for blob/spotlight (2 elements), rAF for chars (100+ elements) |
| Reduced motion | Full disable | No animation, no char split, no blob, no spotlight |

## File Structure

```
src/features/cursor/
  context/
    cursor-provider.tsx      # CursorProvider — context + mouse tracking via ref (no re-renders)
    use-cursor.ts            # useCursor() hook — returns ref to { x, y, vx, vy, speed }
  ui/
    cursor-blob.tsx          # motion.div blob — 40px, useSpring, deforms with velocity
    cursor-spotlight.tsx     # motion.div spotlight — 400px, heavy spring, bg glow + speed opacity
  effects/
    distort-heading.tsx      # Per-char gravity distortion — vanilla rAF, direct DOM transforms
    proximity-reveal.tsx     # Dual-layer text brightness by cursor distance — vanilla rAF
  lib/
    use-is-touch.ts          # matchMedia('(pointer: coarse)') + touchstart fallback
    use-reduced-motion.ts    # Wraps motion/react useReducedMotion or prefers-reduced-motion
```

## Component Contracts

### CursorProvider

- **Type:** Client component (`'use client'`)
- **Mount point:** `src/app/[locale]/layout.tsx`, wraps children inside ThemeProvider + NextIntlClientProvider
- **Behavior:** Listens to `mousemove` on `document`, stores `{ x, y, velocityX, velocityY, speed }` in a `useRef` (zero re-renders). Exposes position via React context.
- **Touch mode:** Listens to `touchstart`, fires a one-shot position for tap glow effect, then clears.
- **Renders:** `<CursorBlob />` + `<CursorSpotlight />` as last children (fixed positioned).
- **Conditions:** Does not render blob/spotlight if `useIsTouch()` or `useReducedMotion()`.
- **Body cursor:** Applies `cursor: none` to `document.body` on mount when active, removes on unmount.

### CursorBlob

- **Type:** Client component
- **Rendering:** `motion.div` with `useSpring({ x, y })` — stiffness ~150, damping ~15
- **Size:** 40px base, border-radius 50%
- **Deformation:** `scaleX = 1 + stretch` / `scaleY = 1 / (1 + stretch * 0.5)` where stretch = `min(speed * 0.08, 2.5)`. Rotation follows movement angle via `atan2`.
- **Style:** `radial-gradient(circle, rgba(212,181,132,0.9) 0%, rgba(212,181,132,0.3) 60%, transparent 100%)`, `mix-blend-mode: screen`, `filter: blur(1px)`
- **Interactive expansion:** On `pointerenter` of `a, button, [role="link"]` elements — scales to 65px, switches to `mix-blend-mode: difference`, reduces gradient opacity. Detection via event delegation on document.
- **Fixed positioning:** `position: fixed`, `z-index: 9999`, `pointer-events: none`, `aria-hidden: true`

### CursorSpotlight

- **Type:** Client component
- **Rendering:** `motion.div` with heavier spring — stiffness ~50, damping ~20 (more lag than blob)
- **Size:** 400px, border-radius 50%
- **Style:** `radial-gradient(circle, rgba(212,181,132, {opacity}) 0%, transparent 70%)` where opacity = `0.08 + min(speed * 0.004, 0.12)`
- **Fixed positioning:** `position: fixed`, `z-index: 0`, `pointer-events: none`, `aria-hidden: true`

### DistortHeading

- **Type:** Client component
- **Props:** `as: 'h1' | 'h2' | 'h3'`, `children: string`, `className?: string`
- **Mount behavior:** Splits `children` text into individual `<span className="char">` elements. Spaces become `<span className="char-space">&nbsp;</span>`.
- **Accessibility:** The heading element carries `aria-label={children}` (full text). All char spans are `aria-hidden="true"`. Screen readers read the heading, not individual letters.
- **Animation (vanilla rAF):**
  - Reads cursor position from `useCursor()` ref each frame
  - Per char: calculates distance to cursor, if within gravity radius (250px):
    - `pullX/Y = (delta / dist) * 35 * intensity` where intensity = `(1 - dist/radius)^2` (quadratic falloff)
    - `scale = 1 + 0.25 * intensity`
    - Applied via `el.style.transform` (direct DOM, no React state)
  - Outside radius: returns to `translate(0,0) scale(1)` with 350ms ease-out transition
- **Viewport optimization:** Uses IntersectionObserver — only runs rAF loop when heading is in viewport.
- **Touch/reduced-motion:** Renders as plain heading element (no char split, no animation).

### ProximityReveal

- **Type:** Client component
- **Props:** `children: ReactNode`, `className?: string`, `as?: 'p' | 'span' | 'div'` (default `'p'`)
- **Animation (vanilla rAF):**
  - Reads cursor position from `useCursor()` ref
  - Calculates distance from element center to cursor
  - Within 300px radius: interpolates `color` from `--fg-muted` toward `--fg-primary`, adds `text-shadow` glow (`0 0 {n}px rgba(212,181,132, {opacity})`)
  - Outside radius: reverts to inherited color, no text-shadow
  - Direct DOM manipulation via ref
- **Touch/reduced-motion:** Renders children as-is, no animation.

### useIsTouch

- **Detection:** `matchMedia('(pointer: coarse)')` checked on mount, plus `touchstart` listener as fallback
- **Returns:** `boolean` — true if touch device
- **SSR safe:** Returns `false` during SSR, resolves on mount via `useEffect`

### useReducedMotion

- **Wraps:** `useReducedMotion()` from `motion/react` if available, otherwise `matchMedia('(prefers-reduced-motion: reduce)')`
- **Returns:** `boolean`

## Integration Points

### Files modified (existing)

| File | Change |
|------|--------|
| `src/app/[locale]/layout.tsx` | Wrap children with `<CursorProvider>` |
| `src/features/hero/ui/hero.tsx` | `<h1>` → `<DistortHeading as="h1">`, subtitle → `<ProximityReveal>` |
| `src/features/about/ui/about.tsx` | `<h2>` → `<DistortHeading as="h2">`, bio paragraphs → `<ProximityReveal>` |
| `src/features/projects/ui/projects-grid.tsx` | Section `<h2>` → `<DistortHeading as="h2">` |
| `src/features/projects/ui/project-card.tsx` | `<h3>` → `<DistortHeading as="h3">` |
| `src/features/contact/ui/contact-section.tsx` | `<h2>` → `<DistortHeading as="h2">`, copy → `<ProximityReveal>` |
| `src/app/[locale]/blog/page.tsx` | Section heading → `<DistortHeading>` |
| `src/app/[locale]/blog/[slug]/page.tsx` | Post title via `<DistortHeading>` or via `post-header.tsx` |
| `src/features/blog/ui/post-header.tsx` | Post `<h1>` → `<DistortHeading as="h1">` |
| `src/app/[locale]/talks/page.tsx` | Section heading → `<DistortHeading>` |
| `src/features/talks/ui/talk-card.tsx` | Card heading → `<DistortHeading as="h3">` |
| `src/features/case-study/ui/case-study-header.tsx` | Case study `<h1>` → `<DistortHeading as="h1">` |
| `src/app/[locale]/projects/page.tsx` | Section heading → `<DistortHeading>` |

### Files NOT modified

- Navbar, Footer, RoleRotator, ThemeToggle, LocaleSwitcher — untouched
- `globals.css` — no changes needed (CSS vars already defined)

## Mobile Touch Behavior

- Blob, spotlight, distort heading, proximity reveal — none render on touch devices
- Tap on any `[data-distort]` heading → CSS-only glow pulse at tap coordinates
  - Radial gradient, 400ms fade-out via CSS `@keyframes`
  - Pseudo-element or injected span, removed after animation completes
- Minimal, non-intrusive — acknowledges the tap without simulating hover

## Performance Considerations

- **Char count budget:** DistortHeading only splits and animates chars for headings in viewport (IntersectionObserver). Off-screen headings render as plain text.
- **rAF loop:** Single shared rAF loop in CursorProvider that ticks blob/spotlight springs AND notifies char distortion. Not N independent loops.
- **No React re-renders:** Cursor position stored in ref. All visual updates are direct DOM manipulation. React reconciliation never fires for cursor movement.
- **will-change:** Applied to blob and spotlight divs. NOT applied to individual chars (too many elements, would hurt rather than help).
- **Spring updates:** Motion's `useSpring` runs outside React render cycle internally.

## Visual Parameters (validated in mockup)

| Parameter | Value |
|-----------|-------|
| Blob size | 40px base, 65px on interactives |
| Blob spring | stiffness ~150, damping ~15 |
| Blob max stretch | 2.5x |
| Blob blend mode | `screen` (normal), `difference` (on interactives) |
| Spotlight size | 400px |
| Spotlight spring | stiffness ~50, damping ~20 |
| Spotlight base opacity | 0.08 |
| Gravity radius | 250px |
| Gravity strength | 35px max displacement |
| Gravity falloff | Quadratic: `(1 - dist/radius)^2` |
| Char scale boost | 25% at center |
| Char return ease | 350ms ease-out |
| Proximity radius | 300px |
| Proximity color | `--fg-muted` → `--fg-primary` interpolated |
| Accent color (dark) | `rgba(212, 181, 132, *)` — matches `--accent` dark theme |
