// PersonalHero storyboard: every event sits on a beat of a 120 BPM grid (a beat is half a
// second, 30 frames at 60 fps), so the rhythm is authored once here rather than tuned in
// JSX. See STORYBOARDS.md → PersonalHero for the scene table and the design notes.
import { Easing } from 'remotion';

export const BPM = 120;
export const FPS = 60;
export const BEAT = (FPS * 60) / BPM; // 30 frames
/** Frames at a (fractional) beat. */
export const beat = (n: number) => Math.round(n * BEAT);

export const HERO_BEATS = 16;
export const PERSONAL_HERO_FRAMES = beat(HERO_BEATS); // 8 s

export type Transition = 'signal-transfer' | 'hold' | 'hard-cut' | 'match' | 'retract' | 'handoff';

export interface Scene {
  id: 'intro' | 'system' | 'identity' | 'role' | 'thesis' | 'resolve';
  /** Frame notation shown bottom-left while the scene runs. */
  label: string;
  from: number;
  to: number;
  camera: 'still' | 'push' | 'cut';
  transition: Transition;
}

export const SCENES: Scene[] = [
  {
    id: 'intro',
    label: '00 — SIGNAL',
    from: 0,
    to: 3,
    camera: 'still',
    transition: 'signal-transfer',
  },
  { id: 'system', label: '01 — SYSTEM', from: 3, to: 6.5, camera: 'push', transition: 'hold' },
  { id: 'identity', label: '02 — IDENTITY', from: 6.5, to: 9, camera: 'cut', transition: 'match' },
  {
    id: 'role',
    label: '03 — ROLE',
    from: 9,
    to: 11,
    camera: 'still',
    transition: 'signal-transfer',
  },
  { id: 'thesis', label: '04 — THESIS', from: 11, to: 14, camera: 'still', transition: 'retract' },
  {
    id: 'resolve',
    label: '05 — REST',
    from: 14,
    to: HERO_BEATS,
    camera: 'still',
    transition: 'handoff',
  },
];

/** Beats of the individual events (in beats; convert with `beat()`). */
export const CUES = {
  chromeIn: 0.25,
  signalIn: 0.5,
  rulerDraw: [0.75, 3] as const,
  travel: [3, 6] as const,
  capNote: 4,
  hold: [6, 6.5] as const, // the held beat before the hit: nothing moves
  hit: 6.5, // stems open into letters; camera cuts back
  contract: 7.25, // wide tracking collapses (landscape)
  rest: 7.5, // the signal settles at the end of the rule as the accent node
  roleType: [9, 10.2] as const,
  /** The caret sweeps the thesis lines one after another inside this window. */
  thesis: [11, 13.75] as const,
  caretOut: 13.75,
  chromeOut: [14, 14.75] as const,
} as const;

/** Push-in scale reached just before the hit. */
export const PUSH = 1.04;

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
} as const;

/** Spring for the identity moment: physical, one small overshoot. */
export const identitySpring = { damping: 16, stiffness: 120, mass: 0.9 } as const;

export const sceneAt = (frame: number) =>
  SCENES.find((s) => frame >= beat(s.from) && frame < beat(s.to)) ?? SCENES[SCENES.length - 1]!;
