// ACT V — Convergence into the homepage topology, then identity.
// The topology is the web app's own data (apps/web/src/lib/topology.ts), drawn with the
// same isometric projection as the homepage, so the film ends in the site's architecture
// language rather than beside it. Identity text comes from the site: the headline and
// the "Full-Stack & Systems Engineer" title.
import { Easing, interpolate } from 'remotion';
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
import { ACTS, CONVERGES_TO, convergenceBeat, type ActId } from './timeline';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.2, 0, 0, 1);

// Beats relative to the convergence act (200 story frames).
const TOPOLOGY_IN = 60;
const IDENTITY = 134;

export function Act5Convergence() {
  const colors = useColors();
  const t = useStoryFrame() - ACTS.convergence.start;
  if (t < TOPOLOGY_IN - 10) return null;

  // Topology placement: centred while the systems converge, then to the right of the wordmark.
  const settle = interpolate(t, [IDENTITY - 6, IDENTITY + 40], [0, 1], { ...clamp, easing: ease });
  const width = interpolate(settle, [0, 1], [760, 600]);
  const cx = interpolate(settle, [0, 1], [640, 910]);
  const cy = interpolate(settle, [0, 1], [320, 330]);
  const S = width / topoFrame.width;
  const place = (p: { x: number; y: number }) => ({
    x: cx + (p.x - (topoFrame.minX + topoFrame.width / 2)) * S,
    y: cy + (p.y - (topoFrame.minY + topoFrame.height / 2)) * S,
  });
  const appear = interpolate(t, [TOPOLOGY_IN - 10, TOPOLOGY_IN + 20], [0, 1], clamp);

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
  const identity = interpolate(t, [IDENTITY, IDENTITY + 30], [0, 1], clamp);

  return (
    <g>
      <g opacity={appear}>
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
          const pts = (arr: [number, number][]) =>
            arr.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
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

      {/* Identity: the homepage hero, in the film's last frames */}
      <g opacity={identity} transform={`translate(0 ${(1 - identity) * 8})`}>
        <text
          x={64}
          y={184}
          fontFamily={typography.mono}
          fontSize={30}
          fontWeight={500}
          fill={colors.accent}
        >
          k/
        </text>
        <text
          x={110}
          y={186}
          fontFamily={typography.sans}
          fontSize={40}
          fontWeight={600}
          fill={colors.text}
          letterSpacing="-0.02em"
        >
          Keshav
        </text>
        <text
          x={64}
          y={226}
          fontFamily={typography.mono}
          fontSize={13}
          letterSpacing="0.12em"
          fill={colors.accent}
        >
          FULL-STACK &amp; SYSTEMS ENGINEER
        </text>
        {[
          ['I build systems', colors.text],
          ['and investigate the engineering', colors.muted],
          ['problems underneath them.', colors.muted],
        ].map(([line, fill], i) => (
          <text
            key={line}
            x={64}
            y={300 + i * 44}
            fontFamily={typography.sans}
            fontSize={36}
            fontWeight={600}
            letterSpacing="-0.03em"
            fill={fill}
          >
            {line}
          </text>
        ))}
        <text
          x={64}
          y={462}
          fontFamily={typography.mono}
          fontSize={12}
          letterSpacing="0.08em"
          fill={colors.faint}
        >
          BACKEND · DATA · DISTRIBUTED SYSTEMS · AI INFRASTRUCTURE
        </text>
      </g>
    </g>
  );
}
