import { render } from 'astro:content';
import { getArticles, getProjects } from '../lib/content';
import { href } from '../lib/paths';

export interface SearchDoc {
  type: 'project' | 'writing';
  title: string;
  description: string;
  url: string;
  tags: string[];
  headings: string[];
  category?: string;
}

// Built once at build time; the search page fetches this file. No search service.
export async function GET() {
  const [projects, articles] = await Promise.all([getProjects(), getArticles()]);

  const docs: SearchDoc[] = [
    ...(await Promise.all(
      projects.map(async (p) => ({
        type: 'project' as const,
        title: p.data.title,
        description: p.data.description,
        url: href(`/projects/${p.data.slug}`),
        tags: [...p.data.tags, ...p.data.technologies],
        headings: (await render(p)).headings.filter((h) => h.depth <= 3).map((h) => h.text),
        category: p.data.category,
      })),
    )),
    ...(await Promise.all(
      articles.map(async (a) => ({
        type: 'writing' as const,
        title: a.data.title,
        description: a.data.description,
        url: href(`/writing/${a.data.slug}`),
        tags: a.data.tags,
        headings: (await render(a)).headings.filter((h) => h.depth <= 3).map((h) => h.text),
      })),
    )),
  ];

  return new Response(JSON.stringify(docs), {
    headers: { 'Content-Type': 'application/json' },
  });
}
