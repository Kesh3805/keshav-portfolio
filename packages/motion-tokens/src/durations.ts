/** Output frame rate. */
export const fps = 60;

/**
 * Compositions are authored on a story clock: 30 story-frames per second over a
 * 16 s script. Rendering maps that script onto `targetSeconds` at `fps`, so every
 * beat keeps its relative timing and gains sub-frame smoothness at 60 fps.
 */
export const story = {
  fps: 30,
  seconds: 16,
  targetSeconds: 12,
} as const;

/** Real frames per story frame (1.5 at 60 fps compressing 16 s into 12 s). */
export const storyScale = (fps / story.fps) * (story.targetSeconds / story.seconds);

/** Real output frames for a composition authored with `storyFrames` story frames. */
export const outputFrames = (storyFrames: number) => Math.round(storyFrames * storyScale);

/** Durations in story frames. */
export const durations = {
  nodeEnter: 14,
  edgeDraw: 16,
  packetTravel: 24,
  captionFade: 10,
  ripple: 22,
  dissolve: 34,
  hold: 30,
  beat: 90,
} as const;

export const seconds = (s: number) => Math.round(s * story.fps);
