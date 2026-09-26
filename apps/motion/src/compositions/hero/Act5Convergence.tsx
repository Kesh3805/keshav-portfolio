// ACT V — Convergence into the homepage topology, then the mark and identity.
// The topology is the web app's own data (apps/web/src/lib/topology.ts), drawn with the
// same isometric projection as the homepage, so the film ends in the site's architecture
// language rather than beside it. The topology then contracts: five of its nodes travel
// into the five nodes of the K mark (apps/web/src/lib/brand.ts, the same geometry as the
// site logo), the K's edges draw out of the hub, one signal runs through it, and the
// identity follows — KESHAV, SYSTEMS ENGINEER, the site headline.
import { Easing, interpolate } from 'remotion';
import { MARK, RESOLVE_ORDER, edgeSegments, signalPath } from '../../../../web/src/lib/brand';
import {
  edges,
  frame as topoFrame,
  labelAnchor,
  nodeById,
  nodes,
  plinthScreen,
  project,
} from '../../../../web/src/lib/topology';
import { typography, useColors, useStoryFrame } from '../../primitives';
import { ACTS, CONVERGES_TO, INTO_MARK, convergenceBeat, type ActId } from './timeline';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.2, 0, 0, 1);

// Beats relative to the convergence act (200 story frames).
const TOPOLOGY_IN = 60;
const CONTRACT = 108; // topology contracts; five nodes travel into the K
const RESOLVE = 128; // the K's edges draw out of the hub
const SIGNAL = 146; // one signal: base → hub → arm
const NAME = 142;
const ROLE = 152;
const HEADLINE = 160;

// The mark on the end card: centred, in story units.
const MARK_CX = 640;
const MARK_CY = 236;
const MARK_S = 4.6;
const markAt = (x: number, y: number) => ({
  x: MARK_CX + (x - 16.5) * MARK_S,
  y: MARK_CY + (y - 16) * MARK_S,
});

export function Act5Convergence() {
  const colors = useColors();
  const t = useStoryFrame() - ACTS.convergence.start;
  if (t < TOPOLOGY_IN - 10) return null;

  // The topology sits centred while the systems converge, then contracts toward the mark.
  const contract = interpolate(t, [CONTRACT, CONTRACT + 22], [0, 1], { ...clamp, easing: ease });
  const cx = interpolate(contract, [0, 1], [640, MARK_CX]);
  const cy = interpolate(contract, [0, 1], [320, MARK_CY]);
  const S = (760 / topoFrame.width) * interpolate(contract, [0, 1], [1, 0.35]);
  const place = (p: { x: number; y: number }) => ({
    x: cx + (p.x - (topoFrame.minX + topoFrame.width / 2)) * S,
    y: cy + (p.y - (topoFrame.minY + topoFrame.height / 2)) * S,
  });
  const appear = interpolate(t, [TOPOLOGY_IN - 10, TOPOLOGY_IN + 20], [0, 1], clamp);
  const topologyOpacity = appear * (1 - interpolate(t, [CONTRACT, CONTRACT + 14], [0, 1], clamp));

  // Each act's nodes light in the order the film told them.
  const order: Exclude<ActId, 'convergence'>[] = [
    'concurrency',
    'pipeline',
    'reconciliation',
    'review',
  ];
  const litAt = new Map<string, number>();
  order.forEach((act, i) => {
    for (const id of CONVERGES_TO[act])
      if (!litAt.has(id)) litAt.set(id, convergenceBeat(i) - ACTS.convergence.start);
  });
  const isLit = (id: string) => t >= (litAt.get(id) ?? Infinity);

  const { halfWidth: hw, halfHeight: hh, lift } = plinthScreen;
  const pts = (arr: [number, number][]) =>
    arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // The K: nodes travel from their topology plinth tops, edges draw from the hub, one signal.
  const travel = interpolate(t, [CONTRACT, CONTRACT + 26], [0, 1], { ...clamp, easing: ease });
  const r = MARK.node * MARK_S;
  const kNodes = MARK.nodes.map((n) => {
    const src = nodeById.get(INTO_MARK[n.id]!)!;
    const from = place(project(src.u, src.v));
    const to = markAt(n.x, n.y);
    // Plinth top (a flat rhombus, raised by the plinth's lift) → the mark's square diamond.
    return {
      id: n.id,
      x: interpolate(travel, [0, 1], [from.x, to.x]),
      y: interpolate(travel, [0, 1], [from.y - lift * S, to.y]),
      w: interpolate(travel, [0, 1], [hw * S, r]),
      h: interpolate(travel, [0, 1], [hh * S, r]),
      fill: n.accent ? colors.accent : travel < 0.6 ? colors.data : colors.text,
    };
  });
  const signal = interpolate(t, [SIGNAL, SIGNAL + 18], [0, 1], clamp);
  const fadeIn = (at: number, len = 14) => interpolate(t, [at, at + len], [0, 1], clamp);
  const rise = (at: number) => (1 - fadeIn(at)) * 8;

  return (
    <g>
      <g opacity={topologyOpacity}>
        {edges.map((e) => {
          const a = nodeById.get(e.from)!;
          const b = nodeById.get(e.to)!;
          const pa = place(project(a.u, a.v));
          const pb = place(project(b.u, b.v));
          const on = isLit(e.from) && isLit(e.to);
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={on ? colors.data : colors.lineStrong}
              strokeWidth={1.3}
            />
          );
        })}
        {nodes.map((n) => {
          const p = place(project(n.u, n.v));
          const on = isLit(n.id);
          const w = hw * S;
          const h = hh * S;
          const l = lift * S;
          const label = place(labelAnchor(n));
          return (
            <g key={n.id}>
              <polygon
                points={pts([
                  [p.x - w, p.y - l],
                  [p.x, p.y + h - l],
                  [p.x, p.y + h],
                  [p.x - w, p.y],
                ])}
                fill={colors.surface}
                stroke={colors.lineStrong}
                strokeWidth={0.8}
              />
              <polygon
                points={pts([
                  [p.x, p.y + h - l],
                  [p.x + w, p.y - l],
                  [p.x + w, p.y],
                  [p.x, p.y + h],
                ])}
                fill={colors.bg}
                stroke={colors.lineStrong}
                strokeWidth={0.8}
              />
              <polygon
                points={pts([
                  [p.x, p.y - h - l],
                  [p.x + w, p.y - l],
                  [p.x, p.y + h - l],
                  [p.x - w, p.y - l],
                ])}
                fill={on ? colors.surfaceRaised : colors.surface}
                stroke={on ? colors.data : colors.lineStrong}
                strokeWidth={on ? 1.4 : 0.8}
              />
              <text
                x={label.x}
                y={label.y + 11}
                textAnchor="middle"
                fontFamily={typography.mono}
                fontSize={11}
                fontWeight={500}
                fill={on ? colors.text : colors.muted}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </g>

      {t >= CONTRACT && (
        <g>
          {/* Edges out of the hub, in the order the mark resolves on the site */}
          {edgeSegments(MARK).map((sgm) => {
            const i = RESOLVE_ORDER.edges.findIndex((e) => e.from === sgm.from && e.to === sgm.to);
            const drawn = interpolate(t, [RESOLVE + i * 3, RESOLVE + i * 3 + 12], [0, 1], {
              ...clamp,
              easing: ease,
            });
            const a = markAt(sgm.x1, sgm.y1);
            const b = markAt(sgm.x2, sgm.y2);
            return drawn > 0 ? (
              <line
                key={`${sgm.from}-${sgm.to}`}
                x1={a.x}
                y1={a.y}
                x2={a.x + (b.x - a.x) * drawn}
                y2={a.y + (b.y - a.y) * drawn}
                stroke={colors.text}
                strokeWidth={MARK.stroke * MARK_S}
              />
            ) : null;
          })}
          {kNodes.map((n) => (
            <polygon
              key={n.id}
              points={pts([
                [n.x, n.y - n.h],
                [n.x + n.w, n.y],
                [n.x, n.y + n.h],
                [n.x - n.w, n.y],
              ])}
              fill={n.fill}
            />
          ))}
          {signal > 0 && signal < 1 && (
            <path
              d={signalPath(MARK)}
              transform={`translate(${MARK_CX - 16.5 * MARK_S} ${MARK_CY - 16 * MARK_S}) scale(${MARK_S})`}
              pathLength={1}
              fill="none"
              stroke={colors.data}
              strokeWidth={MARK.stroke}
              strokeLinejoin="bevel"
              strokeDasharray="0.16 2"
              strokeDashoffset={0.16 - signal * 1.16}
            />
          )}
        </g>
      )}

      {/* Identity: the name, the role, then the site headline */}
      <g textAnchor="middle">
        <text
          x={MARK_CX}
          y={400}
          opacity={fadeIn(NAME)}
          transform={`translate(0 ${rise(NAME)})`}
          fontFamily={typography.mono}
          fontSize={34}
          fontWeight={500}
          letterSpacing="0.3em"
          fill={colors.text}
        >
          KESHAV
        </text>
        <text
          x={MARK_CX}
          y={434}
          opacity={fadeIn(ROLE)}
          transform={`translate(0 ${rise(ROLE)})`}
          fontFamily={typography.mono}
          fontSize={13}
          letterSpacing="0.28em"
          fill={colors.muted}
        >
          SYSTEMS ENGINEER
        </text>
        <g opacity={fadeIn(HEADLINE, 18)} transform={`translate(0 ${rise(HEADLINE)})`}>
          <text
            x={MARK_CX}
            y={514}
            fontFamily={typography.sans}
            fontSize={30}
            fontWeight={600}
            letterSpacing="-0.02em"
            fill={colors.muted}
          >
            <tspan fill={colors.text}>I build systems</tspan> and investigate
          </text>
          <text
            x={MARK_CX}
            y={552}
            fontFamily={typography.sans}
            fontSize={30}
            fontWeight={600}
            letterSpacing="-0.02em"
            fill={colors.muted}
          >
            the engineering problems underneath them.
          </text>
        </g>
      </g>
    </g>
  );
}
