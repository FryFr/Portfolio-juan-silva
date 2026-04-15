import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home.hero');
  const tPlaceholder = await getTranslations('placeholder');

  return (
    <main className="mx-auto max-w-5xl px-8 py-24">
      <div className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-[--fg-muted]">
        <span className="text-[--accent]">$</span> {t('prompt')}
      </div>
      <h1 className="font-serif text-7xl font-normal leading-[0.88] tracking-[-0.03em] text-[--fg-primary] md:text-9xl">
        {t('title')}
      </h1>
      <p className="mt-6 max-w-2xl font-serif text-xl italic text-[--fg-tertiary] md:text-2xl">
        {t('subtitle')}
      </p>
      <div className="mt-16 rounded border border-[--bg-tertiary] bg-white/40 p-6 font-mono text-sm text-[--fg-tertiary]">
        {tPlaceholder('itWorks')}
      </div>
    </main>
  );
}
