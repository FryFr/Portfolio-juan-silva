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
                className="inline-flex items-center gap-1.5 text-[var(--fg-secondary)] underline underline-offset-4 hover:text-[var(--accent)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
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
