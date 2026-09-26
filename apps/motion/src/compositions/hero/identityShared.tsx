// Shared state for the PersonalHero scenes: the layout (landscape or portrait), the
// signal's position over time, and small helpers. Everything is a pure function of the
// frame, so any frame can be rendered on its own.
import { createContext, useContext } from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import {
  LANDSCAPE,
  cellWidth,
  letterX,
  stemX,
  type IdentityLayout,
} from '../../../../web/src/lib/identity-hero';
import { CUES, FPS, beat, ease, identitySpring } from './identityStoryboard';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const LayoutContext = createContext<IdentityLayout>(LANDSCAPE);
export const useLayout = () => useContext(LayoutContext);

/** 0 → 1 between two beats, with one of the storyboard's motion families. */
export function between(frame: number, from: number, to: number, easing = ease.data) {
  return interpolate(frame, [beat(from), beat(to)], [0, 1], { ...clamp, easing });
}

/** 0 → 1 over `frames` frames starting at frame `at`. */
export function over(frame: number, at: number, frames: number, easing = ease.type) {
  return interpolate(frame, [at, at + frames], [0, 1], { ...clamp, easing });
}

const wide = (l: IdentityLayout) => l.name.wideTracking;

/** Where the signal's travel ends: the right edge of the last column at wide spacing. */
export const travelEnd = (l: IdentityLayout) => letterX(l, 5, wide(l)) + cellWidth(l);

/** The contraction from wide to final tracking: a physical spring (landscape only). */
export function contraction(frame: number) {
  return spring({ frame: frame - beat(CUES.contract), fps: FPS, config: identitySpring });
}

/** Tracking of the name at a frame, in em. */
export function trackingAt(l: IdentityLayout, frame: number) {
  return interpolate(contraction(frame), [0, 1], [wide(l), l.name.tracking]);
}

/** The signal's x along the rule. */
export function signalX(l: IdentityLayout, frame: number) {
  const [t0, t1] = CUES.travel;
  if (frame < beat(t0)) return l.left;
  if (frame < beat(CUES.rest)) {
    return interpolate(frame, [beat(t0), beat(t1)], [l.left, travelEnd(l)], clamp);
  }
  // After the hit it glides to the end of the rule and rests there.
  return interpolate(
    between(frame, CUES.rest, CUES.rest + 0.75, ease.type),
    [0, 1],
    [travelEnd(l), l.right],
  );
}

/** Frame at which the travelling signal passes column `i`'s stem. */
export function passFrame(l: IdentityLayout, i: number) {
  const [t0, t1] = CUES.travel;
  const x = stemX(l, i, wide(l));
  return beat(t0) + ((x - l.left) / (travelEnd(l) - l.left)) * (beat(t1) - beat(t0));
}

export const useFrame = () => useCurrentFrame();

/** Diamond points, the shape shared with the topology plinths and the K mark. */
export const diamond = (x: number, y: number, w: number, h = w) =>
  `${x},${y - h} ${x + w},${y} ${x},${y + h} ${x - w},${y}`;

/** Measure a line of Plex text once; fonts are loaded before any frame renders (fonts.ts). */
const widths = new Map<string, number>();
export function textWidth(text: string, font: string, letterSpacing = 0) {
  const key = `${font}|${letterSpacing}|${text}`;
  const hit = widths.get(key);
  if (hit !== undefined) return hit;
  const ctx = document.createElement('canvas').getContext('2d')!;
  ctx.font = font;
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
    `${letterSpacing}px`;
  const w = ctx.measureText(text).width;
  widths.set(key, w);
  return w;
}
