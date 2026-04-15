import { getTranslations } from 'next-intl/server';
import { getTalks } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { TalkCard } from './talk-card';

type Props = {
  locale: Locale;
};

export async function TalksGrid({ locale }: Props) {
  const t = await getTranslations('talks.index');
  const talks = getTalks(locale);

  if (talks.length === 0) {
    return <p className="mt-12 font-serif italic text-[var(--fg-tertiary)]">{t('empty')}</p>;
  }

  return (
    <ul className="mt-16 space-y-16">
      {talks.map((talk) => (
        <li key={talk.slug}>
          <TalkCard talk={talk} />
        </li>
      ))}
    </ul>
  );
}
