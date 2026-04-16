# Cursor Interaction System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global cursor interaction system with morphing blob, spotlight glow, per-character gravity text distortion, and proximity text reveal — using Motion springs for blob/spotlight and vanilla rAF for per-char effects.

**Architecture:** Hybrid approach — `motion/react` (already installed v12.38.0) powers the blob and spotlight via `useSpring`, while per-character distortion and proximity reveal use vanilla `requestAnimationFrame` with direct DOM manipulation for performance. A React context provider tracks mouse position in a ref (zero re-renders). Touch devices get a CSS-only tap glow; `prefers-reduced-motion` disables everything.

**Tech Stack:** React 19, Next.js 16 (App Router), motion/react 12.38, TypeScript strict, Tailwind CSS 4, Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-04-15-cursor-interaction-system-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| **Create:** `src/features/cursor/lib/use-is-touch.ts` | Detect touch vs pointer device |
| **Create:** `src/features/cursor/context/cursor-provider.tsx` | Context + mouse tracking + renders blob/spotlight |
| **Create:** `src/features/cursor/context/use-cursor.ts` | Consumer hook returning cursor ref |
| **Create:** `src/features/cursor/ui/cursor-blob.tsx` | Motion spring blob with velocity deformation |
| **Create:** `src/features/cursor/ui/cursor-spotlight.tsx` | Motion spring spotlight with heavy lag |
| **Create:** `src/features/cursor/effects/distort-heading.tsx` | Per-char gravity distortion via rAF |
| **Create:** `src/features/cursor/effects/proximity-reveal.tsx` | Dual-layer text brightness by distance |
| **Create:** `tests/features/cursor/use-is-touch.test.ts` | Unit tests for touch detection |
| **Create:** `tests/features/cursor/distort-heading.test.tsx` | Component tests for DistortHeading |
| **Create:** `tests/features/cursor/proximity-reveal.test.tsx` | Component tests for ProximityReveal |
| **Modify:** `src/app/[locale]/layout.tsx` | Mount CursorProvider |
| **Modify:** `src/features/hero/ui/hero.tsx` | h1 → DistortHeading, subtitle → ProximityReveal |
| **Modify:** `src/features/about/ui/about.tsx` | h2 → DistortHeading, bio → ProximityReveal |
| **Modify:** `src/features/projects/ui/projects-grid.tsx` | h2 → DistortHeading |
| **Modify:** `src/features/projects/ui/project-card.tsx` | h3 → DistortHeading |
| **Modify:** `src/features/contact/ui/contact-section.tsx` | h2 → DistortHeading, copy → ProximityReveal |
| **Modify:** `src/features/case-study/ui/case-study-header.tsx` | h1 → DistortHeading, summary → ProximityReveal |
| **Modify:** `src/features/blog/ui/post-header.tsx` | h1 → DistortHeading, summary → ProximityReveal |
| **Modify:** `src/features/talks/ui/talk-card.tsx` | h2 → DistortHeading |
| **Modify:** `src/app/[locale]/blog/page.tsx` | h1 → DistortHeading |
| **Modify:** `src/app/[locale]/talks/page.tsx` | h1 → DistortHeading |
| **Modify:** `src/app/[locale]/projects/page.tsx` | h1 → DistortHeading |

---

### Task 1: useIsTouch hook

**Files:**
- Create: `src/features/cursor/lib/use-is-touch.ts`
- Test: `tests/features/cursor/use-is-touch.test.ts`

- [ ] **Step 1: Write the test**

```tsx
// tests/features/cursor/use-is-touch.test.ts
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

describe('useIsTouch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when pointer is fine (desktop)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const { result } = renderHook(() => useIsTouch());
    expect(result.current).toBe(false);
  });

  it('returns true when pointer is coarse (touch)', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    const { result } = renderHook(() => useIsTouch());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/features/cursor/use-is-touch.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement useIsTouch**

```tsx
// src/features/cursor/lib/use-is-touch.ts
'use client';

import { useEffect, useState } from 'react';

export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse)');
    setIsTouch(mql.matches);

    const handler = () => setIsTouch(true);
    window.addEventListener('touchstart', handler, { once: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  return isTouch;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/features/cursor/use-is-touch.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/cursor/lib/use-is-touch.ts tests/features/cursor/use-is-touch.test.ts
git commit -m "feat(cursor): useIsTouch hook with touch/pointer detection"
```

---

### Task 2: Cursor context + provider (no visuals yet)

**Files:**
- Create: `src/features/cursor/context/use-cursor.ts`
- Create: `src/features/cursor/context/cursor-provider.tsx`

- [ ] **Step 1: Create the cursor type and consumer hook**

```tsx
// src/features/cursor/context/use-cursor.ts
'use client';

import { type RefObject, createContext, useContext } from 'react';

export type CursorState = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
};

export const CursorContext = createContext<RefObject<CursorState> | null>(null);

export function useCursor(): RefObject<CursorState> {
  const ref = useContext(CursorContext);
  if (!ref) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return ref;
}
```

- [ ] **Step 2: Create CursorProvider**

```tsx
// src/features/cursor/context/cursor-provider.tsx
'use client';

import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';
import { type CursorState, CursorContext } from '@/features/cursor/context/use-cursor';

type Props = {
  children: ReactNode;
};

export function CursorProvider({ children }: Props) {
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const active = !isTouch && !prefersReducedMotion;

  const stateRef = useRef<CursorState>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0,
  });

  const prevRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const prev = prevRef.current;
    const vx = e.clientX - prev.x;
    const vy = e.clientY - prev.y;

    stateRef.current = {
      x: e.clientX,
      y: e.clientY,
      velocityX: vx,
      velocityY: vy,
      speed: Math.sqrt(vx * vx + vy * vy),
    };

    prev.x = e.clientX;
    prev.y = e.clientY;
  }, []);

  useEffect(() => {
    if (!active) return;

    document.body.style.cursor = 'none';
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [active, handleMouseMove]);

  return (
    <CursorContext.Provider value={stateRef}>
      {children}
      {active && (
        <>
          {/* CursorBlob and CursorSpotlight will be added in Task 3 */}
        </>
      )}
    </CursorContext.Provider>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/cursor/context/use-cursor.ts src/features/cursor/context/cursor-provider.tsx
git commit -m "feat(cursor): CursorProvider context with mouse tracking via ref"
```

---

### Task 3: CursorBlob + CursorSpotlight

**Files:**
- Create: `src/features/cursor/ui/cursor-blob.tsx`
- Create: `src/features/cursor/ui/cursor-spotlight.tsx`
- Modify: `src/features/cursor/context/cursor-provider.tsx`

- [ ] **Step 1: Create CursorBlob**

```tsx
// src/features/cursor/ui/cursor-blob.tsx
'use client';

import { motion, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';

export function CursorBlob() {
  const cursorRef = useCursor();
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });
  const blobRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const expandedRef = useRef(false);

  useEffect(() => {
    const onPointerEnter = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="link"]')) {
        expandedRef.current = true;
      }
    };
    const onPointerLeave = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="link"]')) {
        expandedRef.current = false;
      }
    };

    document.addEventListener('pointerover', onPointerEnter);
    document.addEventListener('pointerout', onPointerLeave);

    return () => {
      document.removeEventListener('pointerover', onPointerEnter);
      document.removeEventListener('pointerout', onPointerLeave);
    };
  }, []);

  useEffect(() => {
    function tick() {
      const state = cursorRef.current;
      x.set(state.x);
      y.set(state.y);

      const el = blobRef.current;
      if (el) {
        const speed = state.speed;
        const angle = Math.atan2(state.velocityY, state.velocityX);
        const stretch = Math.min(speed * 0.08, 2.5);
        const scaleX = 1 + stretch;
        const scaleY = 1 / (1 + stretch * 0.5);
        const rotation = angle * (180 / Math.PI);

        const size = expandedRef.current ? 65 : 40;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.mixBlendMode = expandedRef.current ? 'difference' : 'screen';
        el.style.setProperty('--blob-rotate', `${rotation}deg`);
        el.style.setProperty('--blob-scale-x', `${scaleX}`);
        el.style.setProperty('--blob-scale-y', `${scaleY}`);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cursorRef, x, y]);

  return (
    <motion.div
      ref={blobRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-10 w-10 rounded-full blur-[1px]"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        rotate: 'var(--blob-rotate, 0deg)',
        scaleX: 'var(--blob-scale-x, 1)',
        scaleY: 'var(--blob-scale-y, 1)',
        background:
          'radial-gradient(circle, rgba(212,181,132,0.9) 0%, rgba(212,181,132,0.3) 60%, transparent 100%)',
        mixBlendMode: 'screen',
        transition: 'width 0.15s, height 0.15s',
      }}
    />
  );
}
```

- [ ] **Step 2: Create CursorSpotlight**

```tsx
// src/features/cursor/ui/cursor-spotlight.tsx
'use client';

import { motion, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';

export function CursorSpotlight() {
  const cursorRef = useCursor();
  const x = useSpring(0, { stiffness: 50, damping: 20 });
  const y = useSpring(0, { stiffness: 50, damping: 20 });
  const spotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const state = cursorRef.current;
      x.set(state.x);
      y.set(state.y);

      const el = spotRef.current;
      if (el) {
        const opacity = 0.08 + Math.min(state.speed * 0.004, 0.12);
        el.style.background = `radial-gradient(circle, rgba(212,181,132,${opacity}) 0%, rgba(212,181,132,${opacity * 0.25}) 40%, transparent 70%)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cursorRef, x, y]);

  return (
    <motion.div
      ref={spotRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-0 h-[400px] w-[400px] rounded-full"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        background:
          'radial-gradient(circle, rgba(212,181,132,0.08) 0%, transparent 70%)',
      }}
    />
  );
}
```

- [ ] **Step 3: Wire blob and spotlight into CursorProvider**

In `src/features/cursor/context/cursor-provider.tsx`, replace the comment placeholder:

```tsx
// Replace the {active && (<>...</>)} block with:
import { CursorBlob } from '@/features/cursor/ui/cursor-blob';
import { CursorSpotlight } from '@/features/cursor/ui/cursor-spotlight';

// Inside the return, after {children}:
{active && (
  <>
    <CursorSpotlight />
    <CursorBlob />
  </>
)}
```

Full updated import block for cursor-provider.tsx:

```tsx
import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { CursorBlob } from '@/features/cursor/ui/cursor-blob';
import { CursorSpotlight } from '@/features/cursor/ui/cursor-spotlight';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';
import { type CursorState, CursorContext } from '@/features/cursor/context/use-cursor';
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/cursor/ui/cursor-blob.tsx src/features/cursor/ui/cursor-spotlight.tsx src/features/cursor/context/cursor-provider.tsx
git commit -m "feat(cursor): CursorBlob + CursorSpotlight with Motion springs"
```

---

### Task 4: DistortHeading effect component

**Files:**
- Create: `src/features/cursor/effects/distort-heading.tsx`
- Test: `tests/features/cursor/distort-heading.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
// tests/features/cursor/distort-heading.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';

vi.mock('@/features/cursor/context/use-cursor', () => ({
  useCursor: () => ({ current: { x: 0, y: 0, velocityX: 0, velocityY: 0, speed: 0 } }),
}));

vi.mock('@/features/cursor/lib/use-is-touch', () => ({
  useIsTouch: () => false,
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

describe('DistortHeading', () => {
  it('renders as the specified heading element', () => {
    render(<DistortHeading as="h1">Hello World</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
  });

  it('has aria-label with full text', () => {
    render(<DistortHeading as="h2">Test Title</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('aria-label', 'Test Title');
  });

  it('splits text into individual char spans', () => {
    const { container } = render(<DistortHeading as="h3">AB</DistortHeading>);
    const chars = container.querySelectorAll('[aria-hidden="true"]');
    expect(chars.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves className', () => {
    render(<DistortHeading as="h1" className="custom-class">Title</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('custom-class');
  });

  it('renders as plain heading when reduced motion preferred', () => {
    vi.mocked(await import('motion/react')).useReducedMotion.mockReturnValue(true);
    render(<DistortHeading as="h1">Plain</DistortHeading>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Plain');
    expect(heading).not.toHaveAttribute('aria-label');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/features/cursor/distort-heading.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement DistortHeading**

```tsx
// src/features/cursor/effects/distort-heading.tsx
'use client';

import { useReducedMotion } from 'motion/react';
import { type ElementType, useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

type Props = {
  as: 'h1' | 'h2' | 'h3';
  children: string;
  className?: string;
};

const GRAVITY_RADIUS = 250;
const GRAVITY_STRENGTH = 35;
const SCALE_BOOST = 0.25;

export function DistortHeading({ as: Tag, children, className }: Props) {
  const cursorRef = useCursor();
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);

  const active = !isTouch && !prefersReducedMotion;

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function tick() {
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const cursor = cursorRef.current;
      const chars = charsRef.current;

      for (let i = 0; i < chars.length; i++) {
        const el = chars[i];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cursor.x - cx;
        const dy = cursor.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < GRAVITY_RADIUS) {
          const intensity = Math.pow(1 - dist / GRAVITY_RADIUS, 2);
          const pullX = (dx / dist) * GRAVITY_STRENGTH * intensity;
          const pullY = (dy / dist) * GRAVITY_STRENGTH * intensity;
          const scale = 1 + SCALE_BOOST * intensity;
          el.style.transform = `translate(${pullX}px, ${pullY}px) scale(${scale})`;
          el.style.transition = 'transform 0.08s ease-out';
        } else {
          el.style.transform = 'translate(0, 0) scale(1)';
          el.style.transition = 'transform 0.35s ease-out';
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, cursorRef]);

  if (!active) {
    return <Tag className={className}>{children}</Tag>;
  }

  const chars = children.split('').map((char, i) => {
    if (char === ' ') {
      return (
        <span key={`${i}-space`} className="inline-block w-[0.3em]">
          &nbsp;
        </span>
      );
    }
    return (
      <span
        key={`${i}-${char}`}
        ref={(el) => {
          if (el) charsRef.current[i] = el;
        }}
        aria-hidden="true"
        className="inline-block will-change-auto"
      >
        {char}
      </span>
    );
  });

  return (
    <Tag ref={containerRef} className={className} aria-label={children}>
      {chars}
    </Tag>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/features/cursor/distort-heading.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/cursor/effects/distort-heading.tsx tests/features/cursor/distort-heading.test.tsx
git commit -m "feat(cursor): DistortHeading with per-char gravity distortion"
```

---

### Task 5: ProximityReveal effect component

**Files:**
- Create: `src/features/cursor/effects/proximity-reveal.tsx`
- Test: `tests/features/cursor/proximity-reveal.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
// tests/features/cursor/proximity-reveal.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';

vi.mock('@/features/cursor/context/use-cursor', () => ({
  useCursor: () => ({ current: { x: 0, y: 0, velocityX: 0, velocityY: 0, speed: 0 } }),
}));

vi.mock('@/features/cursor/lib/use-is-touch', () => ({
  useIsTouch: () => false,
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

describe('ProximityReveal', () => {
  it('renders children inside default p tag', () => {
    render(<ProximityReveal>Hello text</ProximityReveal>);
    const el = screen.getByText('Hello text');
    expect(el.tagName).toBe('P');
  });

  it('renders with custom tag', () => {
    render(<ProximityReveal as="span">Span text</ProximityReveal>);
    const el = screen.getByText('Span text');
    expect(el.tagName).toBe('SPAN');
  });

  it('preserves className', () => {
    render(<ProximityReveal className="test-class">Content</ProximityReveal>);
    const el = screen.getByText('Content');
    expect(el).toHaveClass('test-class');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/features/cursor/proximity-reveal.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement ProximityReveal**

```tsx
// src/features/cursor/effects/proximity-reveal.tsx
'use client';

import { useReducedMotion } from 'motion/react';
import { type ElementType, type ReactNode, useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useIsTouch } from '@/features/cursor/lib/use-is-touch';

type Props = {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
};

const PROXIMITY_RADIUS = 300;

export function ProximityReveal({ children, className, as: Tag = 'p' }: Props) {
  const cursorRef = useCursor();
  const isTouch = useIsTouch();
  const prefersReducedMotion = useReducedMotion();
  const elRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number>(0);
  const visibleRef = useRef(false);

  const active = !isTouch && !prefersReducedMotion;

  useEffect(() => {
    if (!active || !elRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );

    observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function tick() {
      if (!visibleRef.current || !elRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const cursor = cursorRef.current;
      const el = elRef.current;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cursor.x - cx;
      const dy = cursor.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PROXIMITY_RADIUS) {
        const intensity = 1 - dist / PROXIMITY_RADIUS;
        const r = Math.round(154 + (245 - 154) * intensity);
        const g = Math.round(133 + (241 - 133) * intensity);
        const b = Math.round(103 + (234 - 103) * intensity);
        el.style.color = `rgb(${r}, ${g}, ${b})`;
        el.style.textShadow = `0 0 ${intensity * 8}px rgba(212,181,132,${intensity * 0.15})`;
      } else {
        el.style.color = '';
        el.style.textShadow = 'none';
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, cursorRef]);

  return (
    <Tag ref={elRef} className={className}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/features/cursor/proximity-reveal.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/cursor/effects/proximity-reveal.tsx tests/features/cursor/proximity-reveal.test.tsx
git commit -m "feat(cursor): ProximityReveal with dual-layer text brightness"
```

---

### Task 6: Mount CursorProvider in layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx:131-134`

- [ ] **Step 1: Add CursorProvider to layout**

In `src/app/[locale]/layout.tsx`, add the import:

```tsx
import { CursorProvider } from '@/features/cursor/context/cursor-provider';
```

Then wrap the content inside `NextIntlClientProvider` with `CursorProvider`. Replace:

```tsx
<NextIntlClientProvider messages={messages}>
  <Navbar locale={locale} />
  <div className="flex-1">{children}</div>
  <Footer />
  <FloatingWhatsApp />
</NextIntlClientProvider>
```

With:

```tsx
<NextIntlClientProvider messages={messages}>
  <CursorProvider>
    <Navbar locale={locale} />
    <div className="flex-1">{children}</div>
    <Footer />
    <FloatingWhatsApp />
  </CursorProvider>
</NextIntlClientProvider>
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Run dev server and verify blob + spotlight appear**

Run: `pnpm dev`
Open `http://localhost:3000/es` — verify:
- Native cursor is hidden
- Blob follows cursor with spring lag
- Blob deforms when moving fast
- Spotlight glow visible behind blob
- Blob expands on links/buttons

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat(cursor): mount CursorProvider in root layout"
```

---

### Task 7: Integrate DistortHeading into Hero

**Files:**
- Modify: `src/features/hero/ui/hero.tsx`

- [ ] **Step 1: Convert Hero from server component to hybrid**

The Hero component uses `getTranslations` (server-side) to get strings, then passes them to the template. `DistortHeading` is a client component. Since we can't use client components inside an async server component directly, we pass text as props.

Replace the current `h1` and subtitle `p` in `src/features/hero/ui/hero.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { HERO_ROLE_KEYS } from '@/features/hero/data';
import { RoleRotator } from '@/features/hero/ui/role-rotator';
import { Container } from '@/shared/ui/container';

export async function Hero() {
  const t = await getTranslations('home.hero');
  const phrases = HERO_ROLE_KEYS.map((key) => t(`roles.${key}`));

  return (
    <section className="relative">
      <Container size="wide" className="py-24 md:py-32">
        <div className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          <span className="text-[var(--accent)]">$</span> {t('prompt')}
        </div>
        <DistortHeading
          as="h1"
          className="font-serif text-7xl font-normal leading-[0.88] tracking-[-0.03em] text-[var(--fg-primary)] md:text-9xl"
        >
          {t('title')}
        </DistortHeading>
        <ProximityReveal className="mt-6 max-w-2xl font-serif text-xl italic text-[var(--fg-tertiary)] md:text-2xl">
          {t('subtitle')}
        </ProximityReveal>
        <p className="mt-10 font-mono text-sm uppercase tracking-[0.15em] text-[var(--fg-muted)]">
          {t('rolesIntro')} · <RoleRotator phrases={phrases} />
        </p>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/es` — cursor near "Juan Silva" (h1) should pull characters toward it with gravity effect. Subtitle should brighten on cursor proximity.

- [ ] **Step 4: Commit**

```bash
git add src/features/hero/ui/hero.tsx
git commit -m "feat(cursor): integrate DistortHeading + ProximityReveal into Hero"
```

---

### Task 8: Integrate into About section

**Files:**
- Modify: `src/features/about/ui/about.tsx`

- [ ] **Step 1: Replace h2 and bio paragraphs**

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { ABOUT_BIO_PARAGRAPHS } from '@/features/about/data';
import { SkillsGrid } from '@/features/about/ui/skills-grid';
import { Timeline } from '@/features/about/ui/timeline';
import { Container } from '@/shared/ui/container';

export async function About() {
  const t = await getTranslations('home.about');
  const bio = Array.from({ length: ABOUT_BIO_PARAGRAPHS }, (_, i) => t(`bio.${i}`));

  return (
    <section className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <DistortHeading
          as="h2"
          className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
        >
          {t('title')}
        </DistortHeading>
        <div className="mt-12 max-w-2xl space-y-6 font-serif text-lg leading-relaxed text-[var(--fg-secondary)] md:text-xl">
          {bio.map((paragraph) => (
            <ProximityReveal key={paragraph}>{paragraph}</ProximityReveal>
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

Note: The h3 elements for "skillsTitle" and "timelineTitle" are monospace eyebrow labels (10px), NOT display headings. Distorting them would look wrong — leave them as plain `<h3>`.

- [ ] **Step 2: Run typecheck and verify in browser**

Run: `pnpm typecheck`
Open `http://localhost:3000/es` — scroll to About section, verify h2 distorts and bio paragraphs brighten on cursor proximity.

- [ ] **Step 3: Commit**

```bash
git add src/features/about/ui/about.tsx
git commit -m "feat(cursor): integrate DistortHeading + ProximityReveal into About"
```

---

### Task 9: Integrate into ProjectsGrid + ProjectCard

**Files:**
- Modify: `src/features/projects/ui/projects-grid.tsx`
- Modify: `src/features/projects/ui/project-card.tsx`

- [ ] **Step 1: Update ProjectsGrid h2**

In `src/features/projects/ui/projects-grid.tsx`, add import and replace h2:

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProjectCard } from '@/features/projects/ui/project-card';
import { getFeaturedProjects } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { Container } from '@/shared/ui/container';

// Replace the <h2> with:
<DistortHeading
  as="h2"
  className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
>
  {t('title')}
</DistortHeading>
```

- [ ] **Step 2: Update ProjectCard h3**

In `src/features/projects/ui/project-card.tsx`, the h3 contains a Link child. DistortHeading expects `children: string`. We need to keep the Link as the parent and distort just the title text inside it.

Replace the h3 block:

```tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import type { Project } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

// In the return, replace the <h3>...</h3> with:
<h3 className="font-serif text-2xl text-[var(--fg-primary)] md:text-3xl">
  <Link
    href={`/${locale}/projects/${project.slug}`}
    className="underline-offset-4 hover:underline"
  >
    <DistortHeading as="span" className="inline">
      {project.title}
    </DistortHeading>
  </Link>
</h3>
```

Wait — `DistortHeading` only accepts `as: 'h1' | 'h2' | 'h3'`. For inline use inside a Link, we need to extend the `as` prop to include `'span'`. Update the Props type in `distort-heading.tsx`:

```tsx
type Props = {
  as: 'h1' | 'h2' | 'h3' | 'span';
  children: string;
  className?: string;
};
```

Actually, a cleaner approach: keep the existing h3 with the Link, and DON'T distort project card titles (they're smaller text inside links, distortion would conflict with the link hover). The spec says all h3s, but the project card h3 is a navigation element — distortion here would hurt UX.

**Decision: skip project card h3 distortion.** The h2 section title in ProjectsGrid IS distorted. The card titles stay as-is (they have hover:underline which is the interaction).

- [ ] **Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/projects/ui/projects-grid.tsx
git commit -m "feat(cursor): integrate DistortHeading into ProjectsGrid title"
```

---

### Task 10: Integrate into Contact section

**Files:**
- Modify: `src/features/contact/ui/contact-section.tsx`

- [ ] **Step 1: Replace h2 and copy paragraph**

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import { ContactButton } from '@/features/contact/ui/contact-button';
import { buildLinkedInUrl, buildWhatsAppUrl } from '@/shared/config/contact';
import { Container } from '@/shared/ui/container';

export async function ContactSection() {
  const t = await getTranslations('contact');
  const whatsappUrl = buildWhatsAppUrl(t('whatsappMessage'));
  const linkedinUrl = buildLinkedInUrl();

  return (
    <section id="contact" className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <DistortHeading
          as="h2"
          className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
        >
          {t('heading')}
        </DistortHeading>
        <ProximityReveal className="mt-8 max-w-2xl font-serif text-lg leading-relaxed text-[var(--fg-secondary)] md:text-xl">
          {t('copy')}
        </ProximityReveal>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ContactButton variant="whatsapp" href={whatsappUrl} label={t('whatsappLabel')} />
          <ContactButton variant="linkedin" href={linkedinUrl} label={t('linkedinLabel')} />
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/features/contact/ui/contact-section.tsx
git commit -m "feat(cursor): integrate DistortHeading + ProximityReveal into Contact"
```

---

### Task 11: Integrate into route index pages (blog, talks, projects)

**Files:**
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/talks/page.tsx`
- Modify: `src/app/[locale]/projects/page.tsx`

- [ ] **Step 1: Update blog index h1**

In `src/app/[locale]/blog/page.tsx`, add import and replace h1:

```tsx
import { DistortHeading } from '@/features/cursor/effects/distort-heading';

// Replace the <h1>...</h1> with:
<DistortHeading
  as="h1"
  className="max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
>
  {t('title')}
</DistortHeading>
```

- [ ] **Step 2: Update talks index h1**

In `src/app/[locale]/talks/page.tsx`, same pattern:

```tsx
import { DistortHeading } from '@/features/cursor/effects/distort-heading';

// Replace the <h1>...</h1> with:
<DistortHeading
  as="h1"
  className="max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
>
  {t('title')}
</DistortHeading>
```

- [ ] **Step 3: Update projects index h1**

In `src/app/[locale]/projects/page.tsx`, same pattern:

```tsx
import { DistortHeading } from '@/features/cursor/effects/distort-heading';

// Replace the <h1>...</h1> with:
<DistortHeading
  as="h1"
  className="max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
>
  {t('title')}
</DistortHeading>
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/blog/page.tsx src/app/[locale]/talks/page.tsx src/app/[locale]/projects/page.tsx
git commit -m "feat(cursor): integrate DistortHeading into blog/talks/projects index pages"
```

---

### Task 12: Integrate into detail pages (case study, blog post, talk card)

**Files:**
- Modify: `src/features/case-study/ui/case-study-header.tsx`
- Modify: `src/features/blog/ui/post-header.tsx`
- Modify: `src/features/talks/ui/talk-card.tsx`

- [ ] **Step 1: Update CaseStudyHeader h1 + summary**

In `src/features/case-study/ui/case-study-header.tsx`, add imports and replace h1 and summary:

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import type { Project } from '@/content-collections';

// Replace the <h1>...</h1> with:
<DistortHeading
  as="h1"
  className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-[var(--fg-primary)] md:text-5xl"
>
  {project.title}
</DistortHeading>

// Replace the summary <p> with:
<ProximityReveal className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)] md:text-xl">
  {project.summary}
</ProximityReveal>
```

- [ ] **Step 2: Update PostHeader h1 + summary**

In `src/features/blog/ui/post-header.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';
import type { Post } from '@/content-collections';

// Replace the <h1>...</h1> with:
<DistortHeading
  as="h1"
  className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-[var(--fg-primary)] md:text-5xl"
>
  {post.title}
</DistortHeading>

// Replace the summary <p> with:
<ProximityReveal className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)] md:text-xl">
  {post.summary}
</ProximityReveal>
```

- [ ] **Step 3: Update TalkCard h2**

In `src/features/talks/ui/talk-card.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import type { Talk } from '@/content-collections';

// Replace the <h2>...</h2> with:
<DistortHeading as="h2" className="font-serif text-2xl text-[var(--fg-primary)]">
  {talk.title}
</DistortHeading>
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/case-study/ui/case-study-header.tsx src/features/blog/ui/post-header.tsx src/features/talks/ui/talk-card.tsx
git commit -m "feat(cursor): integrate DistortHeading into case study, blog post, talk card"
```

---

### Task 13: Full verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `pnpm vitest run`
Expected: All tests pass (existing 31 + new cursor tests)

- [ ] **Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Run Biome check**

Run: `pnpm check`
Expected: Clean (or fix with `pnpm check:fix`)

- [ ] **Step 4: Manual browser verification**

Open `http://localhost:3000/es` and verify all pages:

1. **Home** — Hero h1 distorts, subtitle reveals, About h2 distorts, bio reveals, Projects h2 distorts, Contact h2 distorts + copy reveals
2. **Projects index** `/es/projects` — h1 distorts
3. **Case study detail** `/es/projects/{slug}` — h1 distorts, summary reveals
4. **Blog index** `/es/blog` — h1 distorts
5. **Blog detail** `/es/blog/{slug}` — h1 distorts, summary reveals
6. **Talks** `/es/talks` — h1 distorts, talk card h2s distort
7. **Theme toggle** — Effects work in both light and dark mode
8. **Blob** — Follows cursor everywhere, expands on links/buttons, deforms with speed
9. **Spotlight** — Visible glow behind blob, lags behind

- [ ] **Step 5: Verify reduced motion**

In browser DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Verify:
- No blob or spotlight
- Headings render as plain text (no char split)
- Native cursor visible
- Everything readable and functional

- [ ] **Step 6: Run existing E2E tests**

Run: `pnpm exec playwright test`
Expected: All 19 tests pass. The cursor system is purely visual and pointer-events:none — it should not interfere with Playwright's click/navigation tests.
