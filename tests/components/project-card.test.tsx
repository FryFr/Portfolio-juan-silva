import { render, screen } from '@testing-library/react';
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

describe('ProjectCard', () => {
  it('renders the project title', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    expect(screen.getByText('Acme Platform')).toBeInTheDocument();
  });

  it('renders the project year', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('the title link href contains /projects/acme-platform', async () => {
    render(await ProjectCard({ project: mockProject, locale: 'es' }));
    const link = screen.getByRole('link', { name: /acme platform/i });
    expect(link).toHaveAttribute('href', expect.stringMatching(/\/projects\/acme-platform/));
  });
});
