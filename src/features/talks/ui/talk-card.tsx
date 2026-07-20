import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Talk } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = {
  talk: Talk;
  locale: Locale;
};

export async function TalkCard({ talk, locale }: Props) {
  const t = await getTranslations('talks.index');
  const href = `/${locale}/talks/${talk.slug}`;

  const eyebrowParts = [String(talk.year), talk.event];
  if (talk.city) {
    eyebrowParts.push(talk.city);
  }

  return (
    <article className="group flex flex-col gap-4 border-t border-border pt-8">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
        {eyebrowParts.join(' · ')}
      </p>
      <h2 className="font-serif text-2xl text-foreground">
        <Link
          href={href}
          className="underline-offset-4 transition-colors duration-150 ease-out-expo hover:text-accent hover:underline"
        >
          {talk.title}
        </Link>
      </h2>
      <p className="max-w-2xl font-serif text-base italic text-subtle">{talk.summary}</p>
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
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
                className="font-mono text-xs uppercase tracking-[0.15em] text-accent underline underline-offset-4"
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
                className="font-mono text-xs uppercase tracking-[0.15em] text-accent underline underline-offset-4"
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
