#!/usr/bin/env node
// Review helper: renders a few frames of each composition to apps/motion/out.
//   node scripts/stills.mjs GstReturnsArchitecture 120 250 470 [--theme=light]
import { resolve } from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';

const theme = process.argv.find((a) => a.startsWith('--theme='))?.split('=')[1] ?? 'dark';
const [id, ...frames] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!id || !frames.length) {
  console.error('usage: node scripts/stills.mjs <CompositionId> <frame> [frame…]');
  process.exit(1);
}

const serveUrl = await bundle({ entryPoint: resolve(import.meta.dirname, '../src/index.ts') });
const inputProps = { theme };
const composition = await selectComposition({ serveUrl, id, inputProps });
for (const frame of frames.map(Number)) {
  const output = resolve(import.meta.dirname, `../out/${id}-${theme}-${frame}.jpg`);
  await renderStill({
    serveUrl,
    composition,
    inputProps,
    frame,
    output,
    imageFormat: 'jpeg',
    jpegQuality: 80,
  });
  console.log(output);
}
