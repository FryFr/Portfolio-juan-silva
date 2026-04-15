import { getTranslations } from 'next-intl/server';
import type { Project } from '@/content-collections';

type Props = {
  project: Project;
};

export async function ProjectCard({ project }: Props) {
  const t = await getTranslations('home.projects');

  return (
    <article className="group relative flex flex-col gap-6 border-t border-[var(--bg-tertiary)] pt-8">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="font-serif text-2xl text-[var(--fg-primary)] md:text-3xl">
          {project.title}
        </h3>
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--fg-muted)]">
          {project.year}
        </span>
      </header>

      <p className="max-w-2xl font-serif text-lg italic text-[var(--fg-tertiary)]">
        {project.summary}
      </p>

      <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('role')}
          </dt>
          <dd className="mt-1 font-serif text-base text-[var(--fg-secondary)]">{project.role}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            {t('stack')}
          </dt>
          <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-[var(--fg-secondary)]">
            {project.stack.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </dd>
        </div>
      </dl>

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
    </article>
  );
}
