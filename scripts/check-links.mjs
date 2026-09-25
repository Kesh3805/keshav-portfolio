#!/usr/bin/env node
// Post-build validation of apps/web/dist.
//
//   node scripts/check-links.mjs              internal links, assets, anchors, required routes
//   node scripts/check-links.mjs --external   also probe external URLs (reported, never fatal)
//
// Internal problems fail the run. External URLs only warn, so a flaky remote
// service can't block a deploy or local development.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'apps/web/dist');
const base = (process.env.BASE_PATH ?? '/keshav-portfolio').replace(/\/+$/, '');
const site = (process.env.SITE_URL ?? 'https://kesh3805.github.io').replace(/\/+$/, '');
const checkExternal = process.argv.includes('--external');

const REQUIRED = [
  '/',
  '/work/',
  '/projects/',
  '/projects/fintax/',
  '/projects/bara/',
  '/writing/',
  '/about/',
  '/now/',
  '/rss.xml',
  '/sitemap-index.xml',
  '/robots.txt',
  '/search.json',
  '/404.html',
];

if (!existsSync(dist)) {
  console.error(`No build output at ${relative(root, dist)}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));

/** Map a site URL path (without base) to a file in dist, or null. */
function resolveTarget(pathname) {
  const clean = decodeURIComponent(pathname);
  const candidates = clean.endsWith('/')
    ? [join(dist, clean, 'index.html')]
    : [join(dist, clean), join(dist, clean, 'index.html'), join(dist, `${clean}.html`)];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const idsCache = new Map();
function idsIn(file) {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

const errors = [];
const external = new Set();
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const from = `/${relative(dist, file).replaceAll('\\', '/')}`;

  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  if (canonical && !canonical.startsWith(`${site}${base}/`)) {
    errors.push(`${from}: canonical ${canonical} is outside ${site}${base}/`);
  }

  for (const [, attr, raw] of html.matchAll(/\s(href|src|poster|content)="([^"]*)"/g)) {
    const url = raw.replaceAll('&amp;', '&');
    if (attr === 'content' && !url.startsWith(site)) continue;
    if (!url || url.startsWith('mailto:') || url.startsWith('data:') || url.startsWith('tel:'))
      continue;

    if (/^https?:\/\//.test(url)) {
      if (!url.startsWith(site)) {
        external.add(url);
        continue;
      }
    }

    const target = new URL(url, `${site}${base}${from}`);
    if (target.origin !== new URL(site).origin) continue;
    checked++;

    if (!target.pathname.startsWith(`${base}/`) && target.pathname !== base) {
      errors.push(`${from}: ${url} is missing the base path ${base}`);
      continue;
    }
    const path = target.pathname.slice(base.length) || '/';
    const resolved = resolveTarget(path);
    if (!resolved) {
      errors.push(`${from}: broken link ${url}`);
      continue;
    }
    if (target.hash && resolved.endsWith('.html')) {
      const id = decodeURIComponent(target.hash.slice(1));
      if (id && !idsIn(resolved).has(id)) errors.push(`${from}: missing anchor ${url}`);
    }
  }
}

for (const route of REQUIRED) {
  if (!resolveTarget(route)) errors.push(`required route missing: ${route}`);
}

const rss = resolveTarget('/rss.xml');
if (rss && !/<item>/.test(readFileSync(rss, 'utf8'))) errors.push('rss.xml has no items');

const sitemapFiles = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
for (const file of sitemapFiles) {
  for (const [, loc] of readFileSync(file, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(loc).pathname.slice(base.length) || '/';
    if (!resolveTarget(path)) errors.push(`sitemap lists missing page ${loc}`);
    if (/\/(404|search)\/?$/.test(path)) errors.push(`sitemap should not list ${loc}`);
  }
}

console.log(
  `Checked ${checked} internal references across ${htmlFiles.length} pages; ${external.size} external URLs.`,
);

if (checkExternal) {
  const results = await Promise.allSettled(
    [...external].map(async (url) => {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status >= 400 && res.status !== 405 && res.status !== 429)
        throw new Error(`${res.status}`);
    }),
  );
  [...external].forEach((url, i) => {
    const r = results[i];
    if (r.status === 'rejected')
      console.warn(`warn: external ${url} → ${r.reason?.message ?? r.reason}`);
  });
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('All internal links, anchors and required routes resolve.');
