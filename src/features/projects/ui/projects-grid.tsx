import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProjectCard } from '@/features/projects/ui/project-card';
import { getFeaturedProjects } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { Container } from '@/shared/ui/container';
import { Eyebrow } from '@/shared/ui/eyebrow';

type Props = {
  locale: Locale;
};

export async function ProjectsGrid({ locale }: Props) {
  const t = await getTranslations('home.projects');
  const projects = getFeaturedProjects(locale);

  return (
    <section className="border-t border-border">
      <Container size="wide" className="py-24 md:py-32">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <DistortHeading
          as="h2"
          className="mt-6 max-w-4xl font-serif text-section font-light text-foreground"
        >
          {t('title')}
        </DistortHeading>

        {projects.length === 0 ? (
          <p className="mt-12 font-serif italic text-subtle">{t('empty')}</p>
        ) : (
          <div className="mt-16 space-y-20">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} locale={locale} />
            ))}
          </div>
        )}

        {/* The other eight projects were unreachable from the homepage entirely —
            a content-architecture gap, not a styling one. */}
        <div className="mt-20 border-t border-border pt-8">
          <Link
            href={`/${locale}/projects`}
            className="group inline-flex items-baseline gap-3 font-mono text-eyebrow uppercase text-foreground transition-colors duration-150 ease-out-expo hover:text-accent"
          >
            {t('viewAll')}
            <span
              aria-hidden="true"
              className="transition-transform duration-150 ease-out-expo group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
