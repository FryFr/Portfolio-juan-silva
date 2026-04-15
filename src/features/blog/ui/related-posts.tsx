import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Post } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = {
  posts: Post[];
  locale: Locale;
};

export async function RelatedPosts({ posts, locale }: Props) {
  if (posts.length === 0) return null;
  const t = await getTranslations('blog.detail');

  return (
    <section className="flex flex-col gap-8 border-t border-[var(--bg-tertiary)] pt-12">
      <h2 className="font-serif text-2xl text-[var(--fg-primary)] md:text-3xl">
        {t('relatedTitle')}
      </h2>
      <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/${locale}/blog/${post.slug}`}
              className="flex flex-col gap-3 underline-offset-4 hover:underline"
            >
              <h3 className="font-serif text-xl text-[var(--fg-primary)]">{post.title}</h3>
              <p className="font-serif text-base italic text-[var(--fg-tertiary)]">
                {post.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
