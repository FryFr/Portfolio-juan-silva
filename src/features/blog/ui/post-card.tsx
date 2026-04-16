import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { Post } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';

type Props = {
  post: Post;
  locale: Locale;
};

export async function PostCard({ post, locale }: Props) {
  const t = await getTranslations('blog.index');
  const reading = post.readingTimeMinutes ?? 5;

  return (
    <article className="group flex flex-col gap-4 border-t border-[var(--bg-tertiary)] pt-8">
      <Link
        href={`/${locale}/blog/${post.slug}`}
        className="flex flex-col gap-4 underline-offset-4"
      >
        <h3 className="font-serif text-2xl text-[var(--fg-primary)] group-hover:underline">
          {post.title}
        </h3>
        <p className="max-w-2xl font-serif text-base italic text-[var(--fg-tertiary)]">
          {post.summary}
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-muted)]">
          <span>{post.publishedAt}</span>
          <span className="mx-2">·</span>
          <span>{t('readingTime', { minutes: reading })}</span>
        </p>
      </Link>
    </article>
  );
}
