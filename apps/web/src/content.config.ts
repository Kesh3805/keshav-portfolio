import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import taxonomy from '../../../content/taxonomy.json';

const CONTENT = '../../content';

const tag = z.enum(taxonomy.tags as [string, ...string[]]);
const technology = z.enum(taxonomy.technologies as [string, ...string[]]);
const motion = z.enum(taxonomy.motion as [string, ...string[]]);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case');

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: `${CONTENT}/projects` }),
  schema: z.object({
    title: z.string().min(1),
    slug,
    category: z.enum(['professional', 'personal']),
    description: z.string().min(20).max(200),
    technologies: z.array(technology).min(1),
    repository: z.url().optional(),
    liveUrl: z.url().optional(),
    role: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().int().default(100),
    tags: z.array(tag).default([]),
    motion: motion.optional(),
    metrics: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
          /** Surface this figure in the homepage HUD. */
          highlight: z.boolean().default(false),
        }),
      )
      .default([]),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: `${CONTENT}/writing` }),
  schema: z.object({
    title: z.string().min(1),
    slug,
    description: z.string().min(20).max(240),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(tag).min(1),
    relatedProjects: z.array(slug).min(1),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT}/experience` }),
  schema: z.object({
    company: z.string().min(1),
    role: z.string().min(1),
    employmentType: z.string().optional(),
    description: z.string().min(20),
    projects: z.array(slug).min(1),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT}/notes` }),
  schema: z.object({
    title: z.string(),
    updatedAt: z.coerce.date().optional(),
  }),
});

const areas = defineCollection({
  loader: file(`${CONTENT}/site/areas.json`),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number().int(),
    projects: z.array(slug).min(1),
  }),
});

// Text alternative and storyboard for each pre-rendered Remotion composition.
const motionFigures = defineCollection({
  loader: file(`${CONTENT}/site/motion.json`),
  schema: z.object({
    title: z.string(),
    takeaway: z.string(),
    steps: z.array(z.string()).min(2),
  }),
});

export const collections = { projects, writing, experience, notes, areas, motion: motionFigures };
