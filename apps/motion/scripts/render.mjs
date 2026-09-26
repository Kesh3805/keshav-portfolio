#!/usr/bin/env node
// Renders every composition to public/generated as WebM (VP9), MP4 (H.264) and a
// JPEG poster. Bundles once, then renders sequentially to keep memory flat in CI.
//
//   pnpm motion:render                       all compositions
//   pnpm motion:render GstReturnsArchitecture    one composition
//   pnpm motion:render --poster-only         posters only (fast preview)
//   pnpm motion:render --theme=light          one theme only (default: both)
//
// Dark output is <name>.*, light output is <name>-light.*.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';

const here = import.meta.dirname;
const out = resolve(here, '../../../public/generated');
mkdirSync(out, { recursive: true });

const args = process.argv.slice(2);
const posterOnly = args.includes('--poster-only');
const only = args.filter((a) => !a.startsWith('--'));
const themeArg = args.find((a) => a.startsWith('--theme='))?.split('=')[1];
const THEMES = themeArg ? [themeArg] : ['dark', 'light'];
for (const theme of THEMES) {
  if (theme !== 'dark' && theme !== 'light') throw new Error(`Unknown theme ${theme}`);
}

// Composition id → output name. Names must match content/site/motion.json.
const OUTPUTS = {
  GstReturnsArchitecture: 'fintax-architecture',
  QrRedemptionFlow: 'questqr-scan-flow',
  BaraMemoryArchitecture: 'bara-memory-architecture',
  AntigravityReviewPipeline: 'antigravity-review-pipeline',
  AcfsForensicReport: 'acfs-forensic-report',
  DhvvsProofChain: 'dhvvs-proof-chain',
  SystemsHeroFilm: 'systems-hero-film',
};
const COMPOSITIONS = Object.keys(OUTPUTS);
const fileName = (id) => OUTPUTS[id];

const ids = only.length ? only : COMPOSITIONS;
for (const id of ids) {
  if (!COMPOSITIONS.includes(id)) throw new Error(`Unknown composition ${id}`);
}

console.log('Bundling…');
const serveUrl = await bundle({ entryPoint: resolve(here, '../src/index.ts') });

for (const id of ids) {
  for (const theme of THEMES) {
    const inputProps = { theme };
    const composition = await selectComposition({ serveUrl, id, inputProps });
    const name = theme === 'dark' ? fileName(id) : `${fileName(id)}-light`;
    const started = Date.now();

    // Poster: the settled final state, which carries the takeaway.
    await renderStill({
      serveUrl,
      composition,
      inputProps,
      timeoutInMilliseconds: 120_000,
      frame: composition.durationInFrames - 1,
      output: resolve(out, `${name}.jpg`),
      imageFormat: 'jpeg',
      jpegQuality: 82,
    });

    if (!posterOnly) {
      await renderMedia({
        serveUrl,
        composition,
        inputProps,
        timeoutInMilliseconds: 120_000,
        codec: 'vp9',
        crf: 36,
        outputLocation: resolve(out, `${name}.webm`),
        muted: true,
        imageFormat: 'jpeg',
      });
      await renderMedia({
        serveUrl,
        composition,
        inputProps,
        timeoutInMilliseconds: 120_000,
        codec: 'h264',
        crf: 26,
        pixelFormat: 'yuv420p',
        outputLocation: resolve(out, `${name}.mp4`),
        muted: true,
        imageFormat: 'jpeg',
        x264Preset: 'slow',
      });
    }
    console.log(`✓ ${name} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  }
}
