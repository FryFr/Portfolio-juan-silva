import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allProjects } from '@/content-collections';
import {
  type ProjectPublication,
  projectPublicationSchema,
  publicationDateSchema,
  publicationResourceSchema,
  publicationResources,
  publicationStructure,
} from '@/shared/content/project-publication';
import { projectSchema } from '@/shared/content/project-schema';

const publication: ProjectPublication = {
  metrics: [
    { id: 'latency', label: 'Latency', value: 200, unit: 'ms', evidenceIds: ['benchmark'] },
  ],
  architecture: {
    summary: 'Streaming service',
    nodes: [
      { id: 'client', label: 'Client' },
      { id: 'api', label: 'API' },
    ],
    edges: [{ from: 'client', to: 'api' }],
    diagram: '/globe.svg',
    diagramAlt: 'Client calls API',
  },
  timeline: [{ id: 'launch', title: 'Launch', startDate: '2024-02-29', endDate: '2024-03-01' }],
  evidence: [
    {
      id: 'benchmark',
      title: 'Results',
      kind: 'benchmark',
      resource: 'https://example.com/results',
      capturedAt: '2024-03-01',
    },
  ],
  gallery: [{ id: 'screen', src: '/window.svg', alt: 'Application window' }],
  privacy: { visibility: 'anonymized', notice: 'Names removed' },
};

function changed(mutate: (value: ProjectPublication) => void) {
  const value = structuredClone(publication);
  mutate(value);
  return value;
}

describe('ProjectPublication contract', () => {
  it('accepts the complete contract and independently optional sections', () => {
    expect(projectPublicationSchema.parse(publication)).toEqual(publication);
    expect(projectPublicationSchema.parse({})).toEqual({});
    for (const key of ['architecture', 'timeline', 'evidence', 'gallery', 'privacy'] as const) {
      expect(projectPublicationSchema.safeParse({ [key]: publication[key] }).success).toBe(true);
    }
  });

  it.each([
    { ...publication, metrics: [{ ...publication.metrics?.[0], invented: true }] },
    { ...publication, evidence: [{ ...publication.evidence?.[0], invented: true }] },
    { timeline: [{ ...publication.timeline?.[0], invented: true }] },
    { gallery: [{ ...publication.gallery?.[0], invented: true }] },
    { privacy: { visibility: 'public', invented: true } },
    { architecture: { ...publication.architecture, invented: true } },
    {
      architecture: {
        ...publication.architecture,
        nodes: [{ id: 'api', label: 'API', invented: true }],
      },
    },
    {
      architecture: {
        ...publication.architecture,
        edges: [{ from: 'api', to: 'client', invented: true }],
      },
    },
  ])('rejects unknown nested fields %#', (value) => {
    expect(projectPublicationSchema.safeParse(value).success).toBe(false);
  });

  it('does not synthesize metrics, evidence or privacy defaults', () => {
    expect(projectPublicationSchema.parse({})).toEqual({});
    expect(
      projectPublicationSchema.safeParse({
        metrics: [
          { id: 'latency', label: 'Latency', value: 200, unit: 'ms', evidenceIds: ['missing'] },
        ],
      }).success,
    ).toBe(false);
  });

  it('preserves all existing MDX projects without requiring publication', () => {
    expect(allProjects.length).toBeGreaterThan(0);
    for (const project of allProjects) {
      expect(projectSchema.safeParse(project).success, project._meta.filePath).toBe(true);
      const { publication: _publication, ...legacy } = project;
      expect(projectSchema.parse(legacy).publication).toBeUndefined();
      expect(projectSchema.parse({ ...legacy, publication }).publication).toEqual(publication);
    }
  });

  it.each([
    { unknownSection: [] },
    { metrics: [{ id: 'bad', label: ' ', value: 1, unit: 'ms', evidenceIds: [] }] },
    { gallery: [{ id: 'image', src: '/window.svg', alt: ' ' }] },
    { privacy: { visibility: 'private' } },
    { privacy: { visibility: 'anonymized' } },
    changed((p) => {
      if (p.architecture) delete p.architecture.diagramAlt;
    }),
    changed((p) => {
      if (p.metrics?.[0]) p.metrics[0].value = Number.POSITIVE_INFINITY;
    }),
  ])('rejects invalid contract %#', (value) => {
    expect(projectPublicationSchema.safeParse(value).success).toBe(false);
  });
});

describe('referential integrity', () => {
  it.each([
    'metrics',
    'evidence',
    'timeline',
    'gallery',
  ] as const)('rejects duplicate %s IDs', (section) => {
    const value = structuredClone(publication);
    const items = value[section];
    expect(
      projectPublicationSchema.safeParse({
        ...value,
        [section]: [...(items ?? []), ...(items ?? [])],
      }).success,
    ).toBe(false);
  });
  it.each([
    changed((p) => {
      p.evidence = [];
    }),
    changed((p) => {
      p.metrics?.[0]?.evidenceIds.push('benchmark');
    }),
    changed((p) => {
      p.architecture?.nodes.push({ id: 'api', label: 'Duplicate' });
    }),
    changed((p) => {
      p.architecture?.edges.push({ from: 'missing', to: 'api' });
    }),
    changed((p) => {
      p.architecture?.edges.push({ from: 'api', to: 'missing' });
    }),
  ])('rejects broken references %#', (value) => {
    expect(projectPublicationSchema.safeParse(value).success).toBe(false);
  });
});

describe('calendar dates', () => {
  it.each([
    '2025-02-29',
    '2024-02-30',
    '2024-13-01',
    '2024-04-31',
    '2024-1-01',
    '2024-01-01T00:00:00Z',
  ])('rejects %s', (date) => {
    expect(publicationDateSchema.safeParse(date).success).toBe(false);
    expect(
      projectPublicationSchema.safeParse(
        changed((p) => {
          if (p.evidence?.[0]) p.evidence[0].capturedAt = date;
        }),
      ).success,
    ).toBe(false);
  });
  it('accepts leap days and same-day milestones, rejects reversed ranges', () => {
    expect(publicationDateSchema.parse('2024-02-29')).toBe('2024-02-29');
    for (const [endDate, valid] of [
      ['2024-02-29', true],
      ['2024-02-28', false],
    ] as const) {
      expect(
        projectPublicationSchema.safeParse(
          changed((p) => {
            if (p.timeline?.[0]) p.timeline[0].endDate = endDate;
          }),
        ).success,
      ).toBe(valid);
    }
  });
});

describe('resources', () => {
  it.each([
    'https:///example.com/a',
    'https://@example.com/a',
    'https:example.com/a',
    'https:/example.com/a',
    ' https://example.com/a',
    'https://example.com/a ',
    'https://example.com/\\evil',
    'https://exa\nmple.com/a',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
    'http://example.com/a',
    '//example.com/a',
    '/../../secret',
    '/images/%2e%2e/a.png',
    'images/a.png',
    '/images//a.png',
    'https://user:password@example.com/a',
    '/images/../a.png',
  ])('rejects unsafe/noncanonical resource %s', (resource) => {
    expect(publicationResourceSchema.safeParse(resource).success).toBe(false);
  });
  it.each([
    '/images/project-screen.webp',
    'https://example.com',
    'https://example.com/results?run=1#summary',
  ])('accepts safe resource %s', (resource) => {
    expect(publicationResourceSchema.parse(resource)).toBe(resource);
  });

  it('enumerates every resource and checks local files in public', () => {
    expect(publicationResources(publication)).toEqual([
      'https://example.com/results',
      '/window.svg',
      '/globe.svg',
    ]);
    expect(publicationResources(undefined)).toEqual([]);
    for (const value of [publication, ...allProjects.map((project) => project.publication)]) {
      for (const resource of publicationResources(value)) {
        expect(publicationResourceSchema.safeParse(resource).success).toBe(true);
        if (resource.startsWith('/'))
          expect(statSync(resolve('public', resource.slice(1))).isFile()).toBe(true);
      }
    }
    for (const project of allProjects) {
      if (project.cover?.startsWith('/'))
        expect(statSync(resolve('public', project.cover.slice(1))).isFile()).toBe(true);
    }
  });
});

describe('bilingual publication integrity', () => {
  it('requires exactly one es/en document per project with the same publication facts', () => {
    for (const slug of new Set(allProjects.map((project) => project.slug))) {
      const pair = allProjects.filter((project) => project.slug === slug);
      expect(pair.map((project) => project.locale).sort(), slug).toEqual(['en', 'es']);
      expect(publicationStructure(pair[0]?.publication), slug).toEqual(
        publicationStructure(pair[1]?.publication),
      );
    }
  });
  it('allows translated prose but detects missing sections and divergent facts', () => {
    const translated = changed((p) => {
      if (p.metrics?.[0]) p.metrics[0].label = 'Latencia';
      if (p.gallery?.[0]) p.gallery[0].alt = 'Ventana de la aplicación';
      if (p.privacy) p.privacy.notice = 'Nombres eliminados';
    });
    expect(publicationStructure(translated)).toEqual(publicationStructure(publication));
    expect(publicationStructure(undefined)).not.toEqual(publicationStructure(publication));
    expect(
      publicationStructure(
        changed((p) => {
          delete p.gallery;
        }),
      ),
    ).not.toEqual(publicationStructure(publication));
    expect(
      publicationStructure(
        changed((p) => {
          if (p.metrics?.[0]) p.metrics[0].value = 300;
        }),
      ),
    ).not.toEqual(publicationStructure(publication));
  });
});
