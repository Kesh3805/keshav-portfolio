import {
  canvas,
  durations,
  easing,
  nodeSpring,
  palettes,
  popSpring,
  spacing,
  storyScale,
  typography,
  type Palette,
  type Theme,
} from '@keshav/motion-tokens';
import { createContext, useContext, useId, type ComponentType, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type Pt = { x: number; y: number };
export type Tone = 'default' | 'accent' | 'data' | 'ok' | 'warning' | 'error' | 'dim';

// ─── Theme ────────────────────────────────────────────────────────────────

const PaletteContext = createContext<Palette>(palettes.dark);
const ThemeContext = createContext<Theme>('dark');

/** Palette for the theme being rendered; every colour in a composition comes from here. */
export const useColors = () => useContext(PaletteContext);

/** Glow reads as light on dark and as smudge on paper, so it is weaker in the light theme. */
export const useGlow = () => (useContext(ThemeContext) === 'dark' ? 1 : 0.45);

export type ThemeProps = { theme: Theme };

/** Wraps a composition so its `theme` input prop selects the palette. */
export function themed(Component: ComponentType) {
  return function Themed({ theme }: ThemeProps) {
    return (
      <ThemeContext.Provider value={theme}>
        <PaletteContext.Provider value={palettes[theme]}>
          <Component />
        </PaletteContext.Provider>
      </ThemeContext.Provider>
    );
  };
}

const toneColor = (colors: Palette): Record<Tone, string> => ({
  default: colors.lineStrong,
  accent: colors.accent,
  data: colors.data,
  ok: colors.ok,
  warning: colors.warning,
  error: colors.error,
  dim: colors.line,
});

export const useTone = (tone: Tone) => toneColor(useColors())[tone];

const lit = (tone: Tone) => tone !== 'default' && tone !== 'dim';

// ─── Time ─────────────────────────────────────────────────────────────────

/**
 * Current position on the story clock (see motion-tokens `story`). Fractional
 * at 60 fps, which is what makes interpolations sub-frame smooth.
 */
export function useStoryFrame() {
  return useCurrentFrame() / storyScale;
}

const bezier = (points: readonly [number, number, number, number]) => Easing.bezier(...points);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 → 1 over `duration` story frames starting at `from`. */
export function useProgress(from: number, duration: number, ease = easing.standard) {
  const frame = useStoryFrame();
  return interpolate(frame, [from, from + duration], [0, 1], { ...clamp, easing: bezier(ease) });
}

/** Spring evaluated on real frames so the physics runs at the output frame rate. */
function useSpring(
  from: number,
  config: typeof nodeSpring | typeof popSpring,
  durationStory?: number,
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - from * storyScale,
    fps,
    config,
    durationInFrames: durationStory ? durationStory * storyScale : undefined,
  });
}

/** Critically damped entrance used by every node. */
export const useEnter = (from: number) => useSpring(from, nodeSpring, durations.nodeEnter);

/** Under-damped pop: 0 → overshoot → 1. */
export const usePop = (from: number) => useSpring(from, popSpring);

/** 0 → 1 fade-out progress starting at `at`. */
function useExit(at: number | undefined, duration: number = durations.captionFade) {
  const frame = useStoryFrame();
  return at === undefined ? 0 : interpolate(frame, [at, at + duration], [0, 1], clamp);
}

// ─── Stage ────────────────────────────────────────────────────────────────

/** Shared SVG definitions: grid patterns, the two bloom filters and the vignette. */
export function StageDefs() {
  const colors = useColors();
  const glow = useGlow();
  return (
    <defs>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke={colors.grid} strokeWidth="1" />
      </pattern>
      <pattern id="grid-fine" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M 8 0 L 0 0 0 8" fill="none" stroke={colors.grid} strokeWidth="0.75" />
      </pattern>
      {/* Phosphor bloom: a blurred copy of the source merged under the original. */}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${1.6 * glow} 0`}
          result="bloom"
        />
        <feMerge>
          <feMergeNode in="bloom" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="wide" />
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="tight" />
        <feColorMatrix
          in="wide"
          type="matrix"
          values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${1.4 * glow} 0`}
          result="wideBloom"
        />
        <feMerge>
          <feMergeNode in="wideBloom" />
          <feMergeNode in="tight" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
        <stop offset="60%" stopColor={colors.bg} stopOpacity="0" />
        <stop offset="100%" stopColor={colors.bg} stopOpacity={0.7 * glow} />
      </radialGradient>
    </defs>
  );
}

export function Stage({
  figure,
  title,
  children,
}: {
  figure: string;
  title: string;
  children: ReactNode;
}) {
  const colors = useColors();
  const intro = useProgress(0, 20);
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: typography.sans }}>
      <svg
        width={canvas.width}
        height={canvas.height}
        viewBox={`0 0 ${canvas.width} ${canvas.height}`}
      >
        <StageDefs />
        <rect width="100%" height="100%" fill="url(#grid)" />
        <g opacity={intro}>
          <text
            x={spacing.margin}
            y={52}
            fill={colors.accent}
            fontFamily={typography.mono}
            fontSize={typography.size.label}
            letterSpacing={typography.tracking.label}
          >
            {figure.toUpperCase()}
          </text>
          <text
            x={spacing.margin}
            y={84}
            fill={colors.text}
            fontSize={typography.size.title}
            fontWeight={600}
            letterSpacing="-0.02em"
          >
            {title}
          </text>
        </g>
        {children}
        <rect width="100%" height="100%" fill="url(#vignette)" pointerEvents="none" />
      </svg>
    </AbsoluteFill>
  );
}

// ─── Nodes & labels ───────────────────────────────────────────────────────

export function Node({
  x,
  y,
  w = spacing.nodeWidth,
  h = spacing.nodeHeight,
  label,
  sub,
  enter,
  tone = 'default',
  fill,
  opacity = 1,
  labelSize = typography.size.node,
  intense = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  enter: number;
  tone?: Tone;
  fill?: string;
  opacity?: number;
  labelSize?: number;
  /** Stronger bloom for the moment a node is the focus (a held lock, a rejection). */
  intense?: boolean;
}) {
  const colors = useColors();
  const glow = useGlow();
  const stroke = toneColor(colors)[tone];
  const p = useEnter(enter);
  const lift = interpolate(p, [0, 1], [10, 0]);
  const cy = y + h / 2;
  return (
    <g opacity={p * opacity} transform={`translate(0 ${lift})`}>
      {lit(tone) && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={spacing.radius}
          fill="none"
          stroke={stroke}
          strokeWidth={intense ? 3 : 2}
          filter={intense ? 'url(#glow-strong)' : 'url(#glow)'}
          opacity={glow}
        />
      )}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={spacing.radius}
        fill={fill ?? colors.surface}
        stroke={stroke}
        strokeWidth={lit(tone) ? 1.75 : 1}
      />
      {lit(tone) && <rect x={x} y={y} width={3} height={h} rx={1.5} fill={stroke} opacity={0.9} />}
      <text
        x={x + 14}
        y={sub ? cy - 4 : cy + 6}
        fill={tone === 'dim' ? colors.faint : colors.text}
        fontFamily={typography.mono}
        fontSize={labelSize}
        fontWeight={500}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + 14}
          y={cy + 17}
          fill={lit(tone) ? stroke : colors.muted}
          fontFamily={typography.mono}
          fontSize={typography.size.label}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

export function Label({
  x,
  y,
  children,
  enter = 0,
  color,
  size = typography.size.label,
  anchor = 'start',
  mono = true,
  weight = 400,
  exit,
  glow = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  enter?: number;
  color?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  mono?: boolean;
  weight?: number;
  exit?: number;
  glow?: boolean;
}) {
  const colors = useColors();
  const inP = useProgress(enter, durations.captionFade);
  const outP = useExit(exit);
  return (
    <text
      x={x}
      y={y}
      fill={color ?? colors.muted}
      opacity={inP * (1 - outP)}
      fontFamily={mono ? typography.mono : typography.sans}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      filter={glow ? 'url(#glow)' : undefined}
    >
      {children}
    </text>
  );
}

/** Tag that pops in with an under-damped spring (0.8 → ~1.05 → 1). */
export function Chip({
  x,
  y,
  text,
  enter,
  tone = 'default',
  exit,
  glow = false,
}: {
  x: number;
  y: number;
  text: string;
  enter: number;
  tone?: Tone;
  exit?: number;
  glow?: boolean;
}) {
  const colors = useColors();
  const frame = useStoryFrame();
  const pop = usePop(enter);
  const outP = useExit(exit, 12);
  if (frame < enter) return null;
  const w = text.length * 7.9 + 20;
  const color = tone === 'default' ? colors.muted : toneColor(colors)[tone];
  const scale = interpolate(pop, [0, 1], [0.8, 1]);
  const cx = x + w / 2;
  const cy = y + 13;
  return (
    <g
      opacity={Math.min(1, pop * 1.5) * (1 - outP)}
      transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={26}
        rx={3}
        fill={colors.surfaceRaised}
        stroke={color}
        strokeWidth={1}
        filter={glow ? 'url(#glow)' : undefined}
      />
      <text x={x + 10} y={y + 17.5} fill={color} fontFamily={typography.mono} fontSize={12.5}>
        {text}
      </text>
    </g>
  );
}

// ─── Geometry ─────────────────────────────────────────────────────────────

const segmentLengths = (points: Pt[]) =>
  points.slice(1).map((p, i) => Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y));

export const pathD = (points: Pt[]) =>
  points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');

export function pointAt(points: Pt[], t: number): Pt {
  const lengths = segmentLengths(points);
  const total = lengths.reduce((a, b) => a + b, 0);
  let remaining = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i]!;
    if (remaining <= len || i === lengths.length - 1) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const k = len === 0 ? 0 : remaining / len;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    remaining -= len;
  }
  return points[points.length - 1]!;
}

// ─── Edges & packets ──────────────────────────────────────────────────────

/**
 * Laser-etched trace: a faint guide track appears first, then the line is
 * burned in by a bright head travelling along it.
 */
export function Edge({
  points,
  enter,
  tone = 'default',
  dashed = false,
  opacity = 1,
  arrow = true,
  glow = false,
  width = spacing.stroke,
}: {
  points: Pt[];
  enter: number;
  tone?: Tone;
  dashed?: boolean;
  opacity?: number;
  arrow?: boolean;
  /** Persistent bloom on the finished line (a hot path, a ribbon). */
  glow?: boolean;
  width?: number;
}) {
  const colors = useColors();
  const glowK = useGlow();
  const p = useProgress(enter, durations.edgeDraw);
  const guide = useProgress(enter - 6, 8);
  const total = segmentLengths(points).reduce((a, b) => a + b, 0);
  const end = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const angle = (Math.atan2(end.y - prev.y, end.x - prev.x) * 180) / Math.PI;
  const color = toneColor(colors)[tone];
  const head = pointAt(points, p);
  const d = pathD(points);
  return (
    <g opacity={opacity}>
      <path
        d={d}
        fill="none"
        stroke={colors.lineStrong}
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={guide * 0.35}
      />
      {glow && p > 0 && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width + 1.5}
          strokeDasharray={`${total} ${total}`}
          strokeDashoffset={total * (1 - p)}
          filter="url(#glow)"
          opacity={0.8 * glowK}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '5 6' : `${total} ${total}`}
        strokeDashoffset={dashed ? 0 : total * (1 - p)}
        opacity={dashed ? p : 1}
      />
      {p > 0 && p < 1 && (
        <circle
          cx={head.x}
          cy={head.y}
          r={2.6}
          fill={lit(tone) ? color : colors.text}
          filter="url(#glow-strong)"
        />
      )}
      {arrow && (
        <path
          d="M -7 -4.5 L 0 0 L -7 4.5"
          fill="none"
          stroke={color}
          strokeWidth={spacing.stroke}
          transform={`translate(${end.x} ${end.y}) rotate(${angle})`}
          opacity={p >= 0.98 ? 1 : 0}
        />
      )}
    </g>
  );
}

/** Expanding ring that damps out: an arrival, a lock engaging, a counter flipping. */
export function Ripple({
  x,
  y,
  at,
  tone = 'accent',
  radius = 30,
  rings = 1,
  duration = durations.ripple,
}: {
  x: number;
  y: number;
  at: number;
  tone?: Tone;
  radius?: number;
  rings?: number;
  duration?: number;
}) {
  const frame = useStoryFrame();
  const color = useTone(tone);
  const glow = useGlow();
  const last = at + duration + (rings - 1) * 6;
  if (frame < at || frame > last) return null;
  return (
    <g filter="url(#glow)">
      {Array.from({ length: rings }, (_, i) => {
        const t = interpolate(frame, [at + i * 6, at + i * 6 + duration], [0, 1], {
          ...clamp,
          easing: bezier(easing.enter),
        });
        if (t <= 0) return null;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4 + radius * t}
            fill="none"
            stroke={color}
            strokeWidth={2.2 * (1 - t) + 0.4}
            opacity={(1 - t) * (0.5 + 0.5 * glow)}
          />
        );
      })}
    </g>
  );
}

/** Small mono badge that travels with a packet. */
function Payload({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const colors = useColors();
  const w = text.length * 6.9 + 14;
  return (
    <g>
      <rect
        x={x}
        y={y - 11}
        width={w}
        height={20}
        rx={3}
        fill={colors.surfaceRaised}
        stroke={color}
        strokeWidth={1}
        opacity={0.95}
      />
      <text x={x + 7} y={y + 3.5} fill={color} fontFamily={typography.mono} fontSize={11}>
        {text}
      </text>
    </g>
  );
}

/**
 * A unit of data in flight: glowing head, fading trail, optional payload badge,
 * and an impact ripple where it lands.
 */
export function Packet({
  points,
  from,
  duration = durations.packetTravel,
  tone = 'accent',
  label,
  radius = spacing.packet * 0.75,
  hold = 0,
  trail = 6,
  impact = true,
}: {
  points: Pt[];
  from: number;
  duration?: number;
  tone?: Tone;
  /** Payload badge text, e.g. `inventory: 0`. */
  label?: string;
  radius?: number;
  /** Story frames to stay visible at the destination. */
  hold?: number;
  /** Number of trailing afterimages. */
  trail?: number;
  impact?: boolean;
}) {
  const colors = useColors();
  const frame = useStoryFrame();
  const color = toneColor(colors)[tone];
  const arrive = from + duration;
  const end = points[points.length - 1]!;
  const ripple = impact ? <Ripple x={end.x} y={end.y} at={arrive} tone={tone} radius={22} /> : null;
  if (frame < from || frame > arrive + Math.max(hold + 6, durations.ripple)) return null;
  if (frame > arrive + hold + 6) return ripple;

  const tAt = (f: number) =>
    interpolate(f, [from, arrive], [0, 1], { ...clamp, easing: bezier(easing.travel) });
  const t = tAt(frame);
  const fade = interpolate(
    frame,
    [from, from + 3, arrive + hold, arrive + hold + 6],
    [0, 1, 1, 0],
    clamp,
  );
  const { x, y } = pointAt(points, t);
  const moving = frame < arrive;
  return (
    <g>
      {ripple}
      <g opacity={fade}>
        {moving &&
          Array.from({ length: trail }, (_, i) => {
            const k = i + 1;
            const pt = pointAt(points, tAt(frame - k * 0.9));
            return (
              <circle
                key={k}
                cx={pt.x}
                cy={pt.y}
                r={radius * (1 - k / (trail + 2))}
                fill={color}
                opacity={0.45 * (1 - k / (trail + 1))}
              />
            );
          })}
        <circle cx={x} cy={y} r={radius * 2.4} fill={color} opacity={0.16} />
        <circle cx={x} cy={y} r={radius} fill={color} filter="url(#glow-strong)" />
        <circle cx={x} cy={y} r={radius * 0.45} fill={colors.surfaceRaised} opacity={0.9} />
        {label && <Payload x={x + radius + 8} y={y - radius - 14} text={label} color={color} />}
      </g>
    </g>
  );
}

/** Deterministic particle burst that drifts and fades: a rejection, discarded findings. */
export function Dissolve({
  x,
  y,
  at,
  tone = 'error',
  count = 16,
  spread = 42,
  duration = durations.dissolve,
  rise = 18,
  seed,
}: {
  x: number;
  y: number;
  at: number;
  tone?: Tone;
  count?: number;
  spread?: number;
  duration?: number;
  rise?: number;
  seed?: string;
}) {
  const frame = useStoryFrame();
  const colors = useColors();
  const color = tone === 'default' ? colors.muted : toneColor(colors)[tone];
  if (frame < at || frame > at + duration) return null;
  const p = (frame - at) / duration;
  const eased = 1 - (1 - p) ** 3;
  const key = seed ?? `${x}:${y}:${at}`;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const angle = random(`${key}:a${i}`) * Math.PI * 2;
        const dist = spread * (0.35 + 0.65 * random(`${key}:d${i}`)) * eased;
        const up = rise * random(`${key}:r${i}`) * p;
        const size = (1.2 + 2.2 * random(`${key}:s${i}`)) * (1 - p * 0.7);
        return (
          <circle
            key={i}
            cx={x + Math.cos(angle) * dist}
            cy={y + Math.sin(angle) * dist * 0.7 - up}
            r={size}
            fill={color}
            opacity={(1 - p) * 0.85}
          />
        );
      })}
    </g>
  );
}

/** Thin progress gauge with a percentage readout. */
export function Gauge({
  x,
  y,
  w,
  start,
  duration,
  tone = 'data',
}: {
  x: number;
  y: number;
  w: number;
  start: number;
  duration: number;
  tone?: Tone;
}) {
  const colors = useColors();
  const frame = useStoryFrame();
  const color = toneColor(colors)[tone];
  const appear = useProgress(start - 8, 8);
  const p = interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: bezier(easing.standard),
  });
  const done = p >= 1;
  return (
    <g opacity={appear}>
      <rect x={x} y={y} width={w} height={3} rx={1.5} fill={colors.line} />
      <rect
        x={x}
        y={y}
        width={w * p}
        height={3}
        rx={1.5}
        fill={done ? colors.ok : color}
        filter={p > 0 && !done ? 'url(#glow)' : undefined}
      />
      <text
        x={x + w}
        y={y + 16}
        textAnchor="end"
        fill={done ? colors.ok : colors.muted}
        fontFamily={typography.mono}
        fontSize={10.5}
      >
        {done ? 'done' : `${Math.round(p * 100)}%`}
      </text>
    </g>
  );
}

/**
 * Odometer: every digit column rolls independently between `from` and `to`.
 * `ease: 'pop'` uses an under-damped spring for a snappy flip.
 */
export function RollingNumber({
  x,
  y,
  from,
  to,
  start,
  duration = 20,
  size = 40,
  color,
  prefix = '',
  suffix = '',
  prefixAt,
  suffixAt,
  anchor = 'start',
  weight = 500,
  ease = 'standard',
  glow = false,
  enter,
}: {
  x: number;
  y: number;
  from: number;
  to: number;
  start: number;
  duration?: number;
  size?: number;
  color?: string;
  prefix?: string;
  suffix?: string;
  /** Story frame at which the prefix/suffix fade in (default: always shown). */
  prefixAt?: number;
  suffixAt?: number;
  anchor?: 'start' | 'end';
  weight?: number;
  ease?: 'standard' | 'pop';
  glow?: boolean;
  /** Story frame at which the counter fades in (default: start). */
  enter?: number;
}) {
  const colors = useColors();
  const frame = useStoryFrame();
  const appear = useProgress(enter ?? start, durations.captionFade);
  const pop = usePop(start);
  const clip = useId();
  const linear = interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: bezier(easing.snap),
  });
  const t = ease === 'pop' ? pop : linear;
  const value = Math.max(0, from + (to - from) * t);
  const fill = color ?? colors.text;

  // Odometer carry: a column only moves while every lower column is rolling
  // over from 9 to 0, so integer values always sit exactly on their digits.
  const whole = Math.floor(value);
  const frac = value - whole;
  const digits = Math.max(
    1,
    String(Math.round(value) >= 1 ? whole + (frac > 0.5 ? 1 : 0) : 0).length,
  );
  const columnValue = (place: number) => {
    const base = Math.floor(value / place) % 10;
    const below = value % place;
    const roll = place === 1 ? frac : below > place - 1 ? below - (place - 1) : 0;
    return base + roll;
  };

  // Layout follows the digits currently shown, so the number never leaves a gap.
  const charW = size * 0.6;
  const lineH = size * 1.15;
  const commas = Math.floor((digits - 1) / 3);
  const numberW = (digits + commas * 0.5) * charW;
  const prefixW = prefix ? prefix.length * charW + charW * 0.15 : 0;
  const suffixW = suffix ? suffix.length * charW * 0.75 + charW * 0.2 : 0;
  const totalW = prefixW + numberW + suffixW;
  const left = anchor === 'end' ? x - totalW : x;
  const fadeIn = (at?: number) =>
    at === undefined ? 1 : interpolate(frame, [at, at + 6], [0, 1], clamp);

  const columns: ReactNode[] = [];
  let cursor = left + prefixW;
  for (let i = digits - 1; i >= 0; i--) {
    const d = columnValue(10 ** i);
    const colX = cursor;
    columns.push(
      <g key={`d${i}`} transform={`translate(0 ${-d * lineH})`}>
        {Array.from({ length: 11 }, (_, n) => (
          <text
            key={n}
            x={colX}
            y={y + n * lineH}
            fill={fill}
            fontFamily={typography.mono}
            fontSize={size}
            fontWeight={weight}
          >
            {n % 10}
          </text>
        ))}
      </g>,
    );
    cursor += charW;
    if (i > 0 && i % 3 === 0) {
      columns.push(
        <text
          key={`c${i}`}
          x={cursor - charW * 0.15}
          y={y}
          fill={fill}
          fontFamily={typography.mono}
          fontSize={size}
          fontWeight={weight}
        >
          ,
        </text>,
      );
      cursor += charW * 0.5;
    }
  }

  return (
    <g filter={glow ? 'url(#glow)' : undefined} opacity={appear}>
      <defs>
        <clipPath id={clip}>
          <rect x={left - 4} y={y - size * 0.82} width={totalW + 8} height={size * 1.02} />
        </clipPath>
      </defs>
      {prefix && (
        <text
          x={left}
          y={y}
          fill={fill}
          opacity={fadeIn(prefixAt)}
          fontFamily={typography.mono}
          fontSize={size}
          fontWeight={weight}
        >
          {prefix}
        </text>
      )}
      <g clipPath={`url(#${clip})`}>{columns}</g>
      {suffix && (
        <text
          x={left + prefixW + numberW + charW * 0.2}
          y={y}
          fill={fill}
          opacity={fadeIn(suffixAt)}
          fontFamily={typography.mono}
          fontSize={size * 0.75}
          fontWeight={weight}
        >
          {suffix}
        </text>
      )}
    </g>
  );
}

/**
 * Security boundary: fine grid, a dashed perimeter drawn on, a scanline sweeping
 * while it is active, and on exit a collapse into a single point of light.
 */
export function Boundary({
  x,
  y,
  w,
  h,
  label,
  enter,
  exit,
  tone = 'data',
  scan = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  enter: number;
  exit?: number;
  tone?: Tone;
  scan?: boolean;
}) {
  const colors = useColors();
  const glow = useGlow();
  const frame = useStoryFrame();
  const p = useProgress(enter, 20);
  const collapse =
    exit === undefined
      ? 0
      : interpolate(frame, [exit, exit + 18], [0, 1], { ...clamp, easing: bezier(easing.exit) });
  const spark =
    exit === undefined
      ? 0
      : interpolate(frame, [exit + 12, exit + 20, exit + 34], [0, 1, 0], clamp);
  const color = toneColor(colors)[tone];
  const perimeter = 2 * (w + h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const scanY = y + (((((frame - enter) % 70) + 70) % 70) / 70) * h;
  const scanning = scan && p >= 1 && collapse === 0;
  // Collapse horizontally first, then vertically, into the centre.
  const sx = 1 - interpolate(collapse, [0, 0.7], [0, 0.995], clamp);
  const sy = 1 - interpolate(collapse, [0.3, 1], [0, 0.995], clamp);
  return (
    <g>
      <g
        opacity={1 - interpolate(collapse, [0.8, 1], [0, 1], clamp)}
        transform={`translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`}
      >
        <rect x={x} y={y} width={w} height={h} rx={10} fill="url(#grid-fine)" opacity={p} />
        <rect x={x} y={y} width={w} height={h} rx={10} fill={color} opacity={0.04 * p} />
        {scanning && (
          <g>
            <rect
              x={x + 1}
              y={Math.max(y + 1, scanY - 18)}
              width={w - 2}
              height={Math.max(0, scanY - Math.max(y + 1, scanY - 18))}
              fill={color}
              opacity={0.05 * (0.6 + 0.4 * glow)}
            />
            <line
              x1={x + 1}
              x2={x + w - 1}
              y1={scanY}
              y2={scanY}
              stroke={color}
              strokeWidth={1}
              opacity={0.45}
              filter="url(#glow)"
            />
          </g>
        )}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={10}
          fill="none"
          stroke={color}
          strokeWidth={1.25}
          strokeDasharray={`${perimeter * p} ${perimeter}`}
          filter="url(#glow)"
        />
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={10}
          fill="none"
          stroke={colors.bg}
          strokeWidth={1.5}
          strokeDasharray="6 6"
          strokeDashoffset={-frame * 0.4}
          opacity={p}
        />
        {(
          [
            [x, y, 1, 1],
            [x + w, y, -1, 1],
            [x, y + h, 1, -1],
            [x + w, y + h, -1, -1],
          ] as const
        ).map(([bx, by, dx, dy]) => (
          <path
            key={`${bx}-${by}`}
            d={`M ${bx + dx * 14} ${by} L ${bx} ${by} L ${bx} ${by + dy * 14}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={p}
          />
        ))}
        <text
          x={x + 16}
          y={y - 10}
          fill={color}
          opacity={p}
          fontFamily={typography.mono}
          fontSize={typography.size.label}
          letterSpacing={typography.tracking.label}
        >
          {label.toUpperCase()}
        </text>
      </g>
      {spark > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={3 + 5 * spark}
          fill={color}
          opacity={spark}
          filter="url(#glow-strong)"
        />
      )}
    </g>
  );
}

/** Piecewise position from keyframes [storyFrame, x, y]; eases between each pair. */
export function useTrack(keys: readonly (readonly [number, number, number])[]): Pt {
  const frame = useStoryFrame();
  const frames = keys.map((k) => k[0]);
  const opts = { ...clamp, easing: bezier(easing.travel) } as const;
  return {
    x: interpolate(
      frame,
      frames,
      keys.map((k) => k[1]),
      opts,
    ),
    y: interpolate(
      frame,
      frames,
      keys.map((k) => k[2]),
      opts,
    ),
  };
}

// ─── Captions ─────────────────────────────────────────────────────────────

export type Beat = { from: number; text: string };

/** One explanatory line at the bottom; beats cross-fade over a progress rule. */
export function Captions({ beats, end }: { beats: Beat[]; end: number }) {
  const colors = useColors();
  const frame = useStoryFrame();
  const current = beats.reduce((idx, b, i) => (frame >= b.from ? i : idx), 0);
  const beatStart = beats[current]!.from;
  const beatEnd = beats[current + 1]?.from ?? end;
  const progress = interpolate(frame, [beatStart, beatEnd], [0, 1], clamp);
  const span = canvas.width - spacing.margin * 2;
  return (
    <g>
      <line
        x1={spacing.margin}
        x2={canvas.width - spacing.margin}
        y1={640}
        y2={640}
        stroke={colors.line}
      />
      <line
        x1={spacing.margin}
        x2={spacing.margin + span * ((current + progress) / beats.length)}
        y1={640}
        y2={640}
        stroke={colors.accent}
        strokeWidth={1.5}
        opacity={0.8}
      />
      {beats.map((beat, i) => {
        const to = beats[i + 1]?.from ?? end;
        const opacity = interpolate(
          frame,
          [beat.from, beat.from + 8, to - 6, to],
          [0, 1, 1, i === beats.length - 1 ? 1 : 0],
          clamp,
        );
        const lift = interpolate(frame, [beat.from, beat.from + 10], [6, 0], clamp);
        return (
          <g key={beat.from} opacity={opacity} transform={`translate(0 ${lift})`}>
            <text
              x={spacing.margin}
              y={676}
              fill={colors.faint}
              fontFamily={typography.mono}
              fontSize={typography.size.label}
            >
              {String(i + 1).padStart(2, '0')}
            </text>
            <text
              x={spacing.margin + 36}
              y={676}
              fill={colors.text}
              fontSize={typography.size.caption}
            >
              {beat.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export { typography, spacing };
