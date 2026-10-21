import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectDetailPage from '@/app/[locale]/projects/[slug]/page';
import { allProjects, type Project } from '@/content-collections';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import { getProjectBySlug, getRelatedProjects } from '@/shared/content';
import {
  type ProjectPublication,
  projectPublicationSchema,
} from '@/shared/content/project-publication';
import type { Locale } from '@/shared/i18n/routing';
import { MdxBody } from '@/shared/mdx/mdx-body';

let locale: Locale = 'en';
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () =>
    Object.assign((key: string) => key, {
      raw: () => (locale === 'es' ? es : en).projects.detail.publication,
    }),
}));
vi.mock('@/shared/content', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/content')>()),
  getProjectBySlug: vi.fn(),
}));
// Async RSC leaves are represented by their semantic slots. The page, renderer,
// visual modules, catalog selection and MdxBody are exercised together.
vi.mock('@/features/case-study/ui/case-study-header', () => ({
  CaseStudyHeader: ({ project }: { project: Project }) => (
    <header>
      <h1>{project.title}</h1>
      <p>{project.summary}</p>
    </header>
  ),
}));
vi.mock('@/features/case-study/ui/case-study-nav', () => ({
  CaseStudyNav: () => (
    <nav aria-label="Adjacent projects">
      <a href="/en/projects">Next project</a>
    </nav>
  ),
}));

const publication: ProjectPublication = projectPublicationSchema.parse({
  metrics: [
    { id: 'measured', label: 'Measured value', value: 0, unit: 'ms', evidenceIds: ['report'] },
  ],
  architecture: {
    summary: 'Documented architecture',
    nodes: [
      { id: 'input', label: 'Input' },
      { id: 'output', label: 'Output', description: 'Stored result' },
    ],
    edges: [{ from: 'input', to: 'output', label: 'Writes' }],
    diagram: 'https://example.com/diagram.png',
    diagramAlt: 'Architecture diagram',
  },
  timeline: [{ id: 'delivery', title: 'Delivery', startDate: '2025-01-01', endDate: '2025-01-03' }],
  evidence: [
    {
      id: 'report',
      title: 'Test report',
      kind: 'benchmark',
      resource: 'https://example.com/report',
      capturedAt: '2025-01-03',
      description: 'Recorded measurement',
    },
  ],
  gallery: [
    {
      id: 'screen',
      src: '/images/test-screen.png',
      alt: 'Application screen',
      caption: 'Test caption',
    },
  ],
  privacy: { visibility: 'anonymized', notice: 'Reviewed anonymous material' },
});

function fixture(publication?: ProjectPublication): Project {
  const project = allProjects.find((item) => item.locale === locale && item.slug === 'michibot');
  if (!project) throw new Error('Missing real MDX fixture');
  return { ...project, publication };
}
async function renderPage(project: Project) {
  vi.mocked(getProjectBySlug).mockReturnValue(project);
  return render(
    await ProjectDetailPage({ params: Promise.resolve({ locale, slug: project.slug }) }),
  );
}

beforeEach(() => {
  locale = 'en';
});

describe.each(['es', 'en'] as const)('case study composition (%s)', (language) => {
  beforeEach(() => {
    locale = language;
  });

  it('keeps the legacy hero, real compiled MDX and adjacent navigation without publication placeholders', async () => {
    const project = fixture();
    const mdx = render(<MdxBody code={project.body} />);
    const originalText = mdx.container.textContent;
    mdx.unmount();
    const { container } = await renderPage(project);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(project.title);
    expect(container.querySelector('article')?.textContent).toBe(originalText);
    expect(screen.getByRole('navigation', { name: 'Adjacent projects' })).toBeVisible();
    expect(container.querySelectorAll('section[id^="publication-"]')).toHaveLength(0);
    expect(
      screen.queryByRole('navigation', { name: /In this case|En este caso/ }),
    ).not.toBeInTheDocument();
  });

  it('composes every supplied section, real visual modules, localized dates, metrics and evidence links', async () => {
    const project = { ...fixture(publication), cover: '/images/test-cover.png' };
    const { container } = await renderPage(project);
    const labels = (locale === 'es' ? es : en).projects.detail.publication;
    for (const key of [
      'metrics',
      'architecture',
      'timeline',
      'evidence',
      'gallery',
      'privacy',
      'related',
    ] as const) {
      expect(screen.getByRole('heading', { name: labels[key], level: 2 })).toBeVisible();
    }
    expect(screen.getByRole('img', { name: project.title })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Architecture diagram' })).toHaveAttribute(
      'src',
      'https://example.com/diagram.png',
    );
    expect(screen.getByRole('img', { name: 'Application screen' })).toBeVisible();
    expect(screen.getByText('0 ms')).toBeVisible();
    expect(screen.getByRole('figure', { name: labels.architecture })).toBeVisible();
    expect(screen.getByText('Input → Output: Writes')).toBeVisible();
    expect(screen.getByRole('figure', { name: labels.timeline })).toBeVisible();
    expect(container.querySelector('time[datetime="2025-01-01"]')).toHaveTextContent(
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
        new Date('2025-01-01T00:00:00Z'),
      ),
    );
    const summary = screen.getByRole('navigation', { name: labels.summary });
    for (const anchor of within(summary).getAllByRole('link')) {
      const target = container.querySelector(anchor.getAttribute('href') ?? '');
      expect(target).toHaveAttribute('tabindex', '-1');
    }
    expect(screen.getByRole('link', { name: 'Test report' })).toHaveAttribute(
      'href',
      '#publication-evidence-report',
    );
    expect(container.querySelector('#publication-evidence-report')).toBeInTheDocument();
    const user = userEvent.setup();
    const disclosure = container.querySelector('summary');
    disclosure?.focus();
    await user.keyboard('{Enter}');
    expect(container.querySelector('details')).toHaveAttribute('open');
    await user.tab();
    expect(screen.getByRole('link', { name: labels.source })).toHaveFocus();
    expect(screen.getByRole('link', { name: labels.source })).toHaveAttribute(
      'href',
      'https://example.com/report',
    );
    const ids = Array.from(container.querySelectorAll('[id]'), (node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preserves small nonzero measurements instead of rounding them to zero', async () => {
    const value = 1e-25;
    const metric = publication.metrics?.[0];
    if (!metric) throw new Error('Missing metric fixture');
    await renderPage(fixture({ evidence: publication.evidence, metrics: [{ ...metric, value }] }));
    expect(
      screen.getByText(
        `${new Intl.NumberFormat(locale, { maximumSignificantDigits: 21 }).format(value)} ms`,
      ),
    ).toBeVisible();
    expect(screen.queryByText('0 ms')).not.toBeInTheDocument();
  });

  it.each([
    {},
    {
      metrics: [],
      evidence: [],
      gallery: [],
      timeline: [],
      privacy: { visibility: 'public' as const },
    },
  ])('omits empty partial sections: %j', async (partial) => {
    const { container } = await renderPage(fixture(partial));
    expect(container.querySelectorAll('section[id^="publication-"]')).toHaveLength(0);
    expect(container.querySelector('article')?.textContent).not.toBe('');
  });

  it('renders only a supplied privacy note and preserves MDX for partial publication', async () => {
    const { container } = await renderPage(fixture({ privacy: publication.privacy }));
    expect(container.querySelectorAll('section[id^="publication-"]')).toHaveLength(1);
    expect(screen.getByText('Reviewed anonymous material')).toBeVisible();
    expect(container.querySelector('article > div')?.textContent).not.toBe('');
  });
});

it('selects related projects from visible same-language shared-stack entries and handles unknown slugs', () => {
  for (const language of ['es', 'en'] as const) {
    const current = allProjects.find(
      (item) => item.slug === 'michibot' && item.locale === language,
    );
    expect(current).toBeDefined();
    const related = getRelatedProjects(language, 'michibot');
    expect(related.length).toBeGreaterThan(0);
    expect(related.length).toBeLessThanOrEqual(3);
    for (const item of related) {
      expect(item.locale).toBe(language);
      expect(item.slug).not.toBe('michibot');
      expect(item.visibility).not.toBe('hidden');
      expect(item.stack.some((tech) => current?.stack.includes(tech))).toBe(true);
    }
  }
  expect(getRelatedProjects('en', 'missing')).toEqual([]);
  expect(getRelatedProjects('en', 'michibot', 0)).toEqual([]);
});
