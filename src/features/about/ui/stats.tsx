import { getTranslations } from 'next-intl/server';

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
    <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="sr-only">{stat.label}</dt>
          <dd>
            <span className="block font-serif text-5xl leading-none tracking-[-0.03em] text-foreground md:text-6xl">
              {stat.value}
            </span>
            <span className="mt-3 block font-mono text-eyebrow uppercase text-muted">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
