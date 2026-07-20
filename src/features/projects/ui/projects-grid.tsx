import { getTranslations } from 'next-intl/server';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProjectCard } from '@/features/projects/ui/project-card';
import { getFeaturedProjects } from '@/shared/content';
import type { Locale } from '@/shared/i18n/routing';
import { Container } from '@/shared/ui/container';

type Props = {
  locale: Locale;
};

export async function ProjectsGrid({ locale }: Props) {
  const t = await getTranslations('home.projects');
  const projects = getFeaturedProjects(locale);

  return (
    <section className="border-t border-border">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-eyebrow uppercase text-muted">{t('eyebrow')}</p>
        <DistortHeading
          as="h2"
          className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-foreground md:text-6xl"
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
      </Container>
    </section>
  );
}
