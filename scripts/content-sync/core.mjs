import { createHash } from 'node:crypto';

export function invariant(ok, message) {
  if (!ok) throw new Error(message);
}

export function validateConfig(config) {
  invariant(/^[\w.-]+\/[\w.-]+$/.test(config.repository ?? ''), 'Invalid source repository');
  invariant(
    /^[\w./-]+\.json$/.test(config.path ?? '') &&
      !config.path.split('/').some((p) => !p || p === '.' || p === '..'),
    'Invalid source path',
  );
  invariant(
    typeof config.ref === 'string' && /^[\w./-]+$/.test(config.ref) && !config.ref.includes('..'),
    'Invalid source ref',
  );
  return config;
}

export function validateSha(sha) {
  invariant(/^[a-f0-9]{40}$/.test(sha ?? ''), 'Expected full lowercase commit SHA');
  return sha;
}

function plain(value, max) {
  invariant(typeof value === 'string' && value.length <= max, 'Invalid text field');
  // Only plain text leaves this trust boundary. Reject executable/ambiguous markup.
  invariant(
    // biome-ignore lint/suspicious/noControlCharactersInRegex: this denylist intentionally covers invisible controls.
    !/[<>{}\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value),
    'Unsafe text',
  );
  const result = value.normalize('NFC').replace(/\s+/gu, ' ').trim();
  invariant(result.length > 0, 'Empty text');
  return result;
}

export function sanitize(input) {
  invariant(
    input && input.version === 1 && Array.isArray(input.items) && input.items.length <= 100,
    'Invalid source schema',
  );
  const seen = new Set();
  const items = input.items.map((item) => {
    invariant(item && typeof item === 'object', 'Invalid item');
    invariant(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id ?? '') &&
        item.id.length <= 80 &&
        !seen.has(item.id),
      'Invalid or duplicate id',
    );
    seen.add(item.id);
    const url = new URL(item.url);
    invariant(
      url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        url.hostname.includes('.'),
      'Unsafe URL',
    );
    // Explicit projection drops unknown fields (including raw MDX, prompts and metadata).
    return {
      id: item.id,
      title: plain(item.title, 120),
      summary: plain(item.summary, 240),
      url: url.href,
    };
  });
  return { version: 1, items: items.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) };
}

export function generate(input) {
  return `${JSON.stringify(sanitize(input), null, 2)}\n`;
}

export function digest(content) {
  return createHash('sha256').update(content).digest('hex');
}

export function github(
  token,
  {
    fetchImpl = fetch,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = Date.now,
  } = {},
) {
  return async function request(path, { method = 'GET', body, missing = false } = {}) {
    invariant(path.startsWith('/repos/') && !path.includes('://'), 'Invalid API path');
    for (let attempt = 0; attempt < 4; attempt++) {
      let response;
      try {
        response = await fetchImpl(`https://api.github.com${path}`, {
          method,
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
      } catch {
        // Mutations with an unknown outcome must be reconciled on the next run.
        if (method !== 'GET' || attempt === 3) throw new Error('GitHub transport failure');
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (response.status === 404 && missing) return null;
      if (response.ok) return response.status === 204 ? null : response.json();
      const limited =
        response.status === 429 ||
        (response.status === 403 &&
          (response.headers.has('retry-after') ||
            response.headers.get('x-ratelimit-remaining') === '0'));
      if (attempt < 3 && (limited || (method === 'GET' && response.status >= 500))) {
        const retry = response.headers.get('retry-after');
        const reset = response.headers.get('x-ratelimit-reset');
        const wait = retry
          ? /^\d+$/.test(retry)
            ? Number(retry) * 1000
            : Date.parse(retry) - now()
          : reset
            ? Number(reset) * 1000 - now()
            : 1000 * 2 ** attempt;
        invariant(
          Number.isFinite(wait) && wait <= 60_000,
          'Rate limit exceeds retry budget; rerun later',
        );
        await sleep(Math.max(1000, wait));
        continue;
      }
      throw new Error(`GitHub request failed (${response.status}); no response body logged`);
    }
  };
}

export async function readSource(api, config, requestedSha) {
  validateConfig(config);
  const root = `/repos/${config.repository}`;
  const commit = await api(`${root}/commits/${encodeURIComponent(config.ref)}`);
  const tip = validateSha(commit.sha);
  const sha = requestedSha ? validateSha(requestedSha) : tip;
  if (sha !== tip) {
    const comparison = await api(`${root}/compare/${sha}...${tip}`);
    invariant(
      ['ahead', 'identical'].includes(comparison.status),
      'SHA is not an ancestor of allowed ref',
    );
  }
  const file = await api(
    `${root}/contents/${config.path.split('/').map(encodeURIComponent).join('/')}?ref=${sha}`,
  );
  invariant(
    file.type === 'file' &&
      file.encoding === 'base64' &&
      file.size <= 256_000 &&
      typeof file.content === 'string' &&
      file.content.length <= 350_000,
    'Invalid or oversized source file',
  );
  const raw = Buffer.from(file.content, 'base64');
  invariant(raw.length <= 256_000, 'Source too large');
  return {
    sha,
    content: generate(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw))),
  };
}

export const OUTPUT = 'content/generated/source.json';
export const BRANCH = 'automation/content-sync';

export async function propose(
  api,
  repository,
  base,
  content,
  sha,
  canonicalize = (value) => generate(JSON.parse(value)),
  expectedBaseSha,
) {
  invariant(/^[\w.-]+\/[\w.-]+$/.test(repository), 'Invalid target repository');
  invariant(base === 'main', 'Only main is an allowed PR base');
  validateSha(sha);
  // Revalidate even when passed an artifact from a preceding step.
  invariant(canonicalize(content) === content, 'Output is not canonical');
  const root = `/repos/${repository}`;
  const current = await api(`${root}/contents/${OUTPUT}?ref=${encodeURIComponent(base)}`, {
    missing: true,
  });
  if (current && Buffer.from(current.content, 'base64').toString('utf8') === content)
    return 'unchanged';
  const baseRef = await api(`${root}/git/ref/heads/${encodeURIComponent(base)}`);
  if (expectedBaseSha)
    invariant(
      baseRef.object.sha === validateSha(expectedBaseSha),
      'Base changed; rerun with current policy',
    );
  let branch = await api(`${root}/git/ref/heads/${BRANCH}`, { missing: true });
  if (!branch) {
    await api(`${root}/git/refs`, {
      method: 'POST',
      body: { ref: `refs/heads/${BRANCH}`, sha: baseRef.object.sha },
    });
    branch = { object: { sha: baseRef.object.sha } };
  }
  // Refuse unexpected changes instead of overwriting a contributor's work.
  const compare = await api(`${root}/compare/${encodeURIComponent(base)}...${BRANCH}`);
  invariant(
    Array.isArray(compare.files) &&
      compare.files.length < 300 &&
      !compare.files.some(
        (file) =>
          file.filename !== OUTPUT || (file.previous_filename && file.previous_filename !== OUTPUT),
      ) &&
      ['ahead', 'identical'].includes(compare.status),
    'Automation branch requires manual reconciliation',
  );
  const existing = await api(`${root}/contents/${OUTPUT}?ref=${BRANCH}`, { missing: true });
  const prs = await api(
    `${root}/pulls?state=open&head=${encodeURIComponent(`${repository.split('/')[0]}:${BRANCH}`)}&base=${encodeURIComponent(base)}`,
  );
  invariant(
    prs.length <= 1 && prs.every((pr) => pr.draft === true),
    'Existing PR must remain draft',
  );
  if (!existing || Buffer.from(existing.content, 'base64').toString('utf8') !== content) {
    await api(`${root}/contents/${OUTPUT}`, {
      method: 'PUT',
      body: {
        message: 'chore: synchronize sanitized content',
        branch: BRANCH,
        content: Buffer.from(content).toString('base64'),
        ...(existing ? { sha: existing.sha } : {}),
      },
    });
  }
  const body = `Deterministic sanitized JSON. Source commit: ${sha}.\nCatalog SHA-256: ${digest(content)}.\n\nReview every source SHA in the catalog before merging. No automatic merge or deployment.`;
  if (!prs.length)
    await api(`${root}/pulls`, {
      method: 'POST',
      body: {
        title: 'chore: synchronize sanitized content',
        head: BRANCH,
        base,
        body,
        draft: true,
      },
    });
  else if (prs[0].body !== body)
    await api(`${root}/pulls/${prs[0].number}`, { method: 'PATCH', body: { body } });
  return 'proposed';
}
