import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { colors } from '@keshav/motion-tokens';
import { Resvg } from '@resvg/resvg-js';
import type { APIContext, GetStaticPaths } from 'astro';
import satori from 'satori';
import { getArticles, getProjects } from '../../lib/content';
import { site } from '../../site.config';

interface Card {
  kicker: string;
  title: string;
  description: string;
  chips: string[];
}

export const getStaticPaths = (async () => {
  const [projects, articles] = await Promise.all([getProjects(), getArticles()]);
  return [
    {
      params: { slug: 'default' },
      props: {
        kicker: 'Engineering portfolio',
        title: site.headline,
        description: site.description,
        chips: ['Backend', 'Distributed Systems', 'AI Infrastructure'],
      },
    },
    ...projects.map((p) => ({
      params: { slug: `projects/${p.data.slug}` },
      props: {
        kicker:
          p.data.category === 'professional' ? 'Professional project' : 'Personal / Open Source',
        title: p.data.title,
        description: p.data.description,
        chips: p.data.technologies.slice(0, 4),
      },
    })),
    ...articles.map((a) => ({
      params: { slug: `writing/${a.data.slug}` },
      props: {
        kicker: 'Writing',
        title: a.data.title,
        description: a.data.description,
        chips: a.data.tags.slice(0, 4),
      },
    })),
  ];
}) satisfies GetStaticPaths;

const require = createRequire(import.meta.url);
const font = (file: string) =>
  readFile(require.resolve(`@fontsource/${file}`)).then(
    (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer,
  );

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    font('ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff'),
    font('ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff'),
    font('ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff'),
  ]).then(([regular, semibold, mono]) => [
    { name: 'Plex Sans', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Plex Sans', data: semibold, weight: 600 as const, style: 'normal' as const },
    { name: 'Plex Mono', data: mono, weight: 400 as const, style: 'normal' as const },
  ]));

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

function template({ kicker, title, description, chips }: Card): Node {
  const grid = `linear-gradient(${colors.line}55 1px, transparent 1px), linear-gradient(90deg, ${colors.line}55 1px, transparent 1px)`;
  return h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      background: colors.bg,
      backgroundImage: grid,
      backgroundSize: '40px 40px',
      color: colors.text,
      fontFamily: 'Plex Sans',
    },
    [
      h(
        'div',
        { display: 'flex', justifyContent: 'space-between', fontFamily: 'Plex Mono', fontSize: 22 },
        [
          h('div', { display: 'flex', color: colors.accent }, `k/ ${site.name}`),
          h(
            'div',
            { display: 'flex', color: colors.muted, textTransform: 'uppercase', letterSpacing: 2 },
            kicker,
          ),
        ],
      ),
      h('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
        h(
          'div',
          {
            display: 'flex',
            fontSize: title.length > 48 ? 58 : 72,
            fontWeight: 600,
            lineHeight: 1.06,
            letterSpacing: -2,
          },
          title,
        ),
        h(
          'div',
          { display: 'flex', fontSize: 28, lineHeight: 1.4, color: colors.muted, maxWidth: 960 },
          description,
        ),
      ]),
      h(
        'div',
        { display: 'flex', gap: 12, fontFamily: 'Plex Mono', fontSize: 20 },
        chips.map((chip) =>
          h(
            'div',
            {
              display: 'flex',
              padding: '8px 14px',
              border: `1px solid ${colors.lineStrong}`,
              borderRadius: 4,
              color: colors.muted,
            },
            chip,
          ),
        ),
      ),
    ],
  );
}

export async function GET({ props }: APIContext<Card>) {
  const svg = await satori(template(props) as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: await loadFonts(),
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
