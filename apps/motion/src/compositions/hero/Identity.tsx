// Scenes 2–3 — the system reacts, then the name. The signal (the K's hub) travels the
// ruler at constant speed; each column it passes pops a node and raises a stem to cap
// height while type-construction guides draw across the frame. One held beat. Then the
// hit: every stem opens into its letter and the notation disappears in a hard cut. In
// landscape the wide tracking collapses on a spring; in portrait the letters rise into
// place. Either way onion-skin outlines trace the last frames of the movement. The nodes
// become letter ticks, and the signal glides into the hollow target the K's base left at
// the end of the rule, which answers with one ring.
import { interpolate, interpolateColors, spring } from 'remotion';
import {
  IDENTITY_COPY,
  MONO_ADVANCE,
  MONO_CAP,
  cellWidth,
  letterX,
  stemX,
  type IdentityLayout,
} from '../../../../web/src/lib/identity-hero';
import { typography, useColors } from '../../primitives';
import { CUES, FPS, beat, ease, identitySpring } from './identityStoryboard';
import {
  between,
  diamond,
  over,
  passFrame,
  signalX,
  trackingAt,
  useFrame,
  useLayout,
} from './identityShared';

const LETTERS = [...IDENTITY_COPY.name];
const OPEN_STAGGER = 2;
const OPEN_FRAMES = 12;
const ONION = [4, 8, 12, 16]; // frames behind the present
const RISE = 90; // portrait: px the letters rise from

const contracts = (l: IdentityLayout) => l.name.wideTracking !== l.name.tracking;

/** Portrait's physical move: letters rise into place on the identity spring. */
function riseAt(l: IdentityLayout, frame: number) {
  if (contracts(l)) return 0;
  const s = spring({ frame: frame - beat(CUES.hit), fps: FPS, config: identitySpring });
  return RISE * (1 - s);
}

/** The signal after the morph, the hollow target at the end of the rule, and the arrival ring. */
export function Signal() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  if (f < beat(CUES.collapse[1])) return null;
  const settle = between(f, CUES.rest, CUES.rest + 0.75, ease.type);
  const r = interpolate(settle, [0, 1], [7, 10]);
  const fill = interpolateColors(settle, [0, 1], [c.data, c.accent]);
  const arrived = beat(CUES.rest + 0.75);
  const ring = over(f, arrived - 4, 22, ease.type);
  return (
    <g>
      {settle < 1 && (
        <polygon
          points={diamond(l.right, l.rule.y, 7)}
          fill={c.bg}
          stroke={c.faint}
          strokeWidth={1.5}
        />
      )}
      {ring > 0 && ring < 1 && (
        <polygon
          points={diamond(l.right, l.rule.y, interpolate(ring, [0, 1], [10, 44]))}
          fill="none"
          stroke={c.accent}
          strokeWidth={1.5}
          opacity={1 - ring}
        />
      )}
      <polygon points={diamond(signalX(l, f), l.rule.y, r)} fill={fill} />
    </g>
  );
}

export function Columns() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const hit = beat(CUES.hit);
  const size = l.name.size;
  const capTop = l.name.baseline - MONO_CAP * size;
  const tracking = trackingAt(l, f);
  const velocity = tracking - trackingAt(l, f - 1);
  const rise = riseAt(l, f);
  const riseVelocity = rise - riseAt(l, f - 1);
  const toTick = over(f, beat(CUES.contract), beat(0.75), ease.structural);
  const blurX = (i: number) => Math.min(Math.abs(velocity * i * size) * 0.4, 16);
  const blurY = Math.min(Math.abs(riseVelocity) * 0.4, 12);

  // Onion skins: outlines of where the letters were a few frames ago, while they still move.
  const skins =
    f >= hit + OPEN_FRAMES
      ? ONION.map((back, k) => {
          const tr = trackingAt(l, f - back);
          const dy = riseAt(l, f - back);
          const lag = Math.abs(letterX(l, 5, tr) - letterX(l, 5, tracking)) + Math.abs(dy - rise);
          const strength = Math.min(1, lag / 40) * (1 - k / ONION.length);
          return { tr, dy, strength, k };
        }).filter((s) => s.strength > 0.02)
      : [];

  return (
    <g>
      <defs>
        {LETTERS.map((_, i) => (
          <filter key={i} id={`hero-blur-${i}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation={`${blurX(i)} ${blurY}`} />
          </filter>
        ))}
      </defs>

      {skins.map((s) => (
        <text
          key={s.k}
          x={l.left}
          y={l.name.baseline + s.dy}
          fontFamily={typography.mono}
          fontWeight={500}
          fontSize={size}
          letterSpacing={`${s.tr}em`}
          fill="none"
          stroke={c.faint}
          strokeWidth={1.2}
          opacity={s.strength * 0.5}
        >
          {IDENTITY_COPY.name}
        </text>
      ))}

      {LETTERS.map((ch, i) => {
        const pass = passFrame(l, i);
        if (f < pass) return null;
        const x = stemX(l, i, tracking);
        const grow = over(f, pass, 10);
        const pop = over(f, pass, 10, ease.pop);
        const flash = interpolateColors(over(f, pass, 14, ease.data), [0, 1], [c.data, c.text]);
        // Each stem retracts as soon as its own letter is half open, so it never cuts through S, A or V.
        const stemsDown = over(f, hit + i * OPEN_STAGGER + OPEN_FRAMES / 2, 8, ease.structural);
        const stemTop = interpolate(
          stemsDown,
          [0, 1],
          [l.rule.y - (l.rule.y - capTop) * grow, l.rule.y],
        );
        // Node → letter tick: a diamond on the rule becomes a short tick hanging below it.
        const w = interpolate(toTick, [0, 1], [8, 0.9]) * pop;
        const h = interpolate(toTick, [0, 1], [8, 7]) * pop;
        const cy = interpolate(toTick, [0, 1], [l.rule.y, l.rule.y + 7]);
        const open = over(f, hit + i * OPEN_STAGGER, OPEN_FRAMES);
        const lx = letterX(l, i, tracking);
        const blur = blurX(i) > 0.3 || blurY > 0.3;
        return (
          <g key={i}>
            {stemTop < l.rule.y - 0.5 && (
              <line
                x1={x}
                x2={x}
                y1={l.rule.y}
                y2={stemTop}
                stroke={f < hit ? flash : c.text}
                strokeWidth={2}
              />
            )}
            <polygon
              points={diamond(x, cy, w, h)}
              fill={toTick > 0 ? c.faint : c.bg}
              stroke={toTick > 0.5 ? 'none' : f < hit ? flash : c.lineStrong}
              strokeWidth={1.5}
            />
            {open > 0 && (
              <g
                transform={`translate(${lx} ${rise})`}
                filter={blur ? `url(#hero-blur-${i})` : undefined}
              >
                <clipPath id={`hero-open-${i}`}>
                  {/* Opens from the stem outward, mostly to the right, as a drawn letter would */}
                  <rect
                    x={0.09 * size - 1 - open * (0.09 * size + 6)}
                    y={capTop - 20 - RISE}
                    width={2 + open * (cellWidth(l) + 12)}
                    height={l.name.baseline - capTop + 60 + RISE}
                  />
                </clipPath>
                <text
                  x={0}
                  y={l.name.baseline}
                  clipPath={`url(#hero-open-${i})`}
                  fontFamily={typography.mono}
                  fontWeight={500}
                  fontSize={size}
                  fill={c.text}
                >
                  {ch}
                </text>
              </g>
            )}
          </g>
        );
      })}

      <Construction capTop={capTop} />
    </g>
  );
}

/**
 * Type-construction notation while the system builds: cap line and baseline guides drawn
 * across the frame, labelled in the margin, and a dimension over the columns. It vanishes
 * on the hit — a hard cut, no fade.
 */
function Construction({ capTop }: { capTop: number }) {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  if (f >= beat(CUES.hit)) return null;
  const draw = between(f, CUES.guides[0], CUES.guides[1], ease.data);
  const lastPass = passFrame(l, LETTERS.length - 1);
  const dim = over(f, lastPass + 10, 14, ease.structural);
  const x0 = stemX(l, 0, l.name.wideTracking);
  const x1 = stemX(l, LETTERS.length - 1, l.name.wideTracking);
  const mid = (x0 + x1) / 2;
  const dy = capTop - 44;
  const label = {
    fontFamily: typography.mono,
    fontSize: l.chrome.size,
    fill: c.faint,
    letterSpacing: '0.1em',
  } as const;
  const spread = (MONO_ADVANCE + l.name.wideTracking).toFixed(2);
  const margin = l.left >= 150;
  const guide = (y: number, name: string, delay: number) => {
    const k = Math.max(0, Math.min(1, draw * 1.25 - delay));
    if (k <= 0) return null;
    return (
      <g key={name}>
        <line
          x1={0}
          x2={l.width * k}
          y1={y}
          y2={y}
          stroke={c.lineStrong}
          strokeWidth={1}
          strokeDasharray="2 6"
        />
        {/* In the margin where there is room (landscape), inline above the guide otherwise. */}
        <text
          {...label}
          x={margin ? l.left - 16 : l.left}
          y={y - 8}
          textAnchor={margin ? 'end' : 'start'}
          opacity={Math.min(1, k * 3)}
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <g>
      {guide(capTop, `CAP ${MONO_CAP.toFixed(3)}`, 0)}
      {guide(l.name.baseline, 'BASELINE', 0.25)}
      {dim > 0 && contracts(l) && (
        <g stroke={c.faint} strokeWidth={1}>
          <line x1={mid - (mid - x0) * dim} x2={mid + (x1 - mid) * dim} y1={dy} y2={dy} />
          {dim >= 1 && (
            <>
              <line x1={x0} x2={x0} y1={dy - 5} y2={dy + 5} />
              <line x1={x1} x2={x1} y1={dy - 5} y2={dy + 5} />
            </>
          )}
          <text {...label} stroke="none" x={mid} y={dy - 12} textAnchor="middle" opacity={dim}>
            6 × {spread} EM
          </text>
        </g>
      )}
    </g>
  );
}
