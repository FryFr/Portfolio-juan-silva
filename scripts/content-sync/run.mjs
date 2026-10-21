import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validateLocalProject } from '../portfolio/validate.ts';
import { digest, github, invariant, propose } from './core.mjs';
import { canonicalCatalog, parseRequest, prepareProjects } from './projects.mjs';

const root = new URL('../../', import.meta.url);

// Dependency injection is for offline tests only. The CLI always loads the central policy.
export async function run(
  mode,
  {
    env = process.env,
    read = readFile,
    write = writeFile,
    makeDirectory = mkdir,
    api = github(env.GH_TOKEN),
    validate = validateLocalProject,
  } = {},
) {
  invariant(['prepare', 'propose'].includes(mode), 'Use prepare or propose');
  const policy = JSON.parse(await read(new URL('config/portfolio-allowlist.json', root), 'utf8'));
  const event = JSON.parse(await read(env.GITHUB_EVENT_PATH, 'utf8'));
  const request = parseRequest(env.GITHUB_EVENT_NAME, event, policy);
  invariant(env.TARGET_BRANCH === 'main', 'Only main is an allowed PR base');
  if (mode === 'prepare') {
    const content = await prepareProjects(api, request, validate);
    const artifact =
      content === null
        ? { version: 1, noop: true }
        : { version: 1, content, digest: digest(content) };
    await makeDirectory('.content-sync', { recursive: true });
    await write('.content-sync/result.json', `${JSON.stringify(artifact)}\n`);
    if (env.GITHUB_OUTPUT)
      await write(env.GITHUB_OUTPUT, `changed=${content !== null}\n`, { flag: 'a' });
    return content === null ? 'empty allowlist: no changes' : 'prepared';
  }
  const result = JSON.parse(await read('.content-sync/result.json', 'utf8'));
  invariant(result.version === 1, 'Invalid artifact');
  if (!request.projects.length) {
    invariant(result.noop === true, 'Empty policy artifact mismatch');
    return 'empty allowlist: no changes';
  }
  invariant(
    typeof result.content === 'string' && digest(result.content) === result.digest,
    'Artifact digest mismatch',
  );
  const canonicalize = (content) => {
    const catalog = JSON.parse(content);
    invariant(catalog.schemaVersion === 1, 'Invalid catalog version');
    invariant(catalog.projects.length === request.projects.length, 'Catalog policy mismatch');
    return canonicalCatalog(catalog.projects, validate);
  };
  invariant(canonicalize(result.content) === result.content, 'Noncanonical artifact');
  return propose(
    api,
    env.GITHUB_REPOSITORY,
    env.TARGET_BRANCH,
    result.content,
    JSON.parse(result.content).projects[0].sha,
    canonicalize,
    env.GITHUB_SHA,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${await run(process.argv[2])}\n`);
  } catch {
    // Source values, parser diagnostics, response bodies and credentials stay out of logs.
    process.stderr.write(
      'Content sync failed: validation, permissions or transport. Review configuration and rerun.\n',
    );
    process.exitCode = 1;
  }
}
