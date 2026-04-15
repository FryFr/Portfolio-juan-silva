import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TalksGrid } from '@/features/talks/ui/talks-grid';
import { type Locale, routing } from '@/shared/i18n/routing';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'talks.index' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function TalksIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const t = await getTranslations('talks.index');

  return (
    <main>
      <section>
        <Container size="wide" className="py-24 md:py-32">
          <h1 className="max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-6 max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)]">
            {t('subtitle')}
          </p>

          <TalksGrid locale={typedLocale} />
        </Container>
      </section>
    </main>
  );
}
