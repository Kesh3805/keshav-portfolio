import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import taxonomy from '../../../content/taxonomy.json';

// These checks run on the raw files so they catch problems the zod schemas
// can't see on their own: cross-collection references, slugs vs filenames,
// orphans, and links written inside Markdown bodies.
const CONTENT = resolve(__dirname, '../../../content');

interface Doc {
  file: string;
  data: Record<string, unknown>;
  body: string;
}

const load = (dir: string): Doc[] =>
  readdirSync(resolve(CONTENT, dir))
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const parsed = matter(readFileSync(resolve(CONTENT, dir, f), 'utf8'));
      return { file: f, data: parsed.data, body: parsed.content };
    });

const json = <T>(file: string): T => JSON.parse(readFileSync(resolve(CONTENT, file), 'utf8')) as T;

const projects = load('projects');
const writing = load('writing');
const experience = load('experience');
const areas = json<{ id: string; projects: string[] }[]>('site/areas.json');
const motion = json<{ id: string; steps: string[] }[]>('site/motion.json');

const projectSlugs = new Set(projects.map((p) => p.data.slug as string));
const writingSlugs = new Set(writing.map((w) => w.data.slug as string));
const published = writing.filter((w) => !w.data.draft);

describe('projects', () => {
  it('has the launch set, split by category', () => {
    const byCategory = (c: string) =>
      projects
        .filter((p) => p.data.category === c)
        .map((p) => p.data.slug)
        .sort();
    expect(byCategory('professional')).toEqual(['fintax', 'groupkart', 'pax-ai', 'questqr']);
    expect(byCategory('personal')).toEqual([
      'acfs',
      'antigravity-pr-reviewer',
      'bara',
      'dhvvs',
      'sonicmirror',
    ]);
  });

  it.each(projects.map((p) => [p.file, p] as const))('%s has required metadata', (_, p) => {
    expect(p.data.title, 'title').toBeTypeOf('string');
    expect(String(p.data.description).length, 'description').toBeGreaterThanOrEqual(20);
    expect(['professional', 'personal']).toContain(p.data.category);
    expect(p.data.slug).toBe(basename(p.file, extname(p.file)));
  });

  it('uses only registered technologies and tags', () => {
    for (const p of projects) {
      for (const tech of p.data.technologies as string[]) {
        expect(taxonomy.technologies, `${p.file}: ${tech}`).toContain(tech);
      }
      for (const tag of (p.data.tags as string[] | undefined) ?? []) {
        expect(taxonomy.tags, `${p.file}: ${tag}`).toContain(tag);
      }
    }
  });

  it('has no duplicate slugs', () => {
    expect(projectSlugs.size).toBe(projects.length);
  });

  it('points motion figures at storyboards that exist', () => {
    const ids = new Set(motion.map((m) => m.id));
    for (const p of projects.filter((p) => p.data.motion)) {
      expect(ids, `${p.file}: ${String(p.data.motion)}`).toContain(p.data.motion);
    }
    for (const id of ids) expect(taxonomy.motion).toContain(id);
  });

  it('keeps personal repositories on the documented GitHub account', () => {
    for (const p of projects.filter((p) => p.data.repository)) {
      expect(p.data.repository).toMatch(/^https:\/\/github\.com\/Kesh3805\/[\w.-]+$/);
    }
  });
});

describe('writing', () => {
  it('has no duplicate slugs and slugs match filenames', () => {
    expect(writingSlugs.size).toBe(writing.length);
    for (const w of writing) expect(w.data.slug).toBe(basename(w.file, extname(w.file)));
  });

  it.each(published.map((w) => [w.file, w] as const))('%s is linked to a real project', (_, w) => {
    const related = w.data.relatedProjects as string[] | undefined;
    expect(related?.length, 'orphaned article: relatedProjects is empty').toBeGreaterThan(0);
    for (const slug of related ?? []) expect(projectSlugs).toContain(slug);
  });

  it.each(writing.map((w) => [w.file, w] as const))(
    '%s has a date, description and tags',
    (_, w) => {
      expect(new Date(w.data.publishedAt as string).toString()).not.toBe('Invalid Date');
      expect(String(w.data.description).length).toBeGreaterThanOrEqual(20);
      for (const tag of w.data.tags as string[]) expect(taxonomy.tags).toContain(tag);
    },
  );
});

describe('cross references', () => {
  it('experience lists existing projects', () => {
    for (const e of experience) {
      for (const slug of e.data.projects as string[]) expect(projectSlugs, e.file).toContain(slug);
    }
  });

  it('homepage areas reference existing projects', () => {
    for (const area of areas) {
      for (const slug of area.projects) expect(projectSlugs, area.id).toContain(slug);
    }
  });

  it('internal links inside Markdown bodies resolve', () => {
    const staticRoutes = new Set([
      '/',
      '/work',
      '/projects',
      '/writing',
      '/about',
      '/now',
      '/search',
    ]);
    const docs = [...projects, ...writing, ...load('notes')];
    for (const doc of docs) {
      for (const [, target] of doc.body.matchAll(/\]\((\/[^)\s#]*)/g)) {
        const path = target!.replace(/\/$/, '') || '/';
        const [, section, slug] = path.split('/');
        const ok =
          staticRoutes.has(path) ||
          (section === 'projects' && projectSlugs.has(slug!)) ||
          (section === 'writing' && writingSlugs.has(slug!));
        expect(ok, `${doc.file} links to missing route ${target}`).toBe(true);
      }
    }
  });
});
