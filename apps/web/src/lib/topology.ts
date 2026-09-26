/**
 * The homepage topology: the shared building blocks behind the projects, and
 * the relationships between them that the project write-ups document.
 *
 * Every node → project link carries `evidence`, a pattern that must match that
 * project's own Markdown (checked in tests/topology.test.ts), so the diagram
 * cannot claim a technology a write-up does not mention.
 *
 * Positions are plan coordinates: `u` runs left → right on screen, `v` is
 * depth (towards the viewer). `project()` maps them to the isometric view the
 * WebGL scene and the SVG fallback both use.
 */

export interface TopologyNode {
  id: string;
  label: string;
  /** Short secondary label shown under the name. */
  note: string;
  /** One or two sentences of architectural context, paraphrased from the write-ups. */
  context: string;
  projects: { slug: string; evidence: RegExp }[];
  u: number;
  v: number;
}

export interface TopologyEdge {
  from: string;
  to: string;
  /** Draw a direction marker (only where the write-ups show a one-way flow). */
  directed: boolean;
  /** Where the relationship is documented: a pattern that must match that project's write-up. */
  source: { slug: string; evidence: RegExp };
}

export const nodes: TopologyNode[] = [
  {
    id: 'client',
    label: 'Web client',
    note: 'REST · JWT',
    context:
      'Browser clients call the services over REST with JWT auth and receive long-running results back over SSE.',
    projects: [
      { slug: 'fintax', evidence: /Web client/ },
      { slug: 'questqr', evidence: /Live dashboard/ },
    ],
    u: -5.6,
    v: 0,
  },
  {
    id: 'api',
    label: 'NestJS API',
    note: 'services · guards',
    context:
      'NestJS services own the domain: ledgers and returns, campaign scans, marketplace admin, chat context, visit ingestion.',
    projects: [
      { slug: 'fintax', evidence: /NestJS/ },
      { slug: 'questqr', evidence: /NestJS/ },
      { slug: 'groupkart', evidence: /NestJS/ },
      { slug: 'pax-ai', evidence: /NestJS/ },
      { slug: 'dhvvs', evidence: /NestJS/ },
    ],
    u: -2.4,
    v: 0,
  },
  {
    id: 'sse',
    label: 'SSE stream',
    note: 'heartbeat · replay',
    context:
      'Results of async work reach the browser over SSE: a durable notification stream with Last-Event-ID replay, and live inventory stats.',
    projects: [
      { slug: 'fintax', evidence: /durable SSE stream/ },
      { slug: 'questqr', evidence: /SSE inventory stats/ },
    ],
    u: -4.0,
    v: 4.4,
  },
  {
    id: 'redis',
    label: 'Redis',
    note: 'sessions · locks',
    context:
      'Sessions, cache and locks. A Redis lock serialises concurrent redemptions and OTP verification so neither is granted twice.',
    projects: [
      { slug: 'fintax', evidence: /Redis lock/ },
      { slug: 'questqr', evidence: /Redis lock/ },
      { slug: 'dhvvs', evidence: /Redis/ },
    ],
    u: 1.0,
    v: -6.6,
  },
  {
    id: 'mysql',
    label: 'MySQL',
    note: 'TypeORM',
    context:
      'Relational store behind the campaign platform and the marketplace admin, accessed through TypeORM entities.',
    projects: [
      { slug: 'questqr', evidence: /MySQL/ },
      { slug: 'groupkart', evidence: /MySQL/ },
    ],
    u: 1.0,
    v: -2.2,
  },
  {
    id: 'postgres',
    label: 'PostgreSQL',
    note: 'source of truth',
    context:
      'Transactional source of truth: ledgers and filing state, verified visit records, and the memory tiers behind retrieval.',
    projects: [
      { slug: 'fintax', evidence: /PostgreSQL/ },
      { slug: 'dhvvs', evidence: /PostgreSQL/ },
      { slug: 'bara', evidence: /PostgreSQL/ },
    ],
    u: 1.0,
    v: 2.2,
  },
  {
    id: 'bullmq',
    label: 'BullMQ',
    note: 'async jobs',
    context:
      'Queues between services: OCR results flow back to the core service, and fraud scoring and anchoring run as async jobs.',
    projects: [
      { slug: 'fintax', evidence: /BullMQ/ },
      { slug: 'dhvvs', evidence: /BullMQ/ },
    ],
    u: 1.0,
    v: 6.6,
  },
  {
    id: 'worker',
    label: 'Workers',
    note: 'extraction · scoring',
    context:
      'Out-of-request work: the document extraction worker, and the fraud-scoring worker that isolates flagged visits before payment.',
    projects: [
      { slug: 'fintax', evidence: /Extraction worker/ },
      { slug: 'dhvvs', evidence: /Fraud scoring worker/ },
    ],
    u: 4.2,
    v: 6.6,
  },
  {
    id: 'memory',
    label: 'Memory',
    note: 'pgvector · episodic',
    context:
      'Past interactions stored as embeddings in pgvector — one of the memory tiers retrieval may, or may not, be allowed to read.',
    projects: [{ slug: 'bara', evidence: /pgvector/ }],
    u: 4.2,
    v: 2.2,
  },
  {
    id: 'ai',
    label: 'AI pipeline',
    note: 'OCR · LLM · ML',
    context:
      'Model calls at the edge of the system: invoice OCR, entity-grounded prompts, gated retrieval before an LLM, and forensic classifiers.',
    projects: [
      { slug: 'fintax', evidence: /LlamaIndex/ },
      { slug: 'pax-ai', evidence: /LLM prompt construction/ },
      { slug: 'bara', evidence: /Multi-provider LLM client/ },
      { slug: 'acfs', evidence: /ViT \/ DeiT classifier/ },
    ],
    u: 7.2,
    v: 4.4,
  },
];

export const edges: TopologyEdge[] = [
  {
    from: 'client',
    to: 'api',
    directed: true,
    source: { slug: 'fintax', evidence: /Web client\] -->\|REST/ },
  },
  {
    from: 'api',
    to: 'redis',
    directed: false,
    source: { slug: 'fintax', evidence: /Modules --> Redis/ },
  },
  {
    from: 'api',
    to: 'mysql',
    directed: false,
    source: { slug: 'groupkart', evidence: /generated from the live production MySQL schema/ },
  },
  {
    from: 'api',
    to: 'postgres',
    directed: false,
    source: { slug: 'fintax', evidence: /--> PG\[\(PostgreSQL/ },
  },
  {
    from: 'api',
    to: 'bullmq',
    directed: false,
    source: { slug: 'dhvvs', evidence: /API --> Q\[\[BullMQ/ },
  },
  {
    from: 'bullmq',
    to: 'worker',
    directed: false,
    source: { slug: 'dhvvs', evidence: /Q --> Fraud\[Fraud scoring worker/ },
  },
  {
    from: 'worker',
    to: 'ai',
    directed: false,
    source: { slug: 'fintax', evidence: /Intake --> Llama\[LlamaIndex Cloud/ },
  },
  {
    from: 'postgres',
    to: 'memory',
    directed: false,
    source: { slug: 'bara', evidence: /PostgreSQL · pgvector/ },
  },
  {
    from: 'memory',
    to: 'ai',
    directed: true,
    source: { slug: 'bara', evidence: /Retrieval --> LLM/ },
  },
  {
    from: 'api',
    to: 'sse',
    directed: true,
    source: { slug: 'fintax', evidence: /API --> Store\[\(durable notification store/ },
  },
  {
    from: 'sse',
    to: 'client',
    directed: true,
    source: { slug: 'fintax', evidence: /Store -->\|SSE stream\| Client/ },
  },
];

/**
 * The one signal the hero plays: an extracted invoice result travelling back
 * to the reviewer (fintax.md: worker → BullMQ → core service → SSE → client).
 */
export const signalPath = ['ai', 'worker', 'bullmq', 'api', 'sse', 'client'];

export const nodeById = new Map(nodes.map((n) => [n.id, n]));

/** The emphasised node and its direct neighbours; everything else recedes. */
export const nearSet = (id: string | null) => new Set(id ? [id, ...neighbours(id)] : []);

/** The detail announced with a topology selection: the node and the projects it appears in. */
export const selectionDetail = (id: string | null) => ({
  id,
  projects: id ? (nodeById.get(id)?.projects.map((p) => p.slug) ?? []) : [],
});

export const neighbours = (id: string) =>
  edges.filter((e) => e.from === id || e.to === id).map((e) => (e.from === id ? e.to : e.from));

/** Plan (u, v) → world (x, z) for a camera looking along (-1, -1, -1). */
export const toWorld = (u: number, v: number) => ({
  x: (u + v) / Math.SQRT2,
  z: (v - u) / Math.SQRT2,
});

/** Isometric screen projection of plan coordinates, `y` up; returns unit-less screen x/y (y down). */
export const project = (u: number, v: number, y = 0) => ({
  x: u,
  y: v / Math.sqrt(3) - y * Math.sqrt(2 / 3),
});

/** Node plinth: half the footprint side and the height, in world units. */
export const PLINTH = { half: 0.62, height: 0.28 };

/** Screen-space size of a plinth: diamond half-width/half-height and how far the top face is lifted. */
export const plinthScreen = {
  halfWidth: PLINTH.half * Math.SQRT2,
  halfHeight: (PLINTH.half * Math.SQRT2) / Math.sqrt(3),
  lift: PLINTH.height * Math.sqrt(2 / 3),
};

/** Where each node's label sits: centred under the plinth. */
export const labelAnchor = (n: TopologyNode) => {
  const p = project(n.u, n.v);
  return { x: p.x, y: p.y + plinthScreen.halfHeight + 0.14 };
};

/** The framed region (screen units) that the SVG viewBox and the orthographic camera share. */
export const frame = (() => {
  const xs = nodes.map((n) => project(n.u, n.v).x);
  const ys = nodes.map((n) => project(n.u, n.v).y);
  const minX = Math.min(...xs) - plinthScreen.halfWidth - 0.55;
  const maxX = Math.max(...xs) + plinthScreen.halfWidth + 0.55;
  const minY = Math.min(...ys) - plinthScreen.halfHeight - plinthScreen.lift - 0.45;
  const maxY = Math.max(...ys) + plinthScreen.halfHeight + 1.25;
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
})();

/** Screen point → percentage of the frame, for positioning HTML over the diagram. */
export const toPercent = (p: { x: number; y: number }) => ({
  left: ((p.x - frame.minX) / frame.width) * 100,
  top: ((p.y - frame.minY) / frame.height) * 100,
});
