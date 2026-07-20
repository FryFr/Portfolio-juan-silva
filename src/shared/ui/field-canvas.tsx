'use client';

import { useEffect, useRef } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useCursorActive } from '@/features/cursor/lib/use-cursor-active';
import { makeNoise2D } from '@/shared/lib/noise';

type Kind = 'flow' | 'lattice';

/**
 * Which surface the field is drawn on.
 *
 * `invert` is not cosmetic. The contact band paints --bg-invert, so a field using
 * --fg-rgb resolves to dark marks on a dark ground there — the same class of
 * mistake as the original ProximityReveal bug, where a colour calibrated for one
 * ground was reused on another. On an inverted surface the field reads from
 * --fg-invert-rgb instead, and drops the accent, which is tuned for the page
 * background and disappears against the inverted one.
 */
type Tone = 'default' | 'invert';

type Props = {
  kind: Kind;
  tone?: Tone;
  className?: string;
  /** 0–1 multiplier. Lets quieter sections carry the same field more softly. */
  intensity?: number;
};

type Particle = { x: number; y: number; life: number };

const noise = makeNoise2D();

/**
 * Ambient generative field, drawn behind content.
 *
 * Canvas 2D rather than WebGL: both fields are two-dimensional point systems, so
 * three.js would cost ~150KB to draw something flat. This is zero dependency.
 *
 * Cursor reactivity reads from the existing CursorProvider ref rather than
 * attaching another mousemove listener — one tracker already runs for the blob
 * and spotlight, and a second would double the work on every pointer move for no
 * additional information.
 *
 * Purely decorative: aria-hidden, and every caller renders real content on top
 * that stands alone if this never paints.
 */
export function FieldCanvas({ kind, tone = 'default', className, intensity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useCursor();
  const cursorActive = useCursorActive();
  // Read through a ref so toggling pointer capability never restarts the loop.
  const cursorEnabled = useRef(cursorActive);
  cursorEnabled.current = cursorActive;
  const toneRef = useRef(tone);
  toneRef.current = tone;
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    const canvas: HTMLCanvasElement = maybeCanvas;

    // Reduced motion bails before acquiring a context, so nothing is ever painted.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    // Uncapped devicePixelRatio on a 3x phone is a 9x fill cost — the entire
    // performance budget spent on decoration.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = false;
    let particles: Particle[] = [];

    const root = document.documentElement;
    const token = (name: string, fallback: string) =>
      getComputedStyle(root).getPropertyValue(name).trim() || fallback;

    function seed() {
      const count = Math.round((width * height) / 620);
      particles = Array.from({ length: Math.min(count, 2600) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        life: Math.random() * 260,
      }));
      ctx.clearRect(0, 0, width, height);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    /** Cursor in canvas-local coordinates, or null when it should be ignored. */
    function localCursor() {
      if (!cursorEnabled.current) return null;
      const rect = canvas.getBoundingClientRect();
      const x = cursorRef.current.x - rect.left;
      const y = cursorRef.current.y - rect.top;
      const margin = 180;
      if (x < -margin || y < -margin || x > width + margin || y > height + margin) {
        return null;
      }
      return { x, y };
    }

    const FLOW_RADIUS = 240;
    const LATTICE_RADIUS = 200;

    function drawFlow(t: number, cursor: { x: number; y: number } | null) {
      // Fade the previous frame rather than clearing it — this is what makes the
      // trails, and it costs one fillRect instead of storing point history.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.075)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      const inverted = toneRef.current === 'invert';
      const ink = inverted
        ? token('--fg-invert-rgb', '245 241 234')
        : token('--accent-rgb', '122 96 48');
      const k = intensityRef.current;
      ctx.lineWidth = 1;
      const r2 = FLOW_RADIUS * FLOW_RADIUS;

      for (const p of particles) {
        let angle = noise(p.x * 0.0022, p.y * 0.0022 + t * 0.12) * Math.PI * 2.4;
        let boost = 1;

        if (cursor) {
          const dx = p.x - cursor.x;
          const dy = p.y - cursor.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            const f = 1 - Math.sqrt(d2) / FLOW_RADIUS;
            // Tangential, not attractive. An attractor collapses the whole field
            // into a single dot within a couple of seconds; a vortex keeps it
            // alive and reads as the field being stirred.
            const tangent = Math.atan2(dy, dx) + Math.PI / 2;
            angle = angle * (1 - f * 0.85) + tangent * (f * 0.85);
            boost = 1 + f * 2.2;
          }
        }

        const step = 2.4 * boost;
        const nx = p.x + Math.cos(angle) * step;
        const ny = p.y + Math.sin(angle) * step;

        ctx.strokeStyle = `rgb(${ink} / ${0.42 * k * Math.min(boost, 1.9)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();

        p.x = nx;
        p.y = ny;
        p.life -= 1;
        if (p.life < 0 || nx < 0 || nx > width || ny < 0 || ny > height) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 140 + Math.random() * 240;
        }
      }
    }

    function drawLattice(t: number, cursor: { x: number; y: number } | null) {
      ctx.clearRect(0, 0, width, height);
      const gap = 22;
      const amp = 26;
      const inverted = toneRef.current === 'invert';
      const fg = inverted ? token('--fg-invert-rgb', '245 241 234') : token('--fg-rgb', '26 18 8');
      // The accent is tuned against the page background and vanishes on the
      // inverted band, so there the highlight is just a brighter ink.
      const accent = inverted ? fg : token('--accent-rgb', '122 96 48');
      const k = intensityRef.current;
      const r2 = LATTICE_RADIUS * LATTICE_RADIUS;

      for (let y = gap; y < height; y += gap) {
        for (let x = gap; x < width; x += gap) {
          const n = noise(x * 0.004, y * 0.004 + t * 0.32);
          let px = x + Math.cos(n * Math.PI * 2) * amp * n;
          let py = y + Math.sin(n * Math.PI * 2) * amp * n;
          let m = Math.min(Math.abs(n), 1);

          if (cursor) {
            const dx = px - cursor.x;
            const dy = py - cursor.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2 && d2 > 0.001) {
              const d = Math.sqrt(d2);
              // Smootherstep falloff. A linear push leaves a visible circular seam
              // at the influence radius, and once seen it cannot be unseen.
              const u = 1 - d / LATTICE_RADIUS;
              const f = u * u * u * (u * (u * 6 - 15) + 10);
              px += (dx / d) * f * 48;
              py += (dy / d) * f * 48;
              m = Math.min(1, m + f * 0.55);
            }
          }

          const hot = m > 0.55;
          ctx.fillStyle = hot
            ? `rgb(${accent} / ${0.8 * k})`
            : `rgb(${fg} / ${(0.1 + m * 0.32) * k})`;
          ctx.beginPath();
          ctx.arc(px, py, hot ? 1.9 : 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame(now: number) {
      if (!visible || width === 0) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = now / 1000;
      const cursor = localCursor();
      if (kind === 'flow') drawFlow(t, cursor);
      else drawLattice(t, cursor);
      raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [kind, cursorRef]);

  // aria-hidden lives on the wrapper: a canvas counts as focusable, and hiding a
  // focusable node from assistive tech strands keyboard users on something screen
  // readers refuse to announce.
  return (
    <span aria-hidden="true" className={className}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </span>
  );
}
