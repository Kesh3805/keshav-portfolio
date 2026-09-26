// Timing and world layout for SystemsHeroFilm.
//
// The film uses the same story clock as every other composition (see
// motion-tokens `storyScale`): 40 story frames per real second at 60 fps.
// 34 s = 1360 story frames = 2040 output frames.
//
// The four systems live on one plane ("world" space) and the camera moves
// between them, so acts connect as parts of one architecture rather than
// cutting like slides. Each act is authored in its own 1280×720 local frame.
import { storyScale } from '@keshav/motion-tokens';

/** Real seconds → story frames. */
export const sec = (s: number) => Math.round((s * 60) / storyScale);

export const ACTS = {
  concurrency: { start: sec(0), end: sec(7) },
  pipeline: { start: sec(7), end: sec(14) },
  reconciliation: { start: sec(14), end: sec(22) },
  review: { start: sec(22), end: sec(29) },
  convergence: { start: sec(29), end: sec(34) },
} as const;

export const FILM_STORY_FRAMES = ACTS.convergence.end;

export type ActId = keyof typeof ACTS;

/** Top-left of each act's local frame in world space. Act III is taller: it holds two views. */
export const WORLD = {
  concurrency: { x: 0, y: 0, w: 1280, h: 720 },
  pipeline: { x: 1480, y: 0, w: 1280, h: 720 },
  reconciliation: { x: 1480, y: 900, w: 1280, h: 1040 },
  review: { x: 0, y: 900, w: 1280, h: 720 },
} as const;

export const WORLD_BOUNDS = { x: 0, y: 0, w: 2760, h: 1940 };

/** Camera: world point at the centre of the screen, and zoom (1 = one act fills the view). */
export type CameraKey = [storyFrame: number, cx: number, cy: number, zoom: number];

const centre = (a: { x: number; y: number }, dy = 360) => [a.x + 640, a.y + dy] as const;
const PULLBACK_ZOOM = 0.28;

export const CAMERA: CameraKey[] = [
  [0, ...centre(WORLD.concurrency), 1],
  [ACTS.concurrency.end - 16, ...centre(WORLD.concurrency), 1],
  [ACTS.pipeline.start + 20, ...centre(WORLD.pipeline), 1],
  [ACTS.pipeline.end - 16, ...centre(WORLD.pipeline), 1],
  [ACTS.reconciliation.start + 20, ...centre(WORLD.reconciliation), 1],
  // Within Act III: from reconciliation down to the read model.
  [ACTS.reconciliation.start + 160, ...centre(WORLD.reconciliation), 1],
  [ACTS.reconciliation.start + 200, ...centre(WORLD.reconciliation, 800), 1],
  [ACTS.reconciliation.end - 16, ...centre(WORLD.reconciliation, 800), 1],
  [ACTS.review.start + 20, ...centre(WORLD.review), 1],
  [ACTS.review.end - 24, ...centre(WORLD.review), 1],
  // The one cinematic move: pull back until all four systems share the frame.
  [ACTS.convergence.start + 60, WORLD_BOUNDS.w / 2, WORLD_BOUNDS.h / 2 + 20, PULLBACK_ZOOM],
  [ACTS.convergence.end, WORLD_BOUNDS.w / 2, WORLD_BOUNDS.h / 2 + 20, PULLBACK_ZOOM],
];

/** Where a world point lands on screen for a given camera. */
export const toScreen = (p: { x: number; y: number }, cx: number, cy: number, zoom: number) => ({
  x: (p.x - cx) * zoom + 640,
  y: (p.y - cy) * zoom + 360,
});

/** Story frame at which act `i` (in film order) lights up during convergence: its panel and its topology nodes together. */
export const convergenceBeat = (i: number) => ACTS.convergence.start + 70 + i * 12;

/** Topology nodes each act's system becomes during convergence (ids from apps/web topology). */
export const CONVERGES_TO: Record<Exclude<ActId, 'convergence'>, string[]> = {
  concurrency: ['redis'],
  pipeline: ['bullmq', 'worker', 'ai'],
  reconciliation: ['postgres', 'api', 'sse'],
  review: ['memory', 'ai'],
};
