import { z } from 'zod';
import { projectPublicationSchema } from './project-publication';

export const projectSchema = z.object({
  publication: projectPublicationSchema.optional(),
  title: z.string().min(1),
  summary: z.string().min(1).max(200),
  role: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  stack: z.array(z.string().min(1)).min(1),
  client: z.string().optional(),
  cover: z.string().optional(),
  links: z
    .object({
      live: z.string().url().optional(),
      repo: z.string().url().optional(),
      caseStudy: z.string().url().optional(),
    })
    .optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(0),
});
