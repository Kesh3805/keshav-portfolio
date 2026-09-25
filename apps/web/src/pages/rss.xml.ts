import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getArticles } from '../lib/content';
import { href } from '../lib/paths';
import { site } from '../site.config';

export async function GET(context: APIContext) {
  const articles = await getArticles();
  return rss({
    title: `${site.name} — Writing`,
    description: site.description,
    site: new URL(href('/'), context.site).href,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishedAt,
      categories: article.data.tags,
      link: href(`/writing/${article.data.slug}`),
    })),
    customData: '<language>en</language>',
  });
}
