import { getTranslations } from 'next-intl/server';
import { ABOUT_TIMELINE_KEYS } from '@/features/about/data';

/**
 * The rail "charges" as it scrolls through the viewport, and each node fills as
 * its entry arrives — a signal travelling a path rather than a list of dates.
 *
 * Entirely CSS scroll-driven: no client component, no library, no scroll listener.
 * scroll-timeline drives the rail's scaleY; view-timeline drives each node.
 */
export async function Timeline() {
  const t = await getTranslations('home.about');

  return (
    <div className="timeline relative mt-8">
      {/* Static rail. */}
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-[3px] w-px bg-border" />
      {/* Charging rail, scaled by scroll progress through the list. */}
      <span
        aria-hidden="true"
        className="timeline-charge absolute top-2 bottom-2 left-[3px] w-px bg-accent"
      />

      <ol className="space-y-8">
        {ABOUT_TIMELINE_KEYS.map((key, i) => (
          <li
            key={key}
            style={{ '--i': i } as React.CSSProperties}
            className="timeline-item relative grid grid-cols-[auto_1fr] gap-5 pl-6"
          >
            <span
              aria-hidden="true"
              className="timeline-node absolute top-1.5 left-0 h-[7px] w-[7px] rounded-full border border-accent bg-background"
            />
            <span className="col-span-2 font-mono text-eyebrow uppercase text-muted">
              {t(`timeline.${key}.period`)}
            </span>
            <div className="col-span-2">
              <p className="font-sans text-lg text-foreground">{t(`timeline.${key}.role`)}</p>
              <p className="mt-1 font-mono text-eyebrow uppercase text-subtle">
                {t(`timeline.${key}.place`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
