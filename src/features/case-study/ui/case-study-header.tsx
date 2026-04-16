import { getTranslations } from 'next-intl/server';
import type { Project } from '@/content-collections';
import { DistortHeading } from '@/features/cursor/effects/distort-heading';
import { ProximityReveal } from '@/features/cursor/effects/proximity-reveal';

type Props = {
  project: Project;
};

export async function CaseStudyHeader({ project }: Props) {
  const t = await getTranslations('projects.detail');

  return (
    <header className="flex flex-col gap-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        <span>{project.year}</span>
        <span className="mx-2">·</span>
        <span>{project.role}</span>
      </p>

      <DistortHeading
        as="h1"
        className="font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-[var(--fg-primary)] md:text-5xl"
      >
        {project.title}
      </DistortHeading>

      <ProximityReveal className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)] md:text-xl">
        {project.summary}
      </ProximityReveal>

      <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {project.client && (
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
              {t('client')}
            </dt>
            <dd className="mt-1 font-serif text-base text-[var(--fg-secondary)]">
              {project.client}
            </dd>
          </div>
        )}
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('role')}
          </dt>
          <dd className="mt-1 font-serif text-base text-[var(--fg-secondary)]">{project.role}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('year')}
          </dt>
          <dd className="mt-1 font-serif text-base text-[var(--fg-secondary)]">{project.year}</dd>
        </div>
      </dl>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
          {t('stack')}
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[var(--fg-secondary)]">
          {project.stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>

      {(project.links?.live || project.links?.repo || project.links?.caseStudy) && (
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.15em]">
          {project.links?.live && (
            <li>
              <a
                href={project.links.live}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('live')}
              </a>
            </li>
          )}
          {project.links?.repo && (
            <li>
              <a
                href={project.links.repo}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('repo')}
              </a>
            </li>
          )}
          {project.links?.caseStudy && (
            <li>
              <a
                href={project.links.caseStudy}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                {t('caseStudy')}
              </a>
            </li>
          )}
        </ul>
      )}
    </header>
  );
}
