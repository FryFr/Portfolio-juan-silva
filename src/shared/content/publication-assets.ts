import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { type ProjectPublication, publicationResources } from './project-publication';

/** Build-time validation only. Remote resources are never fetched. */
export async function validatePublicationAssets(
  publication: ProjectPublication | undefined,
  publicDirectory = resolve('public'),
): Promise<void> {
  const resources = publicationResources(publication).filter((resource) =>
    resource.startsWith('/'),
  );
  if (resources.length === 0) return;
  const root = await realpath(publicDirectory);
  for (const resource of new Set(resources)) {
    try {
      const file = await realpath(resolve(root, resource.slice(1)));
      const path = relative(root, file);
      if (
        isAbsolute(path) ||
        path === '..' ||
        path.startsWith(`..${sep}`) ||
        !(await stat(file)).isFile()
      ) {
        throw new Error('Resource must be a file inside public');
      }
    } catch (cause) {
      throw new Error(`Invalid publication asset: ${resource}`, { cause });
    }
  }
}
