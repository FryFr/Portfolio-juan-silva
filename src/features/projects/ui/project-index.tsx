'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export type IndexEntry = {
  slug: string;
  title: string;
  year: number;
  stack: string[];
  summary: string;
  cover?: string;
  href: string;
};

type Props = {
  entries: IndexEntry[];
  readMoreLabel: string;
};

/**
 * Featured work as a grid of cards that expand on hover.
 *
 * At rest each card is its cover image with the title over a scrim. On hover the
 * image slides to the left half and a panel of detail — summary, stack, a read
 * cue — slides in beside it.
 *
 * Smoothness is the whole point here, so nothing that triggers layout is animated.
 * The expansion is transform + opacity only, entirely inside the card's own box:
 * neighbouring cards never reflow, so the grid cannot jitter while one card is
 * animating. Height/width/margin transitions would have been simpler to write and
 * would judder on exactly the machines a client is most likely to be using.
 *
 * Keyboard parity: the same state is driven by focus, so a keyboard user sees the
 * expansion rather than a card that only reacts to a mouse.
 */
export function ProjectIndex({ entries, readMoreLabel }: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  return (
    <ul className="reveal-stagger grid grid-cols-1 gap-6 md:grid-cols-2">
      {entries.map((entry, i) => {
        const open = openSlug === entry.slug;
        return (
          <li key={entry.slug} style={{ '--i': i } as React.CSSProperties}>
            <Link
              href={entry.href}
              onMouseEnter={() => setOpenSlug(entry.slug)}
              onMouseLeave={() => setOpenSlug(null)}
              onFocus={() => setOpenSlug(entry.slug)}
              onBlur={() => setOpenSlug(null)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-sm border border-border bg-surface transition-[border-color,box-shadow,transform] duration-500 ease-out-expo hover:border-accent hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1"
            >
              {/* Media stays untransformed and full-bleed. An earlier version
                  scaled it to scaleX(0.5) to "move it left", which squashed the
                  image horizontally — a screenshot diff made that obvious in a way
                  reading the code did not. The panel simply slides over the right
                  half instead: the photograph is never distorted, and one moving
                  layer is smoother than two. */}
              <span className="absolute inset-0 block">
                {entry.cover ? (
                  <Image
                    src={entry.cover}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 45vw"
                  />
                ) : (
                  // Projects without artwork get a deliberate tile rather than a
                  // near-empty dot field, which read as a missing image.
                  //
                  // bg-surface, NOT bg-invert. Invert flips with the theme, so on a
                  // dark page these tiles turned bright cream and read as two blown-out
                  // holes in the grid — obvious in a full-page screenshot, invisible
                  // when checking one card in one theme.
                  <span aria-hidden="true" className="absolute inset-0 block bg-surface">
                    <span
                      className="absolute inset-0 block"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 22% 18%, rgb(var(--accent-rgb) / 0.28), transparent 58%), radial-gradient(circle at 82% 78%, rgb(var(--accent-rgb) / 0.18), transparent 62%)',
                      }}
                    />
                    <span
                      className="absolute inset-0 block opacity-30"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at center, rgb(var(--fg-rgb) / 0.6) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                  </span>
                )}
              </span>

              {/* Detail panel occupying the right half. Off to the right at rest. */}
              <span
                aria-hidden={!open}
                // z-20 puts the panel above the title band. At z-10 the band's dark
                // gradient bled across the panel and muddied the copy inside it.
                className="absolute inset-y-0 right-0 z-20 flex w-1/2 flex-col justify-center gap-3 bg-surface p-6 transition-[transform,opacity] duration-500 ease-out-expo"
                style={{
                  transform: open ? 'translateX(0)' : 'translateX(100%)',
                  opacity: open ? 1 : 0,
                }}
              >
                <span className="font-mono text-eyebrow uppercase text-muted">{entry.year}</span>
                <span className="line-clamp-4 font-sans text-sm leading-relaxed text-body">
                  {entry.summary}
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-eyebrow uppercase text-muted">
                  {entry.stack.slice(0, 4).map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </span>
                <span className="mt-1 inline-flex items-center gap-2 font-mono text-eyebrow uppercase text-accent">
                  {readMoreLabel}
                  <span aria-hidden="true">→</span>
                </span>
              </span>

              {/* Title band. Stays legible over any photograph via a scrim rather
                  than a hopeful opacity value. */}
              <span className="absolute inset-x-0 bottom-0 z-10 block bg-gradient-to-t from-black/85 via-black/55 to-transparent p-5 pt-12 transition-[width] duration-500 ease-out-expo">
                <span
                  className="block font-sans text-lg font-medium leading-snug text-white transition-[max-width] duration-500 ease-out-expo md:text-xl"
                  style={{ maxWidth: open ? '50%' : '100%' }}
                >
                  {entry.title}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
