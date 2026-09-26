import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { href } from './paths';

// Media is produced by `pnpm motion:render` into the repo-level public/generated:
// `<name>.*` for the dark theme and `<name>-light.*` for the light theme.
// Anything missing resolves to undefined so a fresh clone builds without broken references.
const repoGenerated = fileURLToPath(new URL('../../../../public/generated', import.meta.url));
const generated = existsSync(repoGenerated)
  ? repoGenerated
  : resolve(process.cwd(), '../../public/generated');

export type MotionTheme = 'dark' | 'light';

export interface MotionVariant {
  theme: MotionTheme;
  webm?: string;
  mp4?: string;
  poster?: string;
}

function variant(name: string, theme: MotionTheme): MotionVariant {
  const base = theme === 'dark' ? name : `${name}-light`;
  const find = (ext: string) =>
    existsSync(resolve(generated, `${base}.${ext}`))
      ? href(`/generated/${base}.${ext}`)
      : undefined;
  return { theme, webm: find('webm'), mp4: find('mp4'), poster: find('jpg') };
}

/** Rendered variants that exist, dark first. */
export function motionMedia(name: string): MotionVariant[] {
  return (['dark', 'light'] as const)
    .map((theme) => variant(name, theme))
    .filter((v) => v.webm || v.mp4 || v.poster);
}
