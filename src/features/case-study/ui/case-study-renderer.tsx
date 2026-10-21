import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Project } from '@/content-collections';
import type { Locale } from '@/shared/i18n/routing';
import { OperationalTimeline, ProvenanceGraph } from '@/shared/visualizations';
import { PublicationEvidence } from './publication-evidence';

export type CaseStudyLabels = {
  source: string;
  summary: string;
  metrics: string;
  architecture: string;
  timeline: string;
  evidence: string;
  gallery: string;
  privacy: string;
  related: string;
};

type Props = {
  project: Pick<Project, 'title' | 'cover' | 'publication'>;
  locale: Locale;
  labels: CaseStudyLabels;
  hero: ReactNode;
  children: ReactNode;
  navigation: ReactNode;
  relatedProjects?: Pick<Project, 'slug' | 'title' | 'summary'>[];
};

const grid = 'grid gap-6 sm:grid-cols-2';
const card = 'min-w-0 rounded-sm border border-border bg-surface p-6';
const link =
  'underline underline-offset-4 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent';

function Picture({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  priority?: boolean;
}) {
  return (
    <figure className="min-w-0">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={675}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-sm border border-border"
        priority={priority}
        // The publication contract permits arbitrary HTTPS resources. Do not
        // route those through Next's restricted image optimizer or fetch at build.
        unoptimized={src.startsWith('https://')}
      />
      {caption && <figcaption className="mt-3 text-sm text-subtle">{caption}</figcaption>}
    </figure>
  );
}

/** Adds only supplied publication sections around the original header and MDX. */
export function CaseStudyRenderer({
  project,
  locale,
  labels,
  hero,
  children,
  navigation,
  relatedProjects = [],
}: Props) {
  const publication = project.publication;
  const number = new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 });
  const date = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
  const evidenceId = (id: string) => `publication-evidence-${id}`;
  const sections: { id: keyof CaseStudyLabels; body: ReactNode }[] = [];

  if (publication?.metrics?.length)
    sections.push({
      id: 'metrics',
      body: (
        <dl className={grid}>
          {publication.metrics.map((metric) => (
            <div key={metric.id} className={card}>
              <dt className="font-mono text-sm text-subtle">{metric.label}</dt>
              <dd className="mt-3">
                <span className="block text-4xl tracking-tight text-foreground">
                  {number.format(metric.value)} {metric.unit}
                </span>
                {metric.description && <p className="mt-3">{metric.description}</p>}
                <ul className="mt-4 space-y-2">
                  {metric.evidenceIds.map((id) => {
                    const evidence = publication.evidence?.find((item) => item.id === id);
                    return evidence ? (
                      <li key={id}>
                        <a className={link} href={`#${evidenceId(id)}`}>
                          {evidence.title}
                        </a>
                      </li>
                    ) : null;
                  })}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      ),
    });
  const architecture = publication?.architecture;
  if (architecture)
    sections.push({
      id: 'architecture',
      body: (
        <div className="space-y-6">
          <ProvenanceGraph
            title={labels.architecture}
            description={architecture.summary}
            emptyLabel=""
            nodes={architecture.nodes.map((node) => ({
              ...node,
              description: node.description ?? '',
            }))}
            edges={architecture.edges.map((edge, index) => ({
              ...edge,
              id: `edge-${index}`,
              label: edge.label ?? '',
            }))}
          />
          {architecture.diagram && architecture.diagramAlt && (
            <Picture src={architecture.diagram} alt={architecture.diagramAlt} />
          )}
        </div>
      ),
    });
  if (publication?.timeline?.length)
    sections.push({
      id: 'timeline',
      body: (
        <OperationalTimeline
          title={labels.timeline}
          description=""
          emptyLabel=""
          events={publication.timeline.map((item) => ({
            id: item.id,
            label: item.title,
            description: item.description ?? '',
            dateTime: item.startDate,
            timeLabel: item.endDate
              ? `${date(item.startDate)} – ${date(item.endDate)}`
              : date(item.startDate),
          }))}
        />
      ),
    });
  if (publication?.evidence?.length)
    sections.push({
      id: 'evidence',
      body: (
        <div className="space-y-6">
          {publication.evidence.map((item) => (
            <div
              key={item.id}
              id={evidenceId(item.id)}
              tabIndex={-1}
              className="scroll-mt-24 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <PublicationEvidence
                title={item.title}
                description=""
                emptyLabel=""
                items={[
                  {
                    id: item.id,
                    title: item.title,
                    summary: item.description ?? '',
                    details: '',
                    source: { href: item.resource, label: labels.source },
                  },
                ]}
              />
              {item.capturedAt && (
                <time
                  className="mt-3 block font-mono text-sm text-subtle"
                  dateTime={item.capturedAt}
                >
                  {date(item.capturedAt)}
                </time>
              )}
            </div>
          ))}
        </div>
      ),
    });
  if (publication?.gallery?.length)
    sections.push({
      id: 'gallery',
      body: (
        <div className={grid}>
          {publication.gallery.map((item) => (
            <Picture key={item.id} {...item} />
          ))}
        </div>
      ),
    });
  if (publication?.privacy?.notice)
    sections.push({
      id: 'privacy',
      body: <p className={`${card} border-l-2 border-l-accent`}>{publication.privacy.notice}</p>,
    });

  return (
    <>
      <div className="mt-12 space-y-8">
        {hero}
        {project.cover && <Picture src={project.cover} alt={project.title} priority />}
      </div>
      <article className="mt-16 max-w-none space-y-16 font-sans leading-relaxed text-body [overflow-wrap:anywhere]">
        {sections.length > 0 && (
          <nav aria-label={labels.summary}>
            <p className="mb-4 font-mono text-sm text-subtle">{labels.summary}</p>
            <ol className="flex flex-wrap gap-x-6 gap-y-3">
              {sections.map(({ id }) => (
                <li key={id}>
                  <a className={link} href={`#publication-${id}`}>
                    {labels[id]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {sections.map(({ id, body }) => (
          <section
            key={id}
            id={`publication-${id}`}
            tabIndex={-1}
            aria-labelledby={`publication-${id}-title`}
            className="scroll-mt-24 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <h2
              id={`publication-${id}-title`}
              className="mb-6 text-2xl tracking-tight text-foreground md:text-3xl"
            >
              {labels[id]}
            </h2>
            {body}
          </section>
        ))}
        <div>{children}</div>
      </article>
      {relatedProjects.length > 0 && (
        <section className="mt-16" aria-labelledby="publication-related-title">
          <h2 id="publication-related-title" className="mb-6 text-2xl text-foreground">
            {labels.related}
          </h2>
          <ul className={grid}>
            {relatedProjects.map((related) => (
              <li key={related.slug} className={card}>
                <h3 className="text-lg text-foreground">
                  <Link href={`/${locale}/projects/${related.slug}`} className={link}>
                    {related.title}
                  </Link>
                </h3>
                <p className="mt-3 text-body [overflow-wrap:anywhere]">{related.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-24">{navigation}</div>
    </>
  );
}
