// Generates the static brand assets from src/lib/brand.ts (the one geometry source):
//   public/brand/*.svg|png  mark, wordmark and lockups, per background
//   public/favicon.svg      adapts to the colour scheme
//   public/favicon.ico      16/32/48, on the dark tile
//   public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png, public/site.webmanifest
// Run with `pnpm --filter @keshav/web brand`; the output is committed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { MARK, MARK_SMALL, markBounds, markElements, markSvg } from '../src/lib/brand.ts';
import { palettes } from '../../../packages/motion-tokens/src/colors.ts';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../../../public');
const out = resolve(pub, 'brand');
mkdirSync(out, { recursive: true });

const require = createRequire(import.meta.url);
const font = (file) => readFileSync(require.resolve(`@fontsource/${file}`));
const fonts = [
  {
    name: 'Plex Sans',
    data: font('ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff'),
    weight: 600,
  },
  {
    name: 'Plex Mono',
    data: font('ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'),
    weight: 500,
  },
];

const INK = '#010203'; // placeholder fill, swapped for the real colour per variant
const n = (v) => +v.toFixed(2);

/** The name as outlined paths (no font dependency in the assets), cropped to its ink. */
async function namePaths({ caps = false, size = 100 } = {}) {
  const text = caps ? 'KESHAV' : 'Keshav';
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          fontFamily: caps ? 'Plex Mono' : 'Plex Sans',
          fontWeight: caps ? 500 : 600,
          fontSize: size,
          letterSpacing: caps ? size * 0.14 : size * -0.01,
          color: INK,
          lineHeight: 1,
        },
        children: text,
      },
    },
    { width: size * 8, height: size * 2, fonts },
  );
  const box = new Resvg(svg).getBBox();
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return { inner, x: box.x, y: box.y, width: box.width, height: box.height };
}

const themes = {
  'on-dark': { fg: palettes.dark.text, accent: palettes.dark.accent, bg: palettes.dark.bg },
  'on-light': { fg: palettes.light.text, accent: palettes.light.accent, bg: palettes.light.bg },
};

/** The mark placed so its visible extent fills (x, y, height). */
function placedMark(x, y, height, colors, g = MARK) {
  const b = markBounds(g);
  const s = height / b.height;
  return `<g transform="translate(${n(x - b.x * s)} ${n(y - b.y * s)}) scale(${n(s)})">${markElements(g, colors)}</g>`;
}

const placedName = (name, x, y, color) =>
  `<g transform="translate(${n(x - name.x)} ${n(y - name.y)})">${name.inner.replaceAll(INK, color)}</g>`;

const doc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" width="${n(w)}" height="${n(h)}">${body}</svg>`;

function lockups(name, colors) {
  const { fg, accent } = colors;
  const ink = { color: fg, accent };
  // Horizontal: the mark's visible height is 1.35× the name's ink height; one-half cap gap.
  const hm = name.height * 1.35;
  const wm = (markBounds().width / markBounds().height) * hm;
  const gap = name.height * 0.55;
  const horizontal = doc(
    wm + gap + name.width,
    hm,
    placedMark(0, 0, hm, ink) + placedName(name, wm + gap, (hm - name.height) / 2, fg),
  );
  // Stacked: a larger mark centred over the name.
  const hs = name.height * 2.4;
  const ws = (markBounds().width / markBounds().height) * hs;
  const w = Math.max(ws, name.width);
  const sgap = name.height * 0.6;
  const stacked = doc(
    w,
    hs + sgap + name.height,
    placedMark((w - ws) / 2, 0, hs, ink) + placedName(name, (w - name.width) / 2, hs + sgap, fg),
  );
  const wordmark = doc(name.width, name.height, placedName(name, 0, 0, fg));
  return { horizontal, stacked, wordmark };
}

const write = (file, data) => {
  writeFileSync(resolve(out, file), data);
  return file;
};
const png = (svg, width) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

const written = [];
const name = await namePaths();
const caps = await namePaths({ caps: true });

// Marks: mono (currentColor, for inlining), per background, and pure black/white.
written.push(write('mark.svg', markSvg({ size: 32 })));
written.push(write('mark-small.svg', markSvg({ size: 16 })));
written.push(write('mark-mono-black.svg', markSvg({ color: '#000000' })));
written.push(write('mark-mono-white.svg', markSvg({ color: '#ffffff' })));
for (const [key, t] of Object.entries(themes)) {
  written.push(write(`mark-${key}.svg`, markSvg({ color: t.fg })));
  written.push(write(`mark-accent-${key}.svg`, markSvg({ color: t.fg, accent: t.accent })));
  written.push(
    write(
      `mark-accent-${key}-512.png`,
      png(markSvg({ size: 512, color: t.fg, accent: t.accent }), 512),
    ),
  );
  const l = lockups(name, t);
  const c = lockups(caps, t);
  written.push(write(`wordmark-${key}.svg`, l.wordmark));
  written.push(write(`wordmark-caps-${key}.svg`, c.wordmark));
  written.push(write(`logo-horizontal-${key}.svg`, l.horizontal));
  written.push(write(`logo-stacked-${key}.svg`, l.stacked));
  written.push(write(`logo-horizontal-${key}.png`, png(l.horizontal, 1200)));
}

// Favicon: the closed-gap geometry, recoloured by the browser's colour scheme.
const { dark, light } = palettes;
const favicon = markSvg({ size: 32, small: true, color: light.text, accent: light.accent })
  .replace(
    '<g ',
    `<style>@media (prefers-color-scheme: dark){g{stroke:${dark.text}}g+g{fill:${dark.text}}polygon[fill]{fill:${dark.accent}}}</style><g `,
  )
  .replace(/ width="32" height="32"/, '');
writeFileSync(resolve(pub, 'favicon.svg'), favicon);

// Raster icons sit on the dark tile so they read on any tab strip or home screen.
const tile = (size, { padding, radius }) =>
  png(
    markSvg({
      size,
      small: size <= 24,
      color: dark.text,
      accent: dark.accent,
      background: dark.bg,
      padding,
      radius,
    }),
    size,
  );
const icoSizes = [16, 32, 48];
const icoPngs = icoSizes.map((s) => tile(s, { padding: 1.5, radius: 0.2 }));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(icoPngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += icoPngs[i].length;
});
writeFileSync(resolve(pub, 'favicon.ico'), Buffer.concat([header, ...icoPngs]));
// iOS rounds the corners itself; manifest icons keep the mark inside the maskable safe zone.
writeFileSync(resolve(pub, 'apple-touch-icon.png'), tile(180, { padding: 6, radius: 0 }));
writeFileSync(resolve(pub, 'icon-192.png'), tile(192, { padding: 8, radius: 0 }));
writeFileSync(resolve(pub, 'icon-512.png'), tile(512, { padding: 8, radius: 0 }));
writeFileSync(
  resolve(pub, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Keshav',
      short_name: 'Keshav',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
      theme_color: dark.bg,
      background_color: dark.bg,
      display: 'browser',
    },
    null,
    2,
  ) + '\n',
);

// Unused-geometry guard: the small variant must be the same topology as the main mark.
if (MARK_SMALL.nodes !== MARK.nodes || MARK_SMALL.edges !== MARK.edges)
  throw new Error('MARK_SMALL drifted');

console.log(
  `brand: ${written.length} files in public/brand, plus favicon.svg/.ico, touch and manifest icons`,
);
