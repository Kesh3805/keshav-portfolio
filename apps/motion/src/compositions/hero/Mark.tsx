// Scenes 0–1 — the mark, then the form. Cold open on a hairline diamond that fills the
// frame; the camera pulls back 18× and it is the hub of the K mark (lib/brand.ts, the site
// logo), whose edges draw out of it. Then the K falls over: the stem rotates flat and
// stretches into the ruler, the arm and leg fold into it, the top node vanishes into the
// hub, the base node rides to the far end as a hollow target, and the hub drops to the
// ruler's start as the signal. One continuous morph; no cut, no fade.
import { interpolate, interpolateColors } from 'remotion';
import { MARK, RESOLVE_ORDER } from '../../../../web/src/lib/brand';
import { typography, useColors } from '../../primitives';
import { CUES, MARK_PLACE, beat, ease } from './identityStoryboard';
import { between, diamond, over, useFrame, useLayout } from './identityShared';

const byId = new Map(MARK.nodes.map((n) => [n.id, n]));
const EDGE_FRAMES = 14;
const EDGE_STAGGER = 5;

export function useMarkPlace() {
  const l = useLayout();
  const p = MARK_PLACE[l.width as keyof typeof MARK_PLACE];
  const at = (x: number, y: number) => ({ x: p.x + (x - 16.5) * p.s, y: p.y + (y - 16) * p.s });
  return { ...p, at, hub: at(byId.get('hub')!.x, byId.get('hub')!.y) };
}

type V = { x: number; y: number };
const add = (a: V, b: V, k = 1) => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const dir = (angle: number) => ({ x: Math.cos(angle), y: Math.sin(angle) });

export function MarkAndForm() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const place = useMarkPlace();
  const t = between(f, CUES.collapse[0], CUES.collapse[1], ease.structural);
  if (f < beat(CUES.hubIn) || t >= 1) return null;

  const S = place.s;
  const hub0 = place.hub;
  const H = {
    x: interpolate(t, [0, 1], [hub0.x, l.left]),
    y: interpolate(t, [0, 1], [hub0.y, l.rule.y]),
  };
  // The stem's downward direction rotates to point along the ruler (down → right).
  const stemAngle = interpolate(t, [0, 1], [Math.PI / 2, 0]);
  const d = dir(stemAngle);
  const half = 11 * S; // hub to top/base on the grid
  const baseLen = interpolate(t, [0, 1], [half, l.right - l.left]);
  const topLen = half * (1 - t);
  const node = MARK.node * S;
  const trim = (MARK.node + MARK.gap) * S * (1 - t);
  const thin = Math.pow(t, 0.6);
  const stroke = interpolate(thin, [0, 1], [MARK.stroke * S, 1.5]);
  const ink = interpolateColors(t, [0, 1], [c.text, c.faint]);

  // Arm and leg fold into the ruler's direction while shrinking into the hub.
  const fold = (id: 'arm' | 'leg') => {
    const n = byId.get(id)!;
    const h = byId.get('hub')!;
    const a0 = Math.atan2(n.y - h.y, n.x - h.x);
    const angle = interpolate(t, [0, 1], [a0, stemAngle]);
    return { d: dir(angle), len: Math.hypot(n.x - h.x, n.y - h.y) * S * (1 - t) };
  };
  const arm = fold('arm');
  const leg = fold('leg');

  // Edge geometry in the order the mark resolves: stem up, stem down, arm, leg.
  const edges: Record<string, { from: V; to: V }> = {
    top: { from: add(H, d, -trim), to: add(H, d, -Math.max(trim, topLen - trim)) },
    base: { from: add(H, d, trim), to: add(H, d, baseLen - trim) },
    arm: { from: add(H, arm.d, trim), to: add(H, arm.d, Math.max(trim, arm.len - trim)) },
    leg: { from: add(H, leg.d, trim), to: add(H, leg.d, Math.max(trim, leg.len - trim)) },
  };
  const drawn = (i: number) =>
    over(f, beat(CUES.edges[0]) + i * EDGE_STAGGER, EDGE_FRAMES, ease.type);

  const nodes = {
    top: { p: add(H, d, -topLen), r: node * (1 - t) },
    arm: { p: add(H, arm.d, arm.len), r: node * (1 - t) },
    leg: { p: add(H, leg.d, leg.len), r: node * (1 - t) },
    base: { p: add(H, d, baseLen), r: interpolate(t, [0, 1], [node, 7]) },
  };

  // Cold open: the hub is a hairline outline (constant 1.5px at any zoom) until the pull-back lands.
  const fill = over(f, beat(CUES.pullBack[1]) - 16, 16, ease.structural);
  const hubR = interpolate(t, [0, 1], [node, 7]);
  const hubFill = interpolateColors(t, [0, 1], [c.accent, c.data]);

  return (
    <g>
      {RESOLVE_ORDER.edges.map((e, i) => {
        const k = drawn(i);
        if (k <= 0) return null;
        const g = edges[e.to]!;
        return (
          <line
            key={e.to}
            x1={g.from.x}
            y1={g.from.y}
            x2={g.from.x + (g.to.x - g.from.x) * k}
            y2={g.from.y + (g.to.y - g.from.y) * k}
            stroke={ink}
            strokeWidth={stroke}
          />
        );
      })}
      {(['top', 'base', 'arm', 'leg'] as const).map((id) => {
        const i = RESOLVE_ORDER.edges.findIndex((e) => e.to === id);
        const pop = over(f, beat(CUES.edges[0]) + i * EDGE_STAGGER + EDGE_FRAMES - 4, 10, ease.pop);
        const n = nodes[id];
        if (pop <= 0 || n.r < 0.3) return null;
        // The base node becomes the hollow target the signal will come back to.
        const hollow = id === 'base' ? t : 0;
        return (
          <polygon
            key={id}
            points={diamond(n.p.x, n.p.y, n.r * pop)}
            fill={interpolateColors(hollow, [0, 1], [c.text, c.bg])}
            stroke={hollow > 0 ? c.faint : 'none'}
            strokeWidth={1.5}
          />
        );
      })}
      <polygon
        points={diamond(H.x, H.y, hubR)}
        fill={hubFill}
        fillOpacity={t > 0 ? 1 : fill}
        stroke={c.accent}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <MarkNote place={place} t={t} />
    </g>
  );
}

/** A small typed note beside the finished mark; it disappears on the first frame of the collapse. */
function MarkNote({ place, t }: { place: ReturnType<typeof useMarkPlace>; t: number }) {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  if (t > 0) return null;
  const text = `K — ${MARK.nodes.length - MARK.joints.length} NODES · ${MARK.edges.length} EDGES`;
  const typed = Math.floor(between(f, CUES.markNote, CUES.markNote + 0.5) * text.length);
  if (typed <= 0) return null;
  const p = place.at(24 + 6, 16);
  return (
    <text
      x={p.x}
      y={p.y + l.chrome.size * 0.35}
      fontFamily={typography.mono}
      fontSize={l.chrome.size}
      letterSpacing="0.1em"
      fill={c.faint}
    >
      {text.slice(0, typed)}
    </text>
  );
}
