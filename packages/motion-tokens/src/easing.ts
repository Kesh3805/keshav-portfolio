/** Cubic-bezier control points; consumed by Remotion's Easing.bezier and CSS. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
  travel: [0.45, 0, 0.55, 1],
  snap: [0.16, 1, 0.3, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Remotion spring config for nodes appearing; critically damped, no bounce. */
export const nodeSpring = { damping: 200, stiffness: 120, mass: 1 } as const;

/** Under-damped spring for chips and counters: 0.8 → ~1.05 → 1. */
export const popSpring = { damping: 11, stiffness: 170, mass: 0.6 } as const;
