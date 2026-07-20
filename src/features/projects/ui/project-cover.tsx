import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';
import { cn } from '@/shared/lib/cn';

type Props = {
  project: Project;
  locale: Locale;
  className?: string;
  sizes?: string;
};

/**
 * The cover slot is structural — it always renders.
 *
 * Previously the whole block was guarded on `project.cover`, so any project whose
 * frontmatter lacked an image collapsed to a text-only card. In a stack of five
 * that produced image / image / TEXT / image / TEXT, which reads as a rendering
 * bug rather than a choice.
 *
 * When there is no image we draw a typographic tile instead. A deliberate tile
 * reads as design; a hole reads as broken. More importantly, layout no longer
 * depends on content completeness.
 */
export function ProjectCover({ project, locale, className, sizes }: Props) {
  const href = `/${locale}/projects/${project.slug}`;
  const frame = cn(
    'relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-sm border border-border bg-surface',
    className,
  );

  if (project.cover) {
    return (
      <Link href={href} className={frame}>
        <Image
          src={project.cover}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
          sizes={sizes ?? '(max-width: 768px) 100vw, 288px'}
        />
      </Link>
    );
  }

  const primaryStack = project.stack.slice(0, 3);

  return (
    <Link href={href} className={cn(frame, 'group/cover')} aria-label={project.title}>
      {/* Signal grid — the Systems & Signal motif, drawn in CSS so an absent
          image costs zero bytes. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18] transition-opacity duration-500 ease-out-expo group-hover:opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, var(--fg-muted) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />
      {/* Visual restatement of information the card already exposes in its heading
          and metadata. aria-hidden so assistive tech hears the title once, not
          twice; the link's aria-label carries the accessible name. */}
      <span aria-hidden="true" className="relative flex h-full flex-col justify-between p-5">
        <span className="font-mono text-eyebrow uppercase text-muted">{project.year}</span>
        <span className="font-serif text-2xl leading-[1.05] text-foreground md:text-3xl">
          {project.title}
        </span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-eyebrow uppercase text-muted">
          {primaryStack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
      </span>
    </Link>
  );
}
