import { getTranslations } from 'next-intl/server';
import { ABOUT_TIMELINE_KEYS } from '@/features/about/data';

export async function Timeline() {
  const t = await getTranslations('home.about');

  return (
    <ol className="mt-8 space-y-6">
      {ABOUT_TIMELINE_KEYS.map((key) => (
        <li key={key} className="grid grid-cols-[auto_1fr] gap-6 border-t border-border pt-6">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            {t(`timeline.${key}.period`)}
          </span>
          <div>
            <p className="font-serif text-lg text-foreground">{t(`timeline.${key}.role`)}</p>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-subtle">
              {t(`timeline.${key}.place`)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
