import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { validatePublicationAssets } from '@/shared/content/publication-assets';

describe('publication assets at build time', () => {
  let directory: string;
  let publicDirectory: string;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'publication-assets-'));
    publicDirectory = join(directory, 'public');
    await mkdir(publicDirectory);
    await writeFile(join(publicDirectory, 'screen.png'), 'fixture');
    await writeFile(join(directory, 'private.png'), 'private fixture');
    await symlink(join(directory, 'private.png'), join(publicDirectory, 'outside.png'));
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('supports legacy publications and remote URLs without local IO', async () => {
    await expect(validatePublicationAssets(undefined, '/missing')).resolves.toBeUndefined();
    await expect(
      validatePublicationAssets(
        { gallery: [{ id: 'remote', src: 'https://example.invalid/image.png', alt: 'Fixture' }] },
        '/missing',
      ),
    ).resolves.toBeUndefined();
  });

  it.each(['/screen.png', '/missing.png', '/outside.png'])('validates %s', async (src) => {
    const result = validatePublicationAssets(
      { gallery: [{ id: 'screen', src, alt: 'Fixture' }] },
      publicDirectory,
    );
    if (src === '/screen.png') await expect(result).resolves.toBeUndefined();
    else await expect(result).rejects.toThrow(`Invalid publication asset: ${src}`);
  });

  it('checks architecture and evidence resources too', async () => {
    await expect(
      validatePublicationAssets(
        {
          architecture: {
            summary: 'Fixture',
            nodes: [{ id: 'api', label: 'API' }],
            edges: [],
            diagram: '/missing.svg',
            diagramAlt: 'Fixture',
          },
        },
        publicDirectory,
      ),
    ).rejects.toThrow('/missing.svg');
    await expect(
      validatePublicationAssets(
        {
          evidence: [
            { id: 'report', title: 'Fixture', kind: 'document', resource: '/missing.pdf' },
          ],
        },
        publicDirectory,
      ),
    ).rejects.toThrow('/missing.pdf');
  });
});
