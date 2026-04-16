import { getTranslations } from 'next-intl/server';
import type { Post } from '@/content-collections';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';

type Props = {
  post: Post;
};

export async function PostHeader({ post }: Props) {
  const t = await getTranslations('blog.detail');
  const reading = post.readingTimeMinutes ?? 5;

  return (
    <header className="flex flex-col gap-8">
      <DistortHeading
        as="h1"
        className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-[var(--fg-primary)] md:text-5xl"
      >
        {post.title}
      </DistortHeading>

      <ProximityReveal className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)] md:text-xl">
        {post.summary}
      </ProximityReveal>

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        <span>
          {t('publishedOn')} {post.publishedAt}
        </span>
        <span className="mx-2">·</span>
        <span>{t('readingTime', { minutes: reading })}</span>
      </p>

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[var(--fg-secondary)]">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="border border-[var(--bg-tertiary)] px-2 py-1 uppercase tracking-[0.15em]"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
