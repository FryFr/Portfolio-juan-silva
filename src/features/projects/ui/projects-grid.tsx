import { getTranslations } from 'next-intl/server';
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
    <section className="border-t border-[var(--bg-tertiary)]">
      <Container size="wide" className="py-24 md:py-32">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('eyebrow')}
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-[var(--fg-primary)] md:text-6xl">
          {t('title')}
        </h2>

        {projects.length === 0 ? (
          <p className="mt-12 font-serif italic text-[var(--fg-tertiary)]">{t('empty')}</p>
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
