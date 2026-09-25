import { useCurrentFrame } from 'remotion';
import {
  Captions,
  Chip,
  useColors,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  Stage,
} from '../primitives';

export const GST_RETURNS_DURATION = 480;

const SRC = { x: 64, y: 300, w: 170, h: 64 };
const STORE_X = 340;
const STORE_W = 210;
const STORE_H = 56;
const stores = [
  { label: 'Books', sub: 'purchase ledger', y: 150 },
  { label: 'IMS', sub: 'GST portal sync', y: 236 },
  { label: 'GSTR-2B', sub: 'per-invoice rows', y: 322 },
  { label: 'GSTR-1 · GSTR-3B', sub: 'filing writers', y: 408 },
].map((s) => ({ ...s, cy: s.y + STORE_H / 2 }));

const M9 = { x: 680, y: 190, w: 230, h: 64 };
const SSE = { x: 1010, y: 190, w: 206, h: 64 };
const PROJ = { x: 680, y: 404, w: 270, h: 64 };
const API = { x: 1010, y: 404, w: 206, h: 64 };

const srcToStore = (cy: number): Pt[] => [
  { x: SRC.x + SRC.w, y: SRC.y + SRC.h / 2 },
  { x: 287, y: SRC.y + SRC.h / 2 },
  { x: 287, y: cy },
  { x: STORE_X, y: cy },
];
const storeToM9 = (cy: number): Pt[] => [
  { x: STORE_X + STORE_W, y: cy },
  { x: 615, y: cy },
  { x: 615, y: M9.y + M9.h / 2 },
  { x: M9.x, y: M9.y + M9.h / 2 },
];
const m9ToSse: Pt[] = [
  { x: M9.x + M9.w, y: 222 },
  { x: SSE.x, y: 222 },
];
const writersToProjection: Pt[] = [
  { x: STORE_X + STORE_W, y: 436 },
  { x: PROJ.x, y: 436 },
];
const apiToProjection: Pt[] = [
  { x: API.x, y: 436 },
  { x: PROJ.x + PROJ.w, y: 436 },
];
// The runtime path the projection replaced: back through the sources on every request.
const beforePath: Pt[] = [
  { x: API.x + API.w / 2, y: API.y + API.h },
  { x: API.x + API.w / 2, y: 570 },
  { x: 445, y: 570 },
  { x: 445, y: 470 },
];

const classifications = [
  { text: 'EXACT', tone: 'ok', x: 680, y: 270 },
  { text: 'MISMATCH', tone: 'error', x: 746, y: 270 },
  { text: 'DRIFT', tone: 'accent', x: 836, y: 270 },
  { text: 'MISSING_IN_2B', tone: 'default', x: 680, y: 302 },
  { text: 'MISSING_IN_BOOKS', tone: 'default', x: 809, y: 302 },
] as const;

export function GstReturnsArchitecture() {
  const colors = useColors();
  const frame = useCurrentFrame();
  const projectionHot = [320, 350].some((t) => frame >= t && frame < t + 16);
  // The old path fades to a ghost so the final frame still shows what was replaced.
  const beforeFade = frame < 420 ? 1 : Math.max(0.22, 1 - (frame - 420) / 14);

  return (
    <Stage figure="Fig. 1 — GST returns" title="From GST data to a fast read model">
      <Node {...SRC} label="GST data" sub="invoices · portal" enter={12} tone="accent" />

      {stores.map((s, i) => (
        <g key={s.label}>
          <Edge points={srcToStore(s.cy)} enter={58 + i * 10} />
          <Node
            x={STORE_X}
            y={s.y}
            w={STORE_W}
            h={STORE_H}
            label={s.label}
            sub={s.sub}
            enter={48 + i * 12}
          />
          <Packet points={srcToStore(s.cy)} from={92 + i * 8} duration={26} tone="data" />
        </g>
      ))}

      {/* M9 three-way reconciliation */}
      {stores.slice(0, 3).map((s, i) => (
        <g key={`m9-${s.label}`}>
          <Edge points={storeToM9(s.cy)} enter={162 + i * 6} />
          <Packet points={storeToM9(s.cy)} from={180 + i * 6} duration={24} tone="data" />
        </g>
      ))}
      <Node
        {...M9}
        label="M9 reconciliation"
        sub="books × IMS × 2B"
        enter={152}
        tone={frame >= 200 && frame < 270 ? 'accent' : 'default'}
      />
      {classifications.map((c, i) => (
        <Chip key={c.text} x={c.x} y={c.y} text={c.text} tone={c.tone} enter={210 + i * 7} />
      ))}
      <Edge points={m9ToSse} enter={244} />
      <Node {...SSE} label="SSE → client" sub="queued · async result" enter={240} />
      <Packet points={m9ToSse} from={252} duration={20} tone="accent" />

      {/* Domain events keep the projection fresh */}
      <Edge points={writersToProjection} enter={282} tone="accent" />
      <Node
        {...PROJ}
        label="returns projection"
        sub="precomputed status"
        enter={272}
        tone={projectionHot ? 'accent' : 'default'}
      />
      <Packet
        points={writersToProjection}
        from={296}
        duration={26}
        tone="accent"
        label="source-changed event"
      />
      <Packet points={writersToProjection} from={326} duration={26} tone="accent" />

      {/* Read path: before and after */}
      <Node {...API} label="Returns read API" sub="returns dashboard" enter={362} />
      <g opacity={beforeFade}>
        <Edge points={beforePath} enter={372} tone="error" dashed arrow={false} />
        <Packet points={beforePath} from={380} duration={44} tone="error" radius={5} />
        <Label x={620} y={596} enter={378} color={colors.error}>
          before · 3,000ms+
        </Label>
      </g>
      <Edge points={apiToProjection} enter={432} tone="ok" />
      <Packet points={apiToProjection} from={444} duration={8} tone="ok" hold={10} />
      <Label x={1216} y={500} enter={446} color={colors.ok} size={14} anchor="end">
        after · sub-15ms at peak load
      </Label>

      <Label
        x={1216}
        y={620}
        enter={456}
        anchor="end"
        color={colors.text}
        size={22}
        mono={false}
        weight={600}
      >
        Read what is already computed.
      </Label>

      <Captions
        end={480}
        beats={[
          { from: 10, text: 'GST data enters the platform from invoices and the GST portal.' },
          {
            from: 70,
            text: 'It lands in four stores: Books, IMS, GSTR-2B and the GSTR-1 / GSTR-3B filings.',
          },
          {
            from: 160,
            text: 'M9 matches Books, IMS and GSTR-2B, classifies every document, and reports over SSE.',
          },
          {
            from: 280,
            text: 'Filing writers emit source-changed events; the projection updates per change.',
          },
          {
            from: 364,
            text: 'The returns read API serves the projection instead of walking the sources.',
          },
        ]}
      />
    </Stage>
  );
}
