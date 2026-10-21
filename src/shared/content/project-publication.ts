import { z } from 'zod';

const text = z.string().trim().min(1);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const publicationDateSchema = z.iso.date();

// Public assets use canonical root-relative paths; remote resources must use HTTPS.
export const publicationResourceSchema = z.string().refine((value) => {
  // URL() silently normalizes whitespace, backslashes and malformed HTTPS forms.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Reject control characters in resource URLs.
  if (/[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  if (value.startsWith('/')) {
    return /^\/[a-zA-Z0-9_/-]+(?:\.[a-zA-Z0-9]+)$/.test(value) && !value.includes('//');
  }
  try {
    const url = new URL(value);
    return (
      /^https:\/\/[^/?#@]+(?:[/?#]|$)/.test(value) &&
      url.protocol === 'https:' &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}, 'Expected a canonical public asset path or HTTPS URL');

const evidence = z.strictObject({
  id,
  title: text,
  kind: z.enum(['link', 'image', 'video', 'document', 'benchmark']),
  resource: publicationResourceSchema,
  capturedAt: publicationDateSchema.optional(),
  description: text.optional(),
});
const metric = z.strictObject({
  id,
  label: text,
  value: z.number().finite(),
  unit: text,
  description: text.optional(),
  evidenceIds: z.array(id).min(1),
});
const architecture = z
  .strictObject({
    summary: text,
    nodes: z.array(z.strictObject({ id, label: text, description: text.optional() })).min(1),
    edges: z.array(z.strictObject({ from: id, to: id, label: text.optional() })),
    diagram: publicationResourceSchema.optional(),
    diagramAlt: text.optional(),
  })
  .refine((value) => !value.diagram || !!value.diagramAlt, {
    message: 'A diagram requires alternative text',
    path: ['diagramAlt'],
  });
const milestone = z
  .strictObject({
    id,
    title: text,
    description: text.optional(),
    startDate: publicationDateSchema,
    endDate: publicationDateSchema.optional(),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: 'endDate must be on or after startDate',
    path: ['endDate'],
  });
const galleryItem = z.strictObject({
  id,
  src: publicationResourceSchema,
  alt: text,
  caption: text.optional(),
});

export const projectPublicationSchema = z
  .strictObject({
    metrics: z.array(metric).optional(),
    architecture: architecture.optional(),
    timeline: z.array(milestone).optional(),
    evidence: z.array(evidence).optional(),
    gallery: z.array(galleryItem).optional(),
    // Describes already reviewed public material; this is not a redaction mechanism.
    privacy: z
      .strictObject({
        visibility: z.enum(['public', 'anonymized']),
        notice: text.optional(),
      })
      .refine((value) => value.visibility !== 'anonymized' || !!value.notice, {
        message: 'Anonymized publications require a notice',
        path: ['notice'],
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    function unique(items: { id: string }[] | undefined, path: (string | number)[]) {
      const seen = new Set<string>();
      for (const [index, item] of (items ?? []).entries()) {
        if (seen.has(item.id))
          ctx.addIssue({ code: 'custom', path: [...path, index, 'id'], message: 'Duplicate ID' });
        seen.add(item.id);
      }
      return seen;
    }
    const evidenceIds = unique(value.evidence, ['evidence']);
    unique(value.metrics, ['metrics']);
    unique(value.timeline, ['timeline']);
    unique(value.gallery, ['gallery']);
    for (const [index, item] of (value.metrics ?? []).entries()) {
      const seen = new Set<string>();
      for (const [refIndex, ref] of item.evidenceIds.entries()) {
        if (!evidenceIds.has(ref) || seen.has(ref))
          ctx.addIssue({
            code: 'custom',
            path: ['metrics', index, 'evidenceIds', refIndex],
            message: 'Unknown or duplicate evidence reference',
          });
        seen.add(ref);
      }
    }
    if (value.architecture) {
      const nodes = unique(value.architecture.nodes, ['architecture', 'nodes']);
      for (const [index, edge] of value.architecture.edges.entries()) {
        for (const endpoint of ['from', 'to'] as const) {
          if (!nodes.has(edge[endpoint]))
            ctx.addIssue({
              code: 'custom',
              path: ['architecture', 'edges', index, endpoint],
              message: 'Unknown architecture node',
            });
        }
      }
    }
  });

export type ProjectPublication = z.infer<typeof projectPublicationSchema>;

/** Stable facts must match between locales; editorial text is translated in each MDX. */
export function publicationStructure(value: ProjectPublication | undefined) {
  if (!value) return undefined;
  return {
    metrics: value.metrics?.map(({ id, value, unit, evidenceIds }) => ({
      id,
      value,
      unit,
      evidenceIds,
    })),
    architecture: value.architecture && {
      nodes: value.architecture.nodes.map(({ id }) => id),
      edges: value.architecture.edges.map(({ from, to }) => ({ from, to })),
      diagram: value.architecture.diagram,
    },
    timeline: value.timeline?.map(({ id, startDate, endDate }) => ({ id, startDate, endDate })),
    evidence: value.evidence?.map(({ id, kind, resource, capturedAt }) => ({
      id,
      kind,
      resource,
      capturedAt,
    })),
    gallery: value.gallery?.map(({ id, src }) => ({ id, src })),
    privacy: value.privacy?.visibility,
  };
}

export function publicationResources(value: ProjectPublication | undefined): string[] {
  if (!value) return [];
  return [
    ...(value.evidence?.map((item) => item.resource) ?? []),
    ...(value.gallery?.map((item) => item.src) ?? []),
    ...(value.architecture?.diagram ? [value.architecture.diagram] : []),
  ];
}
