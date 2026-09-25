export const fps = 30;

/** Durations in frames at `fps`. */
export const durations = {
  nodeEnter: 14,
  edgeDraw: 16,
  packetTravel: 24,
  captionFade: 10,
  hold: 30,
  beat: 90,
} as const;

export const seconds = (s: number) => Math.round(s * fps);
