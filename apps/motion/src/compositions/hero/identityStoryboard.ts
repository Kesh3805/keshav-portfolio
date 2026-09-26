// PersonalHero storyboard: every event sits on a beat of a 120 BPM grid (a beat is half a
// second, 30 frames at 60 fps), so the rhythm is authored once here rather than tuned in
// JSX. See STORYBOARDS.md → PersonalHero for the scene table and the design notes.
import { Easing } from 'remotion';

export const BPM = 120;
export const FPS = 60;
export const BEAT = (FPS * 60) / BPM; // 30 frames
/** Frames at a (fractional) beat. */
export const beat = (n: number) => Math.round(n * BEAT);

export const HERO_BEATS = 19;
export const PERSONAL_HERO_FRAMES = beat(HERO_BEATS); // 9.5 s

export type Transition =
  'morph' | 'signal-transfer' | 'hold' | 'hard-cut' | 'match' | 'retract' | 'handoff';

export interface Scene {
  id: 'mark' | 'form' | 'system' | 'identity' | 'role' | 'thesis' | 'resolve';
  /** Frame notation shown bottom-left while the scene runs. */
  label: string;
  from: number;
  to: number;
  camera: 'pull-back' | 'still' | 'push' | 'cut';
  transition: Transition;
}

export const SCENES: Scene[] = [
  { id: 'mark', label: '00 — MARK', from: 0, to: 3.25, camera: 'pull-back', transition: 'morph' },
  {
    id: 'form',
    label: '01 — FORM',
    from: 3.25,
    to: 5.25,
    camera: 'still',
    transition: 'signal-transfer',
  },
  { id: 'system', label: '02 — SYSTEM', from: 5.25, to: 8.5, camera: 'push', transition: 'hold' },
  {
    id: 'identity',
    label: '03 — IDENTITY',
    from: 8.5,
    to: 11.5,
    camera: 'cut',
    transition: 'match',
  },
  {
    id: 'role',
    label: '04 — ROLE',
    from: 11.5,
    to: 13.25,
    camera: 'still',
    transition: 'signal-transfer',
  },
  {
    id: 'thesis',
    label: '05 — THESIS',
    from: 13.25,
    to: 16.5,
    camera: 'still',
    transition: 'retract',
  },
  {
    id: 'resolve',
    label: '06 — REST',
    from: 16.5,
    to: HERO_BEATS,
    camera: 'still',
    transition: 'handoff',
  },
];

/** Beats of the individual events (in beats; convert with `beat()`). */
export const CUES = {
  chromeIn: 0.25,
  /** Cold open: a hairline diamond fills the frame; the camera pulls back from MACRO to 1. */
  hubIn: 0.25,
  pullBack: [0.25, 2.25] as const,
  /** The K's edges draw out of the hub, endpoints pop as each edge arrives. */
  edges: [1.6, 2.35] as const,
  markNote: 2.5,
  /** The K falls over: its stem becomes the ruler, the hub drops to the start as the signal. */
  collapse: [3.25, 4.75] as const,
  minorTicks: [4.5, 5.5] as const,
  travel: [5.25, 8] as const,
  guides: [5.5, 6.75] as const,
  hold: [8, 8.5] as const, // the held beat before the hit: nothing moves
  hit: 8.5, // stems open into letters; camera cuts back
  contract: 9.25, // wide tracking collapses (landscape) / letters rise (portrait)
  rest: 9.5, // the signal glides into the hollow target at the end of the rule
  roleType: [11.5, 12.7] as const,
  /** The caret leads the thesis; each word rises out of a mask as the caret passes it. */
  thesis: [13.25, 16] as const,
  caretOut: 16,
  chromeOut: [16.5, 17.25] as const,
} as const;

/** Camera: macro scale at the cold open, and the push-in reached just before the hit. */
export const MACRO = 18;
export const PUSH = 1.04;

/** Where the K mark sits for the cold open, per layout width (centre in px, px per grid unit). */
export const MARK_PLACE = {
  1920: { x: 960, y: 470, s: 17 },
  1080: { x: 540, y: 560, s: 14 },
} as const;

/** Motion families (see the storyboard): each kind of thing moves in its own way. */
export const ease = {
  /** Structure: slow, controlled. */
  structural: Easing.bezier(0.65, 0, 0.35, 1),
  /** Typography: sharp, editorial arrival. */
  type: Easing.bezier(0.16, 1, 0.3, 1),
  /** Data: constant speed. */
  data: Easing.linear,
  /** Small objects arriving: slight overshoot. */
  pop: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** Camera pull-back: fast departure, long settle. */
  camera: Easing.bezier(0.7, 0, 0.2, 1),
} as const;

/** Spring for the identity moment: physical, one small overshoot. */
export const identitySpring = { damping: 16, stiffness: 120, mass: 0.9 } as const;

export const sceneAt = (frame: number) =>
  SCENES.find((s) => frame >= beat(s.from) && frame < beat(s.to)) ?? SCENES[SCENES.length - 1]!;
