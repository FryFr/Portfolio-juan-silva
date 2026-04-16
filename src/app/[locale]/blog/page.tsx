import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PostCard } from '@/features/blog/ui/post-card';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { getPosts } from '@/shared/content';
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
  const t = await getTranslations({ locale, namespace: 'blog.index' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const t = await getTranslations('blog.index');
  const posts = getPosts(typedLocale);

  return (
    <main>
      <section>
        <Container size="wide" className="py-24 md:py-32">
          <DistortHeading
            as="h1"
            className="max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl"
          >
            {t('title')}
          </DistortHeading>
          <p className="mt-6 max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)]">
            {t('subtitle')}
          </p>

          {posts.length === 0 ? (
            <p className="mt-12 font-serif italic text-[var(--fg-tertiary)]">{t('empty')}</p>
          ) : (
            <ul className="mt-16 space-y-16">
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} locale={typedLocale} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </main>
  );
}
