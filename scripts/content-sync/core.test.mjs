import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRANCH,
  digest,
  generate,
  github,
  OUTPUT,
  propose,
  readSource,
  sanitize,
  validateConfig,
  validateSha,
} from './core.mjs';

// A regression cannot silently use the network.
globalThis.fetch = () => {
  throw new Error('Network forbidden in tests');
};
const sha = 'a'.repeat(40);
const item = {
  id: 'example',
  title: ' Example ',
  summary: 'Safe text',
  url: 'https://example.com/project',
};
const source = { version: 1, items: [item] };
const config = { repository: 'owner/source', ref: 'main', path: 'export/content.json' };
const encoded = (text) => ({
  type: 'file',
  encoding: 'base64',
  size: Buffer.byteLength(text),
  content: Buffer.from(text).toString('base64'),
});

test('canonical generation projects fields, normalizes and orders without timestamps', () => {
  const a = {
    version: 1,
    items: [
      { ...item, id: 'z', raw: 'secret' },
      { ...item, id: 'a' },
    ],
  };
  assert.equal(generate(a), generate({ ...a, items: [...a.items].reverse() }));
  assert.equal(sanitize(a).items[0].title, 'Example');
  assert.ok(!generate(a).includes('secret'));
  assert.equal(generate(JSON.parse(generate(a))), generate(a));
});

test('rejects markup, control characters, duplicate IDs and unsafe URLs', () => {
  for (const patch of [
    { title: '<script>x</script>' },
    { summary: '{process.env}' },
    { title: '\u202eevil' },
    { url: 'javascript:alert(1)' },
    { url: 'https://user:pass@example.com/' },
    { url: 'https://example.com/?token=secret' },
    { id: '../../escape' },
  ]) {
    assert.throws(() => sanitize({ version: 1, items: [{ ...item, ...patch }] }));
  }
  assert.throws(() => sanitize({ version: 1, items: [item, item] }));
  assert.throws(() => sanitize({ version: 1, items: Array(101).fill(item) }));
});

test('rejects mutable SHA and path traversal', () => {
  for (const value of ['main', 'a'.repeat(39), `${sha};echo`])
    assert.throws(() => validateSha(value));
  assert.throws(() => validateConfig({ ...config, path: '../secret.json' }));
});

test('resolves ref once and reads only pinned SHA', async () => {
  const calls = [];
  const result = await readSource(async (path) => {
    calls.push(path);
    return path.includes('/commits/') ? { sha } : encoded(JSON.stringify(source));
  }, config);
  assert.equal(result.content, generate(source));
  assert.equal(calls.length, 2);
  assert.ok(calls[1].endsWith(`?ref=${sha}`));
});

test('rejects untrusted ancestry and oversized source', async () => {
  await assert.rejects(
    readSource(
      async (path) => (path.includes('/commits/') ? { sha } : { status: 'diverged' }),
      config,
      'b'.repeat(40),
    ),
    /ancestor/,
  );
  await assert.rejects(
    readSource(
      async (path) => (path.includes('/commits/') ? { sha } : { ...encoded('{}'), size: 256001 }),
      config,
    ),
    /oversized/,
  );
});

test('retries rate limits with bounded delay and hides response bodies', async () => {
  let calls = 0;
  const waits = [];
  const api = github('fake', {
    fetchImpl: async () =>
      ++calls === 1
        ? new Response('secret', { status: 429, headers: { 'retry-after': '2' } })
        : Response.json({ ok: true }),
    sleep: async (ms) => waits.push(ms),
  });
  assert.deepEqual(await api('/repos/a/b'), { ok: true });
  assert.deepEqual(waits, [2000]);
  const denied = github('fake', { fetchImpl: async () => new Response('secret', { status: 403 }) });
  await assert.rejects(denied('/repos/a/b'), /\(403\)/);
  const exhausted = github('fake', {
    fetchImpl: async () => new Response('', { status: 429, headers: { 'retry-after': '999' } }),
  });
  await assert.rejects(exhausted('/repos/a/b'), /budget/);
});

test('does not replay ambiguous writes; GET retries are finite', async () => {
  let calls = 0;
  const api = github('fake', {
    fetchImpl: async () => {
      calls++;
      throw new Error('token secret');
    },
    sleep: async () => {},
  });
  await assert.rejects(api('/repos/a/b', { method: 'POST', body: {} }), /transport/);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(api('/repos/a/b'), /transport/);
  assert.equal(calls, 4);
});

test('unchanged output causes no writes', async () => {
  let calls = 0;
  assert.equal(
    await propose(
      async (_, options) => {
        calls++;
        assert.equal(options.method, undefined);
        return encoded(generate(source));
      },
      'owner/target',
      'main',
      generate(source),
      sha,
    ),
    'unchanged',
  );
  assert.equal(calls, 1);
});

function targetApi({ existing = false, foreign = false } = {}) {
  const writes = [];
  return {
    writes,
    api: async (path, options = {}) => {
      if (options.method) {
        writes.push({ path, ...options });
        return {};
      }
      if (path.includes('/contents/'))
        return path.endsWith(`ref=${BRANCH}`) && existing
          ? { ...encoded(generate(source)), sha }
          : null;
      if (path.includes('/git/ref/heads/'))
        return path.endsWith('/main') || existing ? { object: { sha } } : null;
      if (path.includes('/compare/'))
        return { status: 'ahead', files: [{ filename: foreign ? 'src/app/page.tsx' : OUTPUT }] };
      if (path.includes('/pulls?'))
        return existing
          ? [
              {
                number: 1,
                draft: true,
                body: `Deterministic sanitized JSON. Source commit: ${sha}.\nCatalog SHA-256: ${digest(generate(source))}.\n\nReview every source SHA in the catalog before merging. No automatic merge or deployment.`,
              },
            ]
          : [];
      throw new Error(`Unexpected fixture path: ${path}`);
    },
  };
}

test('creates fixed branch, single file commit and draft PR', async () => {
  const { api, writes } = targetApi();
  assert.equal(await propose(api, 'owner/target', 'main', generate(source), sha), 'proposed');
  assert.equal(writes.length, 3);
  assert.equal(writes[0].body.ref, `refs/heads/${BRANCH}`);
  assert.ok(writes[1].path.endsWith(OUTPUT));
  assert.equal(writes[2].body.draft, true);
});

test('rerun reuses branch and PR, foreign edits fail closed', async () => {
  const existing = targetApi({ existing: true });
  await propose(existing.api, 'owner/target', 'main', generate(source), sha);
  assert.equal(existing.writes.length, 0);
  const foreign = targetApi({ existing: true, foreign: true });
  await assert.rejects(
    propose(foreign.api, 'owner/target', 'main', generate(source), sha),
    /reconciliation/,
  );
  assert.equal(foreign.writes.length, 0);
});

test('rejects alternate bases, stale policy revision and promoted PRs without content writes', async () => {
  const { api, writes } = targetApi({ existing: true });
  await assert.rejects(propose(api, 'owner/target', BRANCH, generate(source), sha), /base/);
  await assert.rejects(
    propose(api, 'owner/target', 'main', generate(source), sha, undefined, 'b'.repeat(40)),
    /Base changed/,
  );
  await assert.rejects(
    propose(
      async (path, options) =>
        path.includes('/pulls?') ? [{ number: 1, draft: false }] : api(path, options),
      'owner/target',
      'main',
      generate(source),
      sha,
    ),
    /draft/,
  );
  assert.equal(writes.length, 0);
});

test('updates existing draft PR provenance and never mutates main', async () => {
  const { api, writes } = targetApi({ existing: true });
  await propose(
    async (path, options) =>
      path.includes('/pulls?')
        ? [{ number: 1, draft: true, body: 'Old provenance' }]
        : api(path, options),
    'owner/target',
    'main',
    generate(source),
    sha,
  );
  assert.equal(writes.length, 1);
  assert.equal(writes[0].method, 'PATCH');
  assert.ok(writes[0].path.endsWith('/pulls/1'));
  assert.ok(writes[0].body.body.includes(digest(generate(source))));
});
