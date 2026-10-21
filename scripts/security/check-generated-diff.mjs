import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { OUTPUT } from '../content-sync/core.mjs';
import { canonicalCatalog } from '../content-sync/projects.mjs';
import { validateLocalProject } from '../portfolio/validate.ts';

try {
  const base = process.env.GENERATED_DIFF_BASE || 'HEAD';
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  // Resolve before passing the revision to diff: no flags or arbitrary pathspecs.
  const revision = git('rev-parse', '--verify', '--end-of-options', `${base}^{commit}`).trim();
  const changed = git('diff', '--name-only', '-z', revision, '--').split('\0').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z')
    .split('\0')
    .filter(Boolean);
  const paths = [...new Set([...changed, ...untracked])];
  if (process.env.GENERATED_DIFF_ONLY === 'true' && paths.some((path) => path !== OUTPUT)) {
    throw new Error('Automation diff includes a non-generated file');
  }
  const tracked = git('ls-files', '-z', '--', 'content/generated', 'generated')
    .split('\0')
    .filter(Boolean);
  for (const path of [...new Set([...paths, ...tracked])].filter((path) =>
    /^(?:content\/generated|generated)(?:\/|$)/.test(path),
  )) {
    if (path !== OUTPUT || !lstatSync(path).isFile())
      throw new Error('Unexpected generated path or deletion');
    const content = readFileSync(path, 'utf8');
    const catalog = JSON.parse(content);
    if (
      catalog.schemaVersion !== 1 ||
      canonicalCatalog(catalog.projects, validateLocalProject) !== content
    ) {
      throw new Error('Noncanonical generated catalog');
    }
    const policy = JSON.parse(readFileSync('config/portfolio-allowlist.json', 'utf8'));
    if (catalog.projects.length !== policy.projects.length)
      throw new Error('Incomplete generated catalog');
  }
  process.stdout.write('Generated diff validated\n');
} catch {
  process.stderr.write(
    'Generated diff rejected: review paths, policy, schema and security findings\n',
  );
  process.exitCode = 1;
}
