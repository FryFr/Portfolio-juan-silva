import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateProject } from './contract.ts';

const root = new URL('../../', import.meta.url);
const [manifestPath, sourcePath, previousPath, ...extra] = process.argv.slice(2);
try {
  if (!manifestPath || !sourcePath || extra.length) {
    throw new Error('Usage: pnpm portfolio:validate <project.yml> <source.json> [previous.json]');
  }
  const json = (path: string | URL): unknown => JSON.parse(readFileSync(path, 'utf8'));
  const result = validateProject({
    yaml: readFileSync(manifestPath, 'utf8'),
    source: json(sourcePath),
    allowlist: json(new URL('config/portfolio-allowlist.json', root)),
    manualSlugs: readdirSync(fileURLToPath(new URL('content/projects/', root)))
      .filter((file) => /\.(es|en)\.mdx$/.test(file))
      .map((file) => file.replace(/\.(es|en)\.mdx$/, '')),
    ...(previousPath ? { previous: json(previousPath) } : {}),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Validation failed'}\n`);
  process.exitCode = 1;
}
