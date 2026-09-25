import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ProjectCard from '../src/components/ProjectCard.astro';
import SiteHeader from '../src/components/SiteHeader.astro';
import type { Project } from '../src/lib/content';

const project = {
  id: 'example',
  collection: 'projects',
  data: {
    title: 'Example',
    slug: 'example',
    category: 'personal',
    description: 'A project used only by this test to exercise card rendering.',
    technologies: ['Rust', 'TypeScript', 'Redis', 'Docker', 'PostgreSQL', 'NestJS'],
    featured: false,
    order: 1,
    tags: [],
    metrics: [],
  },
} as unknown as Project;

describe('ProjectCard', () => {
  it('renders the category label, a single link and a truncated stack', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectCard, { props: { project } });

    expect(html).toContain('Personal / Open Source');
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toMatch(/href="[^"]*\/projects\/example\/"/);
    expect(html).toContain('+1');
  });
});

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

describe('SiteHeader', () => {
  it('renders primary navigation and marks the current section', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteHeader, {
      request: new Request(`https://example.com${base}/projects/fintax/`),
    });

    for (const label of ['Work', 'Projects', 'Writing', 'About', 'GitHub']) {
      expect(html).toMatch(new RegExp(`>\\s*${label}\\b`));
    }
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*>\s*Projects\s*<\/a>/);
    expect(html).toContain('aria-controls="mobile-menu"');
    expect(html).toContain('Skip to content');
  });
});
