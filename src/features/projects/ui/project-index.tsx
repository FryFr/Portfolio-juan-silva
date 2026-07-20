'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCursor } from '@/features/cursor/context/use-cursor';
import { useCursorActive } from '@/features/cursor/lib/use-cursor-active';

export type IndexEntry = {
  slug: string;
  title: string;
  year: number;
  stack: string[];
  cover?: string;
  href: string;
};

type Props = {
  entries: IndexEntry[];
};

/**
 * Typographic index of featured work. Hovering a row floats that project's cover
 * near the cursor.
 *
 * Position comes from the existing CursorProvider rather than a second mousemove
 * listener on a wrapper div — one global tracker already writes cursor position to
 * a ref, and hanging pointer handlers off non-interactive elements is both a lint
 * violation and a hint the interaction is attached to the wrong node.
 *
 * The preview is an enhancement over markup that already works: rows are ordinary
 * links carrying title, year and stack. On touch, with reduced motion, or with JS
 * off you get a clean list and lose only the flourish.
 */
export function ProjectIndex({ entries }: Props) {
  const active = useCursorActive();
  const cursorRef = useCursor();
  const [hovered, setHovered] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const current = entries.find((e) => e.slug === hovered);
  const showPreview = active && Boolean(current?.cover);

  useEffect(() => {
    if (!showPreview) return;
    let raf = 0;
    const tick = () => {
      const el = previewRef.current;
      if (el) {
        const { x, y } = cursorRef.current;
        el.style.transform = `translate3d(${x + 28}px, ${y - 130}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showPreview, cursorRef]);

  return (
    <div className="relative">
      <ul className="reveal-stagger">
        {entries.map((entry, i) => (
          <li key={entry.slug} style={{ '--i': i } as React.CSSProperties}>
            <Link
              href={entry.href}
              // Handlers live on the link, the element that is actually
              // interactive, so focus and hover stay in sync for keyboard users.
              onMouseEnter={() => setHovered(entry.slug)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(entry.slug)}
              onBlur={() => setHovered(null)}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-6 border-t border-border py-8 transition-colors duration-150 ease-out-expo hover:border-accent md:py-10"
            >
              <span className="min-w-0">
                <span className="block font-sans text-3xl font-light leading-tight text-foreground transition-colors duration-150 ease-out-expo group-hover:text-accent md:text-5xl">
                  {entry.title}
                </span>
                <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-eyebrow uppercase text-muted">
                  {entry.stack.slice(0, 4).map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 font-mono text-eyebrow uppercase text-muted">
                {entry.year}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {showPreview && current?.cover && (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-40 hidden h-60 w-44 overflow-hidden rounded-sm border border-border shadow-lg md:block"
        >
          <Image src={current.cover} alt="" fill className="object-cover" sizes="176px" />
        </div>
      )}
    </div>
  );
}
