import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '@/content-collections';
import { ProjectCard } from '@/features/projects/ui/project-card';

// ProjectCard is an async RSC that calls getTranslations('home.projects')
// from next-intl/server. We mock only this server helper — not navigation.
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

// next/link renders a plain <a> in test env
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const mockProject: Project = {
  title: 'Acme Platform',
  summary: 'A great project summary.',
  role: 'Lead Architect',
  year: 2025,
  stack: ['Next.js', 'TypeScript', 'PostgreSQL'],
  featured: true,
  order: 1,
  slug: 'acme-platform',
  locale: 'es',
  url: '/es/projects/acme-platform',
  _meta: {
    filePath: 'acme-platform.es.mdx',
    fileName: 'acme-platform.es.mdx',
    directory: '.',
    extension: 'mdx',
    path: 'acme-platform.es',
  },
  body: '' as unknown as Project['body'],
  content: '',
};

// Decorative restatements inside the fallback cover are aria-hidden, so anything
// asserting on perceived content should skip them.
const IGNORE_DECORATIVE = '[aria-hidden="true"], [aria-hidden="true"] *';

describe('ProjectCard', () => {
  it('renders the project title as a heading', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Acme Platform');
  });

  it('renders the project year once as perceivable content', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    expect(screen.getByText('2025', { ignore: IGNORE_DECORATIVE })).toBeInTheDocument();
  });

  it('the title link href contains /projects/acme-platform', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    // Scoped to the heading. The cover is also a link to the same URL, so an
    // unscoped byRole('link') query is ambiguous and would pass for the wrong node.
    const link = within(screen.getByRole('heading', { level: 2 })).getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringMatching(/\/projects\/acme-platform/));
  });

  // The cover slot is structural: cards must keep their shape whether or not the
  // frontmatter supplies an image. Without this, a project missing `cover`
  // collapses to text and breaks the rhythm of the grid.
  it('renders a cover link even when the project has no cover image', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    const covers = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href') === '/es/projects/acme-platform');
    expect(covers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders an image when the project has a cover', async () => {
    const withCover: Project = { ...mockProject, cover: '/images/projects/acme.jpg' };
    render(await ProjectCard({ project: withCover, locale: 'es' }));
    expect(screen.getByRole('img', { name: 'Acme Platform' })).toBeInTheDocument();
  });
});
