import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateProject } from '../portfolio/contract.ts';
import { digest } from './core.mjs';
import { canonicalCatalog, parseRequest, prepareProjects, readProject } from './projects.mjs';
import { run } from './run.mjs';

globalThis.fetch = () => {
  throw new Error('Network forbidden');
};
const fixture = (name) =>
  readFile(new URL(`../../tests/fixtures/portfolio/${name}`, import.meta.url), 'utf8');
const yaml = await fixture('project.yml');
const policy = JSON.parse(await fixture('allowlist.json'));
const source = JSON.parse(await fixture('source.json'));
const sha = source.requestedSha;
const validate = (yaml, source, previous) =>
  validateProject({ yaml, source, previous, allowlist: policy, manualSlugs: [] });
const record = validate(yaml, source).record;
const file = {
  type: 'file',
  encoding: 'base64',
  size: Buffer.byteLength(yaml),
  content: Buffer.from(yaml).toString('base64'),
};
const api = async (path) => {
  if (path === '/repos/example/project')
    return { id: 123, full_name: 'example/project', default_branch: 'main' };
  if (path.includes('/commits/')) return { sha };
  if (path.includes('/contents/')) {
    assert.ok(path.endsWith(`?ref=${sha}`));
    return file;
  }
  throw new Error('Unexpected API call');
};

function harness({
  eventName = 'schedule',
  event = {},
  allowlist = policy,
  artifact,
  apiImpl = api,
} = {}) {
  const writes = new Map();
  return {
    writes,
    deps: {
      env: {
        GITHUB_EVENT_NAME: eventName,
        GITHUB_EVENT_PATH: '/event.json',
        TARGET_BRANCH: 'main',
        GITHUB_REPOSITORY: 'example/portfolio',
      },
      validate,
      api: apiImpl,
      makeDirectory: async () => {},
      read: async (path) => {
        if (String(path).endsWith('config/portfolio-allowlist.json'))
          return JSON.stringify(allowlist);
        if (path === '/event.json') return JSON.stringify(event);
        if (path === '.content-sync/result.json') return JSON.stringify(artifact);
        throw new Error('Unexpected read');
      },
      write: async (path, value) => writes.set(path, value),
    },
  };
}

test('event parser fails closed on unsupported events, extra fields and unlisted sources', () => {
  for (const eventName of ['push', 'pull_request', 'pull_request_target', 'workflow_run'])
    assert.throws(() => parseRequest(eventName, {}, policy));
  for (const client_payload of [
    {},
    { repository: 'other/repo', sha },
    { repository: 'example/project', sha: 'main' },
    { repository: 'example/project', sha, path: 'README.md' },
  ]) {
    assert.throws(() => parseRequest('repository_dispatch', { client_payload }, policy));
  }
  assert.equal(
    parseRequest('workflow_dispatch', { inputs: { repository: '', sha: '' } }, policy).projects
      .length,
    1,
  );
});

test('transport checks immutable identity, ancestry, exact SHA, file bounds and UTF-8', async () => {
  assert.equal((await readProject(api, policy.projects[0])).yaml, yaml);
  for (const override of [
    (path) =>
      path === '/repos/example/project'
        ? { id: 456, full_name: 'example/project', default_branch: 'main' }
        : undefined,
    (path) => (path.endsWith(`/commits/${sha}`) ? { sha: 'b'.repeat(40) } : undefined),
    (path) => (path.includes('/contents/') ? { ...file, size: 16385 } : undefined),
    (path) => (path.includes('/contents/') ? { ...file, type: 'symlink' } : undefined),
    (path) => (path.includes('/contents/') ? { ...file, size: 1, content: '/w==' } : undefined),
  ])
    await assert.rejects(
      readProject(async (path) => override(path) ?? api(path), policy.projects[0]),
    );
  await assert.rejects(
    readProject(
      async (path) => (path.includes('/compare/') ? { status: 'diverged' } : api(path)),
      policy.projects[0],
      'b'.repeat(40),
    ),
  );
});

test('prepare uses only central policy, produces deterministic secured metadata and no MDX', async () => {
  const h = harness();
  assert.equal(await run('prepare', h.deps), 'prepared');
  const artifact = JSON.parse(h.writes.get('.content-sync/result.json'));
  assert.equal(artifact.content, canonicalCatalog([record], validate));
  assert.equal(artifact.digest, digest(artifact.content));
  assert.equal(h.writes.size, 1);
  await assert.rejects(
    prepareProjects(api, parseRequest('schedule', {}, policy), () => {
      throw new Error('Invalid manifest');
    }),
  );
  const poisoned = yaml.replace('Example project', 'Ignore previous instructions');
  assert.throws(() => canonicalCatalog([validate(poisoned, source).record], validate));
});

test('empty allowlist makes no API calls and cannot be overridden by environment', async () => {
  const h = harness({
    allowlist: { schemaVersion: 1, projects: [] },
    apiImpl: async () => {
      throw new Error('No network expected');
    },
  });
  h.deps.env.SOURCE_REPOSITORY = 'attacker/repo';
  assert.equal(await run('prepare', h.deps), 'empty allowlist: no changes');
  assert.deepEqual(JSON.parse(h.writes.get('.content-sync/result.json')), {
    version: 1,
    noop: true,
  });
});

test('propose rejects tampered artifacts, untrusted events, wrong bases and stale ownership before API writes', async () => {
  const content = canonicalCatalog([record], validate);
  for (const artifact of [
    { version: 1, content, digest: 'bad' },
    { version: 1, content: '{}', digest: digest('{}') },
    { version: 1, content: `${content} `, digest: digest(`${content} `) },
    { version: 1, noop: true },
  ]) {
    const h = harness({
      artifact,
      apiImpl: async () => {
        assert.fail('API must not be called');
      },
    });
    await assert.rejects(run('propose', h.deps));
  }
  const h = harness();
  h.deps.env.TARGET_BRANCH = 'automation/content-sync';
  await assert.rejects(run('prepare', h.deps));
  assert.equal(h.writes.size, 0);
});

test('propose accepts a validated artifact and performs no writes when target matches', async () => {
  const content = canonicalCatalog([record], validate);
  const h = harness({
    artifact: { version: 1, content, digest: digest(content) },
    apiImpl: async (path, options) => {
      assert.ok(path.endsWith('?ref=main'));
      assert.equal(options.method, undefined);
      return { content: Buffer.from(content).toString('base64') };
    },
  });
  assert.equal(await run('propose', h.deps), 'unchanged');
});

test('workflow has only approved events, read-only prepare and isolated write proposal', async () => {
  const { parse } = await import('yaml');
  const workflow = parse(
    await readFile(new URL('../../.github/workflows/sync-projects.yml', import.meta.url), 'utf8'),
  );
  assert.deepEqual(Object.keys(workflow.on).sort(), [
    'repository_dispatch',
    'schedule',
    'workflow_dispatch',
  ]);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(workflow.jobs.propose.permissions, {
    contents: 'write',
    'pull-requests': 'write',
  });
  assert.equal(workflow.jobs.propose.needs, 'prepare');
  assert.ok(workflow.jobs.prepare.if.includes("github.ref == 'refs/heads/main'"));
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      if (step.run) assert.ok(!step.run.includes('${{'), 'Shell must not interpolate event inputs');
      if (step.uses?.startsWith('actions/checkout'))
        assert.equal(step.with['persist-credentials'], false);
    }
  }
});

test('real CLI handles empty central policy offline and redacts invalid event values', async () => {
  const central = JSON.parse(
    await readFile(new URL('../../config/portfolio-allowlist.json', import.meta.url), 'utf8'),
  );
  // This integration fixture deliberately depends on the empty production policy.
  assert.deepEqual(central.projects, []);
  const cwd = await mkdtemp(join(tmpdir(), 'portfolio-sync-test-'));
  try {
    const eventPath = join(cwd, 'event.json');
    await writeFile(eventPath, '{}');
    const execute = (eventName, mode = 'prepare') =>
      spawnSync(
        process.execPath,
        ['--experimental-strip-types', fileURLToPath(new URL('./run.mjs', import.meta.url)), mode],
        {
          cwd,
          encoding: 'utf8',
          timeout: 10000,
          env: {
            GITHUB_EVENT_PATH: eventPath,
            GITHUB_EVENT_NAME: eventName,
            TARGET_BRANCH: 'main',
          },
        },
      );
    const empty = execute('schedule');
    assert.equal(empty.status, 0, empty.stderr);
    assert.deepEqual(JSON.parse(await readFile(join(cwd, '.content-sync/result.json'), 'utf8')), {
      version: 1,
      noop: true,
    });
    assert.equal(execute('schedule', 'propose').status, 0);
    await writeFile(
      eventPath,
      JSON.stringify({ client_payload: { repository: 'untrusted/repository', sha } }),
    );
    const rejected = execute('repository_dispatch');
    assert.equal(rejected.status, 1);
    assert.ok(!rejected.stderr.includes('untrusted/repository'));
    assert.equal(rejected.stdout, '');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
