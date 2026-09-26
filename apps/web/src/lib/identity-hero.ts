// The homepage identity hero: one layout, read by the Remotion composition that renders
// the sequence (apps/motion/src/compositions/PersonalHero.tsx) and by the homepage, which
// draws the same final frame as live SVG/HTML. Because both read these numbers, the
// video's last frame and the page it hands off to line up exactly.
//
// Coordinates are in the composition's own pixels (1920×1080 landscape, 1080×1350
// portrait). No imports, so the motion package can load it.

export const IDENTITY_COPY = {
  name: 'KESHAV',
  role: 'SYSTEMS ENGINEER',
  /** The site headline (site.config.ts), split for the two layouts; the first run is emphasised. */
  lead: 'I build systems',
} as const;

/** Plex Mono: every glyph advances 0.6em; caps are 0.698em tall. */
export const MONO_ADVANCE = 0.6;
export const MONO_CAP = 0.698;

export interface IdentityLayout {
  width: number;
  height: number;
  /** Left margin: the name, rule, role and thesis all start here. */
  left: number;
  /** Right end of the rule, where the signal comes to rest. */
  right: number;
  name: {
    size: number;
    baseline: number;
    /** Final tracking, in em. */
    tracking: number;
    /** Tracking while the letters are still columns on the ruler (landscape spreads them). */
    wideTracking: number;
  };
  rule: { y: number };
  role: { size: number; baseline: number; tracking: number };
  thesis: { size: number; lineHeight: number; baseline: number; lines: string[] };
  /** Top of the call-to-action row, for the HTML buttons. */
  ctaTop: number;
  /** Frame notation along the bottom edge. */
  chrome: { inset: number; size: number };
}

export const LANDSCAPE: IdentityLayout = {
  width: 1920,
  height: 1080,
  left: 160,
  right: 1760,
  name: { size: 300, baseline: 560, tracking: 0.04, wideTracking: 0.34 },
  rule: { y: 600 },
  role: { size: 24, baseline: 660, tracking: 0.3 },
  thesis: {
    size: 42,
    lineHeight: 54,
    baseline: 764,
    lines: ['I build systems and investigate', 'the engineering problems underneath them.'],
  },
  ctaTop: 846,
  chrome: { inset: 48, size: 16 },
};

export const PORTRAIT: IdentityLayout = {
  width: 1080,
  height: 1350,
  left: 80,
  right: 1000,
  name: { size: 236, baseline: 560, tracking: 0.06, wideTracking: 0.06 },
  rule: { y: 600 },
  role: { size: 30, baseline: 668, tracking: 0.3 },
  thesis: {
    size: 54,
    lineHeight: 66,
    baseline: 790,
    lines: ['I build systems and', 'investigate the engineering', 'problems underneath them.'],
  },
  ctaTop: 1000,
  chrome: { inset: 40, size: 22 },
};

/** Left edge of letter `i` of the name at a given tracking (em). */
export const letterX = (l: IdentityLayout, i: number, tracking = l.name.tracking) =>
  l.left + i * (MONO_ADVANCE + tracking) * l.name.size;

/** x of each glyph's stem: Plex Mono caps sit ~0.09em inside their cell. */
export const stemX = (l: IdentityLayout, i: number, tracking = l.name.tracking) =>
  letterX(l, i, tracking) + 0.09 * l.name.size;

/** Width of one glyph cell of the name. */
export const cellWidth = (l: IdentityLayout) => MONO_ADVANCE * l.name.size;
