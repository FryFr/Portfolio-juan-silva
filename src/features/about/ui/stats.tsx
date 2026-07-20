import { getTranslations } from 'next-intl/server';
import { CountUp } from '@/features/about/ui/count-up';

type Stat = { value: string; label: string };

/**
 * Leading 1200 people and driving a 30% sales increase were buried mid-sentence in
 * the second bio paragraph, where nobody scanning the page would ever find them.
 * Numbers are the most scannable thing on any page — set them large and let the
 * label do the explaining.
 */
export async function Stats() {
  const t = await getTranslations('home.about');
  const stats = t.raw('stats') as Stat[];

  return (
    <dl className="reveal-stagger grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
      {stats.map((stat, i) => (
        <div key={stat.label} style={{ '--i': i } as React.CSSProperties}>
          <dt className="sr-only">{stat.label}</dt>
          <dd>
            <span className="block font-sans text-6xl font-light leading-none tracking-[-0.04em] text-foreground md:text-7xl">
              <CountUp value={stat.value} />
            </span>
            <span className="mt-4 block font-mono text-eyebrow uppercase text-muted">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
