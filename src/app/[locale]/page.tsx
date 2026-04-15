import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home.hero');
  const tPlaceholder = await getTranslations('placeholder');

  return (
    <main>
      <Container size="wide" className="py-24 md:py-32">
        <div className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          <span className="text-[var(--accent)]">$</span> {t('prompt')}
        </div>
        <h1 className="font-serif text-7xl font-normal leading-[0.88] tracking-[-0.03em] text-[var(--fg-primary)] md:text-9xl">
          {t('title')}
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-xl italic text-[var(--fg-tertiary)] md:text-2xl">
          {t('subtitle')}
        </p>
        <div className="mt-16 max-w-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]/60 p-6 font-mono text-sm text-[var(--fg-tertiary)]">
          {tPlaceholder('itWorks')}
        </div>
      </Container>
    </main>
  );
}
