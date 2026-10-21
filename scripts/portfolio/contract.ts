import { createHash } from 'node:crypto';
import { isAlias, parseDocument, visit } from 'yaml';
import { z } from 'zod';

export const MANIFEST_PATH = '.portfolio/project.yml';
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);
const repository = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/)
  .max(140);
const sha = z.string().regex(/^[a-f0-9]{40}$/);
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      // biome-ignore lint/suspicious/noControlCharactersInRegex: reject control characters at the input boundary.
      (value) => !/[<>\x00-\x1f]/.test(value),
      'Control characters and markup are forbidden',
    );
const translation = z.strictObject({ title: text(100), summary: text(200), role: text(100) });
const https = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Expected HTTPS URL without credentials');

export const manifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  slug,
  repository,
  year: z.number().int().min(2000).max(2100),
  stack: z
    .array(text(50))
    .min(1)
    .max(20)
    .refine((items) => new Set(items).size === items.length),
  locales: z.strictObject({ es: translation, en: translation }),
  links: z.strictObject({ live: https.optional() }).optional(),
});

export const allowlistSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    projects: z
      .array(z.strictObject({ repository, repositoryId: z.number().int().positive(), slug }))
      .max(100),
  })
  .superRefine(({ projects }, ctx) => {
    for (const key of ['repository', 'repositoryId', 'slug'] as const) {
      if (new Set(projects.map((entry) => entry[key])).size !== projects.length) {
        ctx.addIssue({ code: 'custom', message: `Duplicate allowlist ${key}` });
      }
    }
  });

export const sourceSchema = z.strictObject({
  repository,
  repositoryId: z.number().int().positive(),
  requestedSha: sha,
  resolvedSha: sha,
  path: z.literal(MANIFEST_PATH),
});

export function parseManifest(input: string) {
  if (Buffer.byteLength(input, 'utf8') > 16_384) throw new Error('Manifest exceeds 16 KiB');
  const document = parseDocument(input, { uniqueKeys: true, schema: 'core' });
  if (document.errors.length || document.warnings.length) throw new Error('Invalid YAML');
  visit(document, (_key, node) => {
    if (isAlias(node)) {
      throw new Error('YAML aliases, anchors and explicit tags are forbidden');
    }
    if (
      node &&
      typeof node === 'object' &&
      (('anchor' in node && node.anchor) || ('tag' in node && node.tag))
    ) {
      throw new Error('YAML aliases, anchors and explicit tags are forbidden');
    }
  });
  return manifestSchema.parse(document.toJS({ maxAliasCount: 0 }));
}

const recordSchema = z.strictObject({
  schemaVersion: z.literal(1),
  repository,
  repositoryId: z.number().int().positive(),
  sha,
  manifest: manifestSchema,
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

function digest(manifest: z.infer<typeof manifestSchema>) {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

/** Pure local proposal. Source evidence must come from a trusted future transport, never the YAML. */
export function validateProject(input: {
  yaml: string;
  allowlist: unknown;
  source: unknown;
  manualSlugs: readonly string[];
  previous?: unknown;
}) {
  const manifest = parseManifest(input.yaml);
  const allowlist = allowlistSchema.parse(input.allowlist);
  const source = sourceSchema.parse(input.source);
  const owner = allowlist.projects.find((entry) => entry.slug === manifest.slug);
  if (
    !owner ||
    owner.repository !== manifest.repository ||
    owner.repository !== source.repository ||
    owner.repositoryId !== source.repositoryId
  )
    throw new Error('Identity or ownership mismatch');
  if (source.requestedSha !== source.resolvedSha) throw new Error('SHA mismatch');
  if (input.manualSlugs.includes(manifest.slug)) throw new Error('Manual catalog owns this slug');
  const record = recordSchema.parse({
    schemaVersion: 1,
    repository: source.repository,
    repositoryId: source.repositoryId,
    sha: source.resolvedSha,
    manifest,
    digest: digest(manifest),
  });
  if (input.previous !== undefined) {
    const previous = recordSchema.parse(input.previous);
    if (
      previous.repository !== record.repository ||
      previous.repositoryId !== record.repositoryId ||
      previous.manifest.slug !== manifest.slug ||
      previous.manifest.repository !== record.repository ||
      previous.digest !== digest(previous.manifest)
    )
      throw new Error('Invalid previous ownership or digest');
    if (previous.sha === record.sha) {
      if (previous.digest !== record.digest) throw new Error('Same SHA has different content');
      return { action: 'noop' as const, record: previous };
    }
    // SHA hashes have no chronology: require explicit review for any different revision.
    return { action: 'review' as const, record };
  }
  return { action: 'create' as const, record };
}
