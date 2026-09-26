// Scenes 2–3 — the system reacts, then the name. The signal travels the ruler at constant
// speed; each column it passes pops a node and raises a stem to cap height. One held beat
// of nothing. Then the hit: every stem opens into its letter, the notation disappears in a
// hard cut, and (landscape) the wide tracking collapses on a spring with motion blur. The
// nodes become letter ticks on the rule and the signal comes to rest as the accent node.
import { interpolate, interpolateColors } from 'remotion';
import {
  IDENTITY_COPY,
  MONO_ADVANCE,
  MONO_CAP,
  cellWidth,
  letterX,
  stemX,
} from '../../../../web/src/lib/identity-hero';
import { typography, useColors } from '../../primitives';
import { CUES, beat, ease } from './identityStoryboard';
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

/** The signal: a single diamond that travels, then rests as the one accent. */
export function Signal() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const appear = over(f, beat(CUES.signalIn), 12, ease.pop);
  if (appear <= 0) return null;
  const settle = between(f, CUES.rest, CUES.rest + 0.75, ease.type);
  const r = interpolate(settle, [0, 1], [7, 10]) * appear;
  const fill = interpolateColors(settle, [0, 1], [c.data, c.accent]);
  return <polygon points={diamond(signalX(l, f), l.rule.y, r)} fill={fill} />;
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
  const toTick = over(f, beat(CUES.contract), beat(0.75), ease.structural);

  return (
    <g>
      <defs>
        {LETTERS.map((_, i) => (
          <filter key={i} id={`hero-blur-${i}`} x="-40%" width="180%">
            <feGaussianBlur
              stdDeviation={`${Math.min(Math.abs(velocity * i * size) * 0.4, 16)} 0`}
            />
          </filter>
        ))}
      </defs>

      {LETTERS.map((ch, i) => {
        const pass = passFrame(l, i);
        const x = stemX(l, i, tracking);
        const grow = over(f, pass, 10);
        const pop = over(f, pass, 10, ease.pop);
        if (f < pass) return null;
        const flash = interpolateColors(over(f, pass, 14, ease.data), [0, 1], [c.data, c.text]);
        // Stem: rises to cap height when passed, drops back to the rule once its letter is open.
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
        const blur = Math.abs(velocity * i * size) > 0.3;
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
                transform={`translate(${lx} 0)`}
                filter={blur ? `url(#hero-blur-${i})` : undefined}
              >
                <clipPath id={`hero-open-${i}`}>
                  {/* Opens from the stem outward, mostly to the right, as a drawn letter would */}
                  <rect
                    x={0.09 * size - 1 - open * (0.09 * size + 6)}
                    y={capTop - 20}
                    width={2 + open * (cellWidth(l) + 12)}
                    height={l.name.baseline - capTop + 40}
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

      <Notation capTop={capTop} />
    </g>
  );
}

/** Measurement notes while the system builds; they vanish on the hit (a hard cut, no fade). */
function Notation({ capTop }: { capTop: number }) {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  if (f >= beat(CUES.hit)) return null;
  const cap = over(f, beat(CUES.capNote), 12, ease.structural);
  const bx = l.left - 44;
  const lastPass = passFrame(l, LETTERS.length - 1);
  const dim = over(f, lastPass + 10, 14, ease.structural);
  const x0 = stemX(l, 0, l.name.wideTracking);
  const x1 = stemX(l, LETTERS.length - 1, l.name.wideTracking);
  const mid = (x0 + x1) / 2;
  const dy = capTop - 40;
  const label = {
    fontFamily: typography.mono,
    fontSize: l.chrome.size,
    fill: c.faint,
    letterSpacing: '0.08em',
  } as const;
  const spread = (MONO_ADVANCE + l.name.wideTracking).toFixed(2);

  return (
    <g>
      {cap > 0 && (
        <g stroke={c.faint} strokeWidth={1}>
          <line
            x1={bx}
            x2={bx}
            y1={l.name.baseline}
            y2={l.name.baseline - (l.name.baseline - capTop) * cap}
          />
          <line x1={bx - 5} x2={bx + 5} y1={l.name.baseline} y2={l.name.baseline} />
          {cap >= 1 && <line x1={bx - 5} x2={bx + 5} y1={capTop} y2={capTop} />}
          <text
            {...label}
            stroke="none"
            opacity={cap}
            transform={`translate(${bx - 14} ${(l.name.baseline + capTop) / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            CAP {MONO_CAP.toFixed(3)} EM
          </text>
        </g>
      )}
      {dim > 0 && l.name.wideTracking !== l.name.tracking && (
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
