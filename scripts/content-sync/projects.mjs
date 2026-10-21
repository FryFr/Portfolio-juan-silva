import { allowlistSchema, MANIFEST_PATH } from '../portfolio/contract.ts';
import { validateBatch } from '../security/validate-batch.mjs';
import { invariant, validateSha } from './core.mjs';

export function parseRequest(eventName, event, allowlist) {
  invariant(
    ['schedule', 'workflow_dispatch', 'repository_dispatch'].includes(eventName),
    'Event forbidden',
  );
  const policy = allowlistSchema.parse(allowlist);
  const payload = eventName === 'repository_dispatch' ? event.client_payload : event.inputs;
  invariant(
    !payload || (typeof payload === 'object' && !Array.isArray(payload)),
    'Invalid payload',
  );
  invariant(
    Object.keys(payload ?? {}).every((key) => ['repository', 'sha'].includes(key)),
    'Unknown dispatch field',
  );
  const repository = payload?.repository || undefined;
  const sha = payload?.sha || undefined;
  invariant(Boolean(repository) === Boolean(sha), 'Repository and SHA must be paired');
  if (eventName === 'repository_dispatch')
    invariant(repository && sha, 'Dispatch requires repository and SHA');
  if (sha) validateSha(sha);
  if (repository)
    invariant(
      policy.projects.some((entry) => entry.repository === repository),
      'Repository not allowed',
    );
  // A dispatch selects a revision, never the policy or output path. Refresh the entire
  // authorized catalog so a partial dispatch cannot erase other generated entries.
  return { projects: policy.projects, repository, sha };
}

export async function readProject(api, entry, requestedSha) {
  const root = `/repos/${entry.repository}`;
  const repository = await api(root);
  invariant(
    repository.id === entry.repositoryId && repository.full_name === entry.repository,
    'Repository identity mismatch',
  );
  invariant(
    typeof repository.default_branch === 'string' && repository.default_branch.length > 0,
    'Missing default branch',
  );
  const tip = validateSha(
    (await api(`${root}/commits/${encodeURIComponent(repository.default_branch)}`)).sha,
  );
  const sha = requestedSha ? validateSha(requestedSha) : tip;
  if (sha !== tip) {
    const comparison = await api(`${root}/compare/${sha}...${tip}`);
    invariant(
      ['ahead', 'identical'].includes(comparison.status),
      'SHA outside default branch ancestry',
    );
  }
  const resolvedSha = validateSha((await api(`${root}/commits/${sha}`)).sha);
  invariant(resolvedSha === sha, 'Resolved SHA mismatch');
  const file = await api(`${root}/contents/${MANIFEST_PATH}?ref=${sha}`);
  invariant(
    file.type === 'file' &&
      file.encoding === 'base64' &&
      Number.isInteger(file.size) &&
      file.size > 0 &&
      file.size <= 16_384 &&
      typeof file.content === 'string' &&
      file.content.length <= 24_000,
    'Invalid manifest file',
  );
  const bytes = Buffer.from(file.content, 'base64');
  invariant(bytes.length === file.size, 'Manifest byte count mismatch');
  return {
    yaml: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    source: {
      repository: entry.repository,
      repositoryId: repository.id,
      requestedSha: sha,
      resolvedSha,
      path: MANIFEST_PATH,
    },
  };
}

export function canonicalCatalog(records, validate) {
  invariant(
    Array.isArray(records) && records.length > 0 && records.length <= 100,
    'Invalid records',
  );
  const seen = new Set();
  const validated = records
    .map((record) => {
      const result = validate(
        JSON.stringify(record.manifest),
        {
          repository: record.repository,
          repositoryId: record.repositoryId,
          requestedSha: record.sha,
          resolvedSha: record.sha,
          path: MANIFEST_PATH,
        },
        record,
      ).record;
      invariant(!seen.has(result.manifest.slug), 'Duplicate project');
      seen.add(result.manifest.slug);
      return result;
    })
    .sort((a, b) => a.manifest.slug.localeCompare(b.manifest.slug, 'en'));
  const content = `${JSON.stringify({ schemaVersion: 1, projects: validated }, null, 2)}\n`;
  invariant(
    validateBatch({ version: 1, files: [{ path: 'generated/source.json', content }] }).ok,
    'Generated security validation failed',
  );
  return content;
}

export async function prepareProjects(api, request, validate) {
  const records = [];
  for (const entry of request.projects) {
    const input = await readProject(
      api,
      entry,
      request.repository === entry.repository ? request.sha : undefined,
    );
    // Validate ownership, schema and manual collisions before producing any output.
    records.push(validate(input.yaml, input.source).record);
  }
  return records.length ? canonicalCatalog(records, validate) : null;
}
