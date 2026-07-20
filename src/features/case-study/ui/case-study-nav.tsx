import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Project } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = {
  locale: Locale;
  prev: Project | undefined;
  next: Project | undefined;
};

export async function CaseStudyNav({ locale, prev, next }: Props) {
  if (!prev && !next) return null;

  const t = await getTranslations('projects.detail');

  return (
    <nav className="grid grid-cols-1 gap-6 border-t border-border pt-12 md:grid-cols-2">
      {prev ? (
        <Link
          href={`/${locale}/projects/${prev.slug}`}
          className="group flex flex-col gap-2 text-left"
        >
          <span className="font-mono text-eyebrow uppercase text-muted">{t('prev')}</span>
          <span className="font-serif text-2xl text-foreground underline-offset-4 group-hover:underline">
            {prev.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/${locale}/projects/${next.slug}`}
          className="group flex flex-col gap-2 text-right md:items-end"
        >
          <span className="font-mono text-eyebrow uppercase text-muted">{t('next')}</span>
          <span className="font-serif text-2xl text-foreground underline-offset-4 group-hover:underline">
            {next.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
