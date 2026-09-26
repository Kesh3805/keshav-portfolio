// The Keshav mark: a K built from a handful of system nodes and edges.
//
// One geometry, used everywhere: the site components (components/brand), the static
// assets (scripts/build-brand.ts), the OG images and the Remotion end card. No
// imports, so every one of those can load it.
//
// Coordinates are on a 32-unit grid. Nodes are diamonds, the same geometry as the
// plinth tops in the homepage topology; edges are straight strokes that stop short of
// each node. At small sizes those gaps close and the silhouette reads as a solid K;
// at larger sizes the gaps separate into nodes and edges and the K reads as a topology.

export interface MarkNode {
  id: string;
  x: number;
  y: number;
  /** The one node the accent variant lights: the point where the system branches. */
  accent?: boolean;
}

export interface MarkEdge {
  from: string;
  to: string;
}

export interface MarkGeometry {
  nodes: MarkNode[];
  edges: MarkEdge[];
  /** Diamond half-diagonal, in grid units. */
  node: number;
  /** Stroke width of edges, in grid units. */
  stroke: number;
  /** Space left between an edge's end and a node's edge, in grid units. */
  gap: number;
  /** Nodes drawn without a diamond: joints where edges meet. */
  joints: string[];
}

/**
 * Chosen construction ("junction"): four endpoint nodes and one hub. Every edge leaves
 * the hub — the stem up and down, the arm and the leg out to the right — so the K is a
 * fan-out from a single service, the same shape as the homepage topology's root. The
 * hub is the accent node.
 */
export const MARK: MarkGeometry = {
  nodes: [
    { id: 'top', x: 9, y: 5 },
    { id: 'base', x: 9, y: 27 },
    { id: 'hub', x: 9, y: 16, accent: true },
    { id: 'arm', x: 24, y: 5 },
    { id: 'leg', x: 24, y: 27 },
  ],
  edges: [
    { from: 'hub', to: 'top' },
    { from: 'hub', to: 'base' },
    { from: 'hub', to: 'arm' },
    { from: 'hub', to: 'leg' },
  ],
  node: 2.9,
  stroke: 3,
  gap: 1,
  joints: [],
};

/** Below ~24px the gaps are sub-pixel noise: close them and thicken the strokes. */
export const MARK_SMALL: MarkGeometry = { ...MARK, stroke: 3.8, gap: 0, node: 3.6 };

/** The order the mark resolves in when animated: hub, endpoints, then the edges out of the hub. */
export const RESOLVE_ORDER = {
  nodes: ['hub', 'top', 'base', 'arm', 'leg'],
  edges: [
    { from: 'hub', to: 'top' },
    { from: 'hub', to: 'base' },
    { from: 'hub', to: 'arm' },
    { from: 'hub', to: 'leg' },
  ],
  /** The data signal's route through the finished K: up from the base, through the hub, out the arm. */
  signal: ['base', 'hub', 'arm'],
} as const;

const byId = (g: MarkGeometry) => new Map(g.nodes.map((n) => [n.id, n]));

/** Diamond points for a node, as an SVG points string. */
export const diamond = (x: number, y: number, r: number) =>
  `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;

/**
 * Edge segments trimmed so they stop `gap` short of each node's diamond (joints are
 * not trimmed). Returns plain numbers so any renderer (SVG, satori, Remotion) can use it.
 */
export function edgeSegments(g: MarkGeometry) {
  const nodes = byId(g);
  return g.edges.map((e) => {
    const a = nodes.get(e.from)!;
    const b = nodes.get(e.to)!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    // A diamond (|x| + |y| ≤ r) extends r / (|ux| + |uy|) from its centre along u; then the gap.
    const reach = (id: string) =>
      g.joints.includes(id) ? 0 : g.node / (Math.abs(ux) + Math.abs(uy)) + g.gap;
    const ta = reach(e.from);
    const tb = reach(e.to);
    return {
      from: e.from,
      to: e.to,
      x1: +(a.x + ux * ta).toFixed(2),
      y1: +(a.y + uy * ta).toFixed(2),
      x2: +(b.x - ux * tb).toFixed(2),
      y2: +(b.y - uy * tb).toFixed(2),
      length: +(len - ta - tb).toFixed(2),
    };
  });
}

/** Visible nodes (joints excluded), with their diamond points. */
export const nodeShapes = (g: MarkGeometry) =>
  g.nodes
    .filter((n) => !g.joints.includes(n.id))
    .map((n) => ({ ...n, points: diamond(n.x, n.y, g.node) }));

/** The mark's inner SVG markup (edges, then nodes) on the 32-unit grid. */
export function markElements(
  g: MarkGeometry,
  { color = 'currentColor', accent }: { color?: string; accent?: string } = {},
) {
  const lines = edgeSegments(g)
    .map((s) => `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}"/>`)
    .join('');
  const diamonds = nodeShapes(g)
    .map((n) => `<polygon points="${n.points}"${n.accent && accent ? ` fill="${accent}"` : ''}/>`)
    .join('');
  return `<g stroke="${color}" stroke-width="${g.stroke}">${lines}</g><g fill="${color}">${diamonds}</g>`;
}

/**
 * Self-contained SVG for the mark (asset generator, OG images). `padding` adds grid units
 * on every side; `background` fills that square, with `radius` as a fraction of its side.
 */
export function markSvg({
  size = 32,
  color = 'currentColor',
  accent,
  background,
  radius = 0.2,
  small = size <= 24,
  padding = 0,
}: {
  size?: number;
  color?: string;
  accent?: string;
  background?: string;
  radius?: number;
  small?: boolean;
  padding?: number;
} = {}) {
  const g = small ? MARK_SMALL : MARK;
  const vb = 32 + padding * 2;
  const bg = background
    ? `<rect x="${-padding}" y="${-padding}" width="${vb}" height="${vb}"${radius ? ` rx="${+(vb * radius).toFixed(2)}"` : ''} fill="${background}"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding} ${-padding} ${vb} ${vb}" width="${size}" height="${size}">` +
    bg +
    markElements(g, { color, accent }) +
    `</svg>`
  );
}

/** The mark's visible extent on the 32-unit grid (node tips included), for cropping lockups. */
export function markBounds(g: MarkGeometry = MARK) {
  const xs = g.nodes.map((n) => n.x);
  const ys = g.nodes.map((n) => n.y);
  const x = Math.min(...xs) - g.node;
  const y = Math.min(...ys) - g.node;
  return { x, y, width: Math.max(...xs) + g.node - x, height: Math.max(...ys) + g.node - y };
}

/** SVG path data for the data signal's route through the mark (node centre to node centre). */
export function signalPath(g: MarkGeometry = MARK) {
  const nodes = byId(g);
  return RESOLVE_ORDER.signal
    .map((id, i) => {
      const n = nodes.get(id)!;
      return `${i ? 'L' : 'M'}${n.x} ${n.y}`;
    })
    .join(' ');
}

/** Animation states of the inline mark (components/brand/KeshavMark.astro). */
export type MarkState = 'static' | 'idle' | 'signal' | 'resolve';
