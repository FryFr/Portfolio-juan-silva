import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { allTalks } from '@/content-collections';
import { getTalkBySlug } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { MdxBody } from '@/shared/mdx/mdx-body';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return allTalks.map((t) => ({ locale: t.locale, slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const talk = getTalkBySlug(locale as Locale, slug);
  if (!talk) return {};
  return {
    title: talk.title,
    description: talk.summary,
  };
}

export default async function TalkDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const talk = getTalkBySlug(typedLocale, slug);
  if (!talk) notFound();

  const t = await getTranslations('talks.detail');
  const tIndex = await getTranslations('talks.index');

  return (
    <main>
      <Container size="narrow" className="py-24 md:py-32">
        <Link
          href={`/${typedLocale}/talks`}
          className="font-mono text-xs uppercase tracking-[0.15em] text-body underline-offset-4 transition-colors duration-150 ease-out-expo hover:text-accent hover:underline"
        >
          {t('backToList')}
        </Link>

        <header className="mt-12">
          <h1 className="max-w-3xl font-sans text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-foreground md:text-5xl">
            {talk.title}
          </h1>
          <p className="mt-6 max-w-2xl font-sans text-lg italic text-subtle md:text-xl">
            {talk.summary}
          </p>

          <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-eyebrow uppercase text-muted">{t('event')}</dt>
              <dd className="mt-1 font-sans text-base text-body">
                {talk.city ? `${talk.event} · ${talk.city}` : talk.event}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow uppercase text-muted">{t('year')}</dt>
              <dd className="mt-1 font-sans text-base text-body">{talk.year}</dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow uppercase text-muted">{t('language')}</dt>
              <dd className="mt-1 font-sans text-base text-body">{talk.language.toUpperCase()}</dd>
            </div>
          </dl>

          {(talk.slides || talk.video) && (
            <ul className="mt-8 flex flex-wrap gap-6">
              {talk.slides && (
                <li>
                  <a
                    href={talk.slides}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-accent underline underline-offset-4 transition-colors duration-150 ease-out-expo hover:text-foreground"
                  >
                    {tIndex('slides')}
                  </a>
                </li>
              )}
              {talk.video && (
                <li>
                  <a
                    href={talk.video}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-xs uppercase tracking-[0.15em] text-accent underline underline-offset-4 transition-colors duration-150 ease-out-expo hover:text-foreground"
                  >
                    {tIndex('video')}
                  </a>
                </li>
              )}
            </ul>
          )}
        </header>

        <article className="mt-16 max-w-none font-sans text-body">
          <MdxBody code={talk.body} />
        </article>
      </Container>
    </main>
  );
}
