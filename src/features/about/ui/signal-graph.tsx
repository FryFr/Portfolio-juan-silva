'use client';

import { useEffect, useRef } from 'react';

export type GraphCategory = {
  key: string;
  label: string;
  items: string[];
};

type Props = {
  categories: GraphCategory[];
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hub: boolean;
  group: number;
};

type Edge = { a: number; b: number };

/**
 * Decorative node graph behind the capability list.
 *
 * Canvas 2D, not three.js: a node graph is inherently flat, so WebGL would add
 * ~150KB to draw something two-dimensional. This is ~0 KB of dependency.
 *
 * aria-hidden and purely decorative — the real content is the linked skill list
 * rendered beside it, which works with the canvas absent, JS disabled, or reduced
 * motion on.
 */
export function SignalGraph({ categories }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const maybeCanvas = canvasRef.current;
    if (!maybeCanvas) return;
    // Same reason as ctx below: narrowing on a ref-derived value does not survive
    // into hoisted function declarations, so bind it once with an explicit type.
    const canvas: HTMLCanvasElement = maybeCanvas;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const maybeCtx = canvas.getContext('2d');
    if (!maybeCtx) return;
    // Bound to a fresh const so the non-null narrowing survives into the rAF and
    // resize closures below, which TypeScript widens back to `| null` otherwise.
    const ctx: CanvasRenderingContext2D = maybeCtx;

    // Cap DPR: uncapped devicePixelRatio on a 3x phone is a 9x fill cost and would
    // spend the entire performance budget on decoration.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = false;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    function build() {
      nodes.length = 0;
      edges.length = 0;
      categories.forEach((cat, gi) => {
        const hubIndex = nodes.length;
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: 3.5,
          hub: true,
          group: gi,
        });
        cat.items.forEach(() => {
          const idx = nodes.length;
          nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
            r: 1.6,
            hub: false,
            group: gi,
          });
          edges.push({ a: hubIndex, b: idx });
        });
      });
      // Link the hubs so the four domains read as one system, which is the point.
      const hubs = nodes.map((n, i) => (n.hub ? i : -1)).filter((i) => i >= 0);
      for (let i = 0; i < hubs.length - 1; i++) {
        const a = hubs[i];
        const b = hubs[i + 1];
        if (a !== undefined && b !== undefined) edges.push({ a, b });
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    const accent = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7a6030';
    const muted = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--fg-muted').trim() || '#6b5943';

    let t = 0;
    function frame() {
      if (!visible) {
        raf = requestAnimationFrame(frame);
        return;
      }
      t += 0.012;
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      ctx.strokeStyle = muted();
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Signal pulses travelling the edges — the "signal" half of the concept.
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent();
      edges.forEach((e, i) => {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!a || !b) return;
        const p = (t * 0.35 + i * 0.11) % 1;
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = muted();
      for (const n of nodes) {
        ctx.globalAlpha = n.hub ? 0.75 : 0.4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      ro.disconnect();
    };
  }, [categories]);

  // aria-hidden goes on the wrapper, not the canvas: a canvas element counts as
  // focusable, and hiding a focusable node from assistive tech strands keyboard
  // users on something screen readers refuse to announce.
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 block">
      <canvas ref={canvasRef} className="h-full w-full" />
    </span>
  );
}
