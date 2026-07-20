import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { allPosts } from '@/content-collections';
import { PostHeader } from '@/features/blog/ui/post-header';
import { RelatedPosts } from '@/features/blog/ui/related-posts';
import { getPostBySlug, getRelatedPosts } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { MdxBody } from '@/shared/mdx/mdx-body';
import { Container } from '@/shared/ui/container';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return allPosts.filter((p) => !p.draft).map((p) => ({ locale: p.locale, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPostBySlug(locale as Locale, slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;

  const post = getPostBySlug(typedLocale, slug);
  if (!post || post.draft) notFound();

  const related = getRelatedPosts(typedLocale, slug, 3);
  const t = await getTranslations('blog.detail');

  return (
    <main>
      <Container size="narrow" className="py-24 md:py-32">
        <Link
          href={`/${typedLocale}/blog`}
          className="font-mono text-xs uppercase tracking-[0.15em] text-body underline-offset-4 transition-colors duration-150 ease-out-expo hover:text-accent hover:underline"
        >
          {t('backToList')}
        </Link>

        <div className="mt-12">
          <PostHeader post={post} />
        </div>

        <article className="mt-16 max-w-none font-serif text-body">
          <MdxBody code={post.body} />
        </article>

        <div className="mt-24">
          <RelatedPosts posts={related} locale={typedLocale} />
        </div>
      </Container>
    </main>
  );
}
