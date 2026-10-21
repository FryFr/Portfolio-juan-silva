// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allowlistSchema, parseManifest, validateProject } from '../../scripts/portfolio/contract';
import allowlist from '../fixtures/portfolio/allowlist.json';
import source from '../fixtures/portfolio/source.json';

const yaml = readFileSync(new URL('../fixtures/portfolio/project.yml', import.meta.url), 'utf8');
const input = { yaml, allowlist, source, manualSlugs: [] };

describe('portfolio contract v1 (offline)', () => {
  it('creates a deterministic metadata-only proposal compatible with manual project fields', () => {
    const result = validateProject(input);
    expect(result.action).toBe('create');
    expect(result).toEqual(validateProject(input));
    expect(result.record.manifest.locales.es.summary.length).toBeLessThanOrEqual(200);
    expect(result.record.manifest).not.toHaveProperty('body');
    expect(validateProject({ ...input, previous: result.record }).action).toBe('noop');
  });

  it.each([
    ['unknown version', yaml.replace('schemaVersion: 1', 'schemaVersion: 2')],
    ['unknown field / MDX', `${yaml}\nbody: remote.mdx`],
    ['editorial control', `${yaml}\nfeatured: true`],
    ['duplicate keys', `${yaml}\nslug: other`],
    ['multiple documents', `${yaml}\n---\nslug: other`],
    ['anchor', yaml.replace('stack: [', 'stack: &stack [')],
    ['alias', `${yaml}\nbody: *missing`],
    ['tag', yaml.replace('year: 2026', 'year: !!int 2026')],
    ['traversal', yaml.replace('example-project', '../project')],
    ['unsafe URL', yaml.replace('https://example.com', 'javascript:alert(1)')],
    ['credentials', yaml.replace('https://example.com', 'https://user:pass@example.com')],
    ['markup', yaml.replace('Example project', '<script>alert(1)</script>')],
    ['missing locale', yaml.replace('  en:', '  fr:')],
    ['oversize', ' '.repeat(16_385)],
  ])('rejects %s', (_name, value) => {
    expect(() => parseManifest(value)).toThrow();
  });

  it.each([
    { repository: 'attacker/project' },
    { repositoryId: 456 },
    { requestedSha: 'main' },
    { resolvedSha: 'a'.repeat(7) },
    { resolvedSha: 'b'.repeat(40) },
    { path: 'README.md' },
  ])('rejects invalid source %j', (override) => {
    expect(() => validateProject({ ...input, source: { ...source, ...override } })).toThrow();
  });

  it('fails closed on empty allowlist, ownership conflicts, and manual collisions', () => {
    expect(() =>
      validateProject({ ...input, allowlist: { schemaVersion: 1, projects: [] } }),
    ).toThrow();
    expect(() =>
      validateProject({ ...input, yaml: yaml.replace('example/project', 'other/project') }),
    ).toThrow();
    expect(() => validateProject({ ...input, manualSlugs: ['example-project'] })).toThrow();
    expect(() =>
      allowlistSchema.parse({
        ...allowlist,
        projects: [...allowlist.projects, ...allowlist.projects],
      }),
    ).toThrow();
  });

  it('requires review for changed SHA, including old event replays', () => {
    const previous = validateProject(input).record;
    const next = validateProject({
      ...input,
      previous,
      source: { ...source, requestedSha: 'b'.repeat(40), resolvedSha: 'b'.repeat(40) },
    });
    expect(next.action).toBe('review');
    expect(validateProject({ ...input, previous: next.record }).action).toBe('review');
  });

  it('rejects inconsistent same-SHA content and corrupt previous records', () => {
    const previous = validateProject(input).record;
    expect(() =>
      validateProject({ ...input, previous, yaml: yaml.replace('year: 2026', 'year: 2025') }),
    ).toThrow();
    for (const override of [
      { repositoryId: 456 },
      { digest: '0'.repeat(64) },
      { schemaVersion: 2 },
    ]) {
      expect(() => validateProject({ ...input, previous: { ...previous, ...override } })).toThrow();
    }
  });

  it('ignores YAML formatting and key order for idempotency', () => {
    const previous = validateProject(input).record;
    const reordered = `${yaml.replace('schemaVersion: 1\n', '')}\nschemaVersion: 1 # comment\n`;
    expect(validateProject({ ...input, yaml: reordered, previous }).action).toBe('noop');
  });
});
