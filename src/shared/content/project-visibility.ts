import { z } from 'zod';

/** Omitted visibility preserves existing, manually authored MDX projects. */
export const projectVisibilitySchema = z
  .enum(['public', 'private-teaser', 'manual-only', 'hidden'])
  .default('public');

export type ProjectVisibility = z.infer<typeof projectVisibilitySchema>;

/** Teasers and manual-only entries publish their curated MDX, like public entries. */
export function isProjectVisible(project: { visibility?: ProjectVisibility }): boolean {
  return (project.visibility ?? 'public') !== 'hidden';
}
