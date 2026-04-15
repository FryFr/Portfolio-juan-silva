import { getTranslations } from 'next-intl/server';
import type { Talk } from '@/content-collections';

type Props = {
  talk: Talk;
};

export async function TalkCard({ talk }: Props) {
  const t = await getTranslations('talks.index');

  const eyebrowParts = [String(talk.year), talk.event];
  if (talk.city) {
    eyebrowParts.push(talk.city);
  }

  return (
    <article className="flex flex-col gap-4 border-t border-[var(--bg-tertiary)] pt-8">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-muted)]">
        {eyebrowParts.join(' · ')}
      </p>
      <h2 className="font-serif text-2xl text-[var(--fg-primary)]">{talk.title}</h2>
      <p className="max-w-2xl font-serif text-base italic text-[var(--fg-tertiary)]">
        {talk.summary}
      </p>
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-muted)]">
        {t('deliveredIn')}: {talk.language.toUpperCase()}
      </p>
      {(talk.slides || talk.video) && (
        <ul className="flex flex-wrap gap-6">
          {talk.slides && (
            <li>
              <a
                href={talk.slides}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--accent)] underline underline-offset-4"
              >
                {t('slides')}
              </a>
            </li>
          )}
          {talk.video && (
            <li>
              <a
                href={talk.video}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--accent)] underline underline-offset-4"
              >
                {t('video')}
              </a>
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
