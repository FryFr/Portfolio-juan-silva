import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { digest, github, invariant, OUTPUT, propose, readSource, validateConfig } from './core.mjs';

try {
  const mode = process.argv[2];
  invariant(['prepare', 'propose', 'fixture'].includes(mode), 'Use prepare, propose or fixture');
  if (mode === 'fixture') {
    const { generate } = await import('./core.mjs');
    const content = generate(JSON.parse(await readFile(process.argv[3], 'utf8')));
    await mkdir('content/generated', { recursive: true });
    await writeFile(OUTPUT, content);
  } else if (mode === 'prepare') {
    const config = validateConfig({
      repository: process.env.SOURCE_REPOSITORY,
      ref: process.env.SOURCE_REF,
      path: process.env.SOURCE_PATH,
    });
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const payload =
      process.env.GITHUB_EVENT_NAME === 'repository_dispatch' ? event.client_payload : event.inputs;
    invariant(
      !payload?.repository || payload.repository === config.repository,
      'Dispatch repository not allowed',
    );
    const requestedSha = payload?.sha;
    if (process.env.GITHUB_EVENT_NAME === 'repository_dispatch')
      invariant(requestedSha, 'Dispatch requires SHA');
    const result = await readSource(
      github(process.env.SOURCE_READ_TOKEN || process.env.GH_TOKEN),
      config,
      requestedSha,
    );
    await mkdir('.content-sync', { recursive: true });
    await writeFile(
      '.content-sync/result.json',
      JSON.stringify({ ...result, digest: digest(result.content) }),
    );
    process.stdout.write('Prepared sanitized content\n');
  } else {
    const result = JSON.parse(await readFile('.content-sync/result.json', 'utf8'));
    invariant(digest(result.content) === result.digest, 'Artifact digest mismatch');
    const status = await propose(
      github(process.env.GH_TOKEN),
      process.env.GITHUB_REPOSITORY,
      process.env.TARGET_BRANCH,
      result.content,
      result.sha,
    );
    process.stdout.write(`${status}\n`);
  }
} catch (error) {
  // Never print input, API response bodies or tokens, including JSON/URL parser errors.
  process.stderr.write(
    `Content sync failed (${error instanceof SyntaxError ? 'invalid JSON' : error instanceof TypeError ? 'invalid input or transport' : 'validation or API failure'}). Review configuration, permissions and rate limit; rerun after correction.\n`,
  );
  process.exitCode = 1;
}
