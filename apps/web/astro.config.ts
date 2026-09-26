import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { transformerMetaHighlight } from '@shikijs/transformers';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { rehypeBaseLinks } from './src/lib/markdown/rehype-base-links';
import { remarkMermaid } from './src/lib/markdown/remark-mermaid';
import { transformerCodeFrame } from './src/lib/markdown/shiki-code-frame';

// The deploy workflow supplies these from actions/configure-pages so the same
// build works for a project page, a user page, or a custom domain.
const site = process.env.SITE_URL || 'https://amkeshav.me';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  publicDir: '../../public',
  trailingSlash: 'ignore',
  // HTML whitespace rules, not JSX: Prettier wraps inline links across lines.
  compressHTML: true,
  build: { format: 'directory' },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMermaid],
      rehypePlugins: [[rehypeBaseLinks, { base }]],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'vitesse-dark' },
      defaultColor: false,
      transformers: [transformerMetaHighlight(), transformerCodeFrame()],
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !/\/(404|search)\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['mermaid'],
    },
    // Mermaid is one large chunk, but it is only fetched on pages that contain a diagram.
    build: { chunkSizeWarningLimit: 1200 },
  },
});
