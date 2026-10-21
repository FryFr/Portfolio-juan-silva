import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateProject } from './contract.ts';

const root = new URL('../../', import.meta.url);
export function validateLocalProject(yaml: string, source: unknown, previous?: unknown) {
  return validateProject({
    yaml,
    source,
    allowlist: JSON.parse(readFileSync(new URL('config/portfolio-allowlist.json', root), 'utf8')),
    manualSlugs: readdirSync(fileURLToPath(new URL('content/projects/', root)))
      .filter((file) => /\.(es|en)\.mdx$/.test(file))
      .map((file) => file.replace(/\.(es|en)\.mdx$/, '')),
    ...(previous === undefined ? {} : { previous }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [manifestPath, sourcePath, previousPath, ...extra] = process.argv.slice(2);
  try {
    if (!manifestPath || !sourcePath || extra.length) {
      throw new Error('Usage: pnpm portfolio:validate <project.yml> <source.json> [previous.json]');
    }
    const json = (path: string | URL): unknown => JSON.parse(readFileSync(path, 'utf8'));
    const result = validateLocalProject(
      readFileSync(manifestPath, 'utf8'),
      json(sourcePath),
      previousPath ? json(previousPath) : undefined,
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'Validation failed'}\n`);
    process.exitCode = 1;
  }
}
