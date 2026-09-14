import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { routing } from '@/shared/i18n/routing';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return {
    title: t('title'),
    description: t('personalUse'),
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('privacy');

  return (
    <main>
      <section>
        <Container size="wide" className="py-24 md:py-32">
          <DistortHeading
            as="h1"
            className="max-w-3xl font-sans text-4xl font-normal leading-[1] tracking-[-0.02em] text-foreground md:text-6xl"
          >
            {t('title')}
          </DistortHeading>
          <ol className="mt-6 max-w-2xl list-decimal space-y-4 pl-6 font-sans text-lg text-subtle">
            <li>{t('personalUse')}</li>
            <li>{t('access')}</li>
            <li>{t('sharing')}</li>
            <li>{t('storage')}</li>
            <li>{t('contact')}</li>
          </ol>
        </Container>
      </section>
    </main>
  );
}
