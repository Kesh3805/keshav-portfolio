import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type Article = CollectionEntry<'writing'>;
export type Experience = CollectionEntry<'experience'>;

const byOrder = (a: Project, b: Project) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export async function getProjects(category?: Project['data']['category']) {
  const projects = await getCollection('projects');
  assertUniqueSlugs(
    projects.map((p) => p.data.slug),
    'projects',
  );
  return projects.filter((p) => !category || p.data.category === category).sort(byOrder);
}

export async function getArticles() {
  const articles = await getCollection(
    'writing',
    (entry) => import.meta.env.DEV || !entry.data.draft,
  );
  assertUniqueSlugs(
    articles.map((a) => a.data.slug),
    'writing',
  );
  await assertReferences(
    articles.flatMap((a) => a.data.relatedProjects.map((slug) => [a.id, slug] as const)),
  );
  return articles.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getExperience() {
  const entries = await getCollection('experience');
  await assertReferences(
    entries.flatMap((e) => e.data.projects.map((slug) => [e.id, slug] as const)),
  );
  return entries;
}

export async function getProjectsBySlug(slugs: readonly string[]) {
  const projects = await getProjects();
  return slugs.map((slug) => {
    const project = projects.find((p) => p.data.slug === slug);
    if (!project) throw new Error(`Unknown project slug "${slug}"`);
    return project;
  });
}

export async function getArticlesForProject(slug: string) {
  return (await getArticles()).filter((a) => a.data.relatedProjects.includes(slug));
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const tagSlug = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function assertUniqueSlugs(slugs: string[], collection: string) {
  const seen = new Set<string>();
  for (const slug of slugs) {
    if (seen.has(slug)) throw new Error(`Duplicate slug "${slug}" in ${collection}`);
    seen.add(slug);
  }
}

// Broken cross-references must fail the build rather than render a dead link.
async function assertReferences(refs: (readonly [string, string])[]) {
  const known = new Set((await getCollection('projects')).map((p) => p.data.slug));
  const missing = refs.filter(([, slug]) => !known.has(slug));
  if (missing.length) {
    throw new Error(
      `Missing project references: ${missing.map(([from, slug]) => `${from} -> ${slug}`).join(', ')}`,
    );
  }
}
