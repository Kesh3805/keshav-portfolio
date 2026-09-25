import {
  canvas,
  durations,
  easing,
  nodeSpring,
  spacing,
  palettes,
  typography,
  type Palette,
  type Theme,
} from '@keshav/motion-tokens';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export type Pt = { x: number; y: number };
export type Tone = 'default' | 'accent' | 'data' | 'ok' | 'error' | 'dim';

const PaletteContext = createContext<Palette>(palettes.dark);

/** Palette for the theme being rendered; every colour in a composition comes from here. */
export const useColors = () => useContext(PaletteContext);

export type ThemeProps = { theme: Theme };

/** Wraps a composition so its `theme` input prop selects the palette. */
export function themed(Component: ComponentType) {
  return function Themed({ theme }: ThemeProps) {
    return (
      <PaletteContext.Provider value={palettes[theme]}>
        <Component />
      </PaletteContext.Provider>
    );
  };
}

const toneColor = (colors: Palette): Record<Tone, string> => ({
  default: colors.lineStrong,
  accent: colors.accent,
  data: colors.data,
  ok: colors.ok,
  error: colors.error,
  dim: colors.line,
});

const bezier = (points: readonly [number, number, number, number]) => Easing.bezier(...points);

/** 0 → 1 over `duration` frames starting at `from`. */
export function useProgress(from: number, duration: number, ease = easing.standard) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bezier(ease),
  });
}

/** Critically damped entrance used by every node. */
export function useEnter(from: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - from,
    fps,
    config: nodeSpring,
    durationInFrames: durations.nodeEnter,
  });
}

/** True while `from <= frame < to`. */
export function useBetween(from: number, to = Infinity) {
  const frame = useCurrentFrame();
  return frame >= from && frame < to;
}

// ─── Stage ────────────────────────────────────────────────────────────────

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
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke={colors.grid} strokeWidth="1" />
          </pattern>
        </defs>
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
}) {
  const colors = useColors();
  const p = useEnter(enter);
  const lift = interpolate(p, [0, 1], [10, 0]);
  const cy = y + h / 2;
  return (
    <g opacity={p * opacity} transform={`translate(0 ${lift})`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={spacing.radius}
        fill={fill ?? colors.surface}
        stroke={toneColor(colors)[tone]}
        strokeWidth={tone === 'default' ? 1 : 1.75}
      />
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
          fill={colors.muted}
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
}) {
  const colors = useColors();
  const frame = useCurrentFrame();
  const inP = useProgress(enter, durations.captionFade);
  const outP =
    exit === undefined
      ? 0
      : interpolate(frame, [exit, exit + durations.captionFade], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
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
    >
      {children}
    </text>
  );
}

export function Chip({
  x,
  y,
  text,
  enter,
  tone = 'default',
  exit,
}: {
  x: number;
  y: number;
  text: string;
  enter: number;
  tone?: Tone;
  exit?: number;
}) {
  const colors = useColors();
  const frame = useCurrentFrame();
  const p = useEnter(enter);
  const outP =
    exit === undefined
      ? 0
      : interpolate(frame, [exit, exit + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const w = text.length * 7.9 + 20;
  const color = tone === 'default' ? colors.muted : toneColor(colors)[tone];
  return (
    <g opacity={p * (1 - outP)} transform={`translate(0 ${interpolate(p, [0, 1], [6, 0])})`}>
      <rect
        x={x}
        y={y}
        width={w}
        height={26}
        rx={3}
        fill={colors.surfaceRaised}
        stroke={color}
        strokeWidth={1}
      />
      <text x={x + 10} y={y + 17.5} fill={color} fontFamily={typography.mono} fontSize={12.5}>
        {text}
      </text>
    </g>
  );
}

// ─── Edges & packets ──────────────────────────────────────────────────────

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

export function Edge({
  points,
  enter,
  tone = 'default',
  dashed = false,
  opacity = 1,
  arrow = true,
}: {
  points: Pt[];
  enter: number;
  tone?: Tone;
  dashed?: boolean;
  opacity?: number;
  arrow?: boolean;
}) {
  const colors = useColors();
  const p = useProgress(enter, durations.edgeDraw);
  const total = segmentLengths(points).reduce((a, b) => a + b, 0);
  const end = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const angle = (Math.atan2(end.y - prev.y, end.x - prev.x) * 180) / Math.PI;
  const color = toneColor(colors)[tone];
  return (
    <g opacity={opacity}>
      <path
        d={pathD(points)}
        fill="none"
        stroke={color}
        strokeWidth={spacing.stroke}
        strokeDasharray={dashed ? '5 6' : `${total} ${total}`}
        strokeDashoffset={dashed ? 0 : total * (1 - p)}
        opacity={dashed ? p : 1}
      />
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

export function Packet({
  points,
  from,
  duration = durations.packetTravel,
  tone = 'accent',
  label,
  radius = spacing.packet,
  hold = 0,
}: {
  points: Pt[];
  from: number;
  duration?: number;
  tone?: Tone;
  label?: string;
  radius?: number;
  /** Frames to stay visible at the destination. */
  hold?: number;
}) {
  const colors = useColors();
  const frame = useCurrentFrame();
  if (frame < from || frame > from + duration + hold + 6) return null;
  const t = interpolate(frame, [from, from + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bezier(easing.travel),
  });
  const fade = interpolate(
    frame,
    [from, from + 4, from + duration + hold, from + duration + hold + 6],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const { x, y } = pointAt(points, t);
  const color = toneColor(colors)[tone];
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={radius * 2.2} fill={color} opacity={0.18} />
      <circle cx={x} cy={y} r={radius} fill={color} />
      {label && (
        <text
          x={x + radius + 8}
          y={y - radius - 4}
          fill={color}
          fontFamily={typography.mono}
          fontSize={12.5}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function Boundary({
  x,
  y,
  w,
  h,
  label,
  enter,
  exit,
  tone = 'data',
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  enter: number;
  exit?: number;
  tone?: Tone;
}) {
  const colors = useColors();
  const frame = useCurrentFrame();
  const p = useProgress(enter, 20);
  const outP =
    exit === undefined
      ? 0
      : interpolate(frame, [exit, exit + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const color = toneColor(colors)[tone];
  const perimeter = 2 * (w + h);
  return (
    <g opacity={1 - outP}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={color} opacity={0.04 * p} />
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
        opacity={p}
      />
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
  );
}

/** Piecewise position from keyframes [frame, x, y]; eases between each pair. */
export function useTrack(keys: readonly (readonly [number, number, number])[]): Pt {
  const frame = useCurrentFrame();
  const frames = keys.map((k) => k[0]);
  const opts = {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: bezier(easing.travel),
  } as const;
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

/** One explanatory line at the bottom; beats cross-fade. */
export function Captions({ beats, end }: { beats: Beat[]; end: number }) {
  const colors = useColors();
  const frame = useCurrentFrame();
  return (
    <g>
      <line
        x1={spacing.margin}
        x2={canvas.width - spacing.margin}
        y1={640}
        y2={640}
        stroke={colors.line}
      />
      {beats.map((beat, i) => {
        const to = beats[i + 1]?.from ?? end;
        const opacity = interpolate(
          frame,
          [beat.from, beat.from + 10, to - 8, to],
          [0, 1, 1, i === beats.length - 1 ? 1 : 0],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          },
        );
        return (
          <g key={beat.from} opacity={opacity}>
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
