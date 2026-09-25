import {
  Captions,
  Chip,
  Dissolve,
  Edge,
  Label,
  Node,
  Packet,
  pointAt,
  type Pt,
  Ripple,
  RollingNumber,
  Stage,
  useColors,
  useStoryFrame,
} from '../primitives';

/** Story frames (see motion-tokens `story`); rendered at 60 fps over 12 s. */
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

// Beats (story frames)
const STORE_HIT = (i: number) => 118 + i * 8;
const BEFORE_START = 380;
const SHATTER = 424;
const AFTER_START = 438;

export function GstReturnsArchitecture() {
  const colors = useColors();
  const frame = useStoryFrame();
  const projectionHot = [322, 352].some((t) => frame >= t && frame < t + 16);
  // The old path fades to a ghost so the final frame still shows what was replaced.
  const beforeFade = frame < SHATTER ? 1 : Math.max(0.18, 1 - (frame - SHATTER) / 10);

  return (
    <Stage figure="Fig. 1 — GST returns" title="From GST data to a fast read model">
      <Node {...SRC} label="GST data" sub="invoices · portal" enter={12} tone="accent" />

      {/* Input bus: each store lights as its data lands */}
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
            tone={frame >= STORE_HIT(i) && frame < STORE_HIT(i) + 20 ? 'data' : 'default'}
          />
          <Packet points={srcToStore(s.cy)} from={92 + i * 8} duration={26} tone="data" />
        </g>
      ))}

      {/* M9 three-way reconciliation */}
      {stores.slice(0, 3).map((s, i) => (
        <g key={`m9-${s.label}`}>
          <Edge points={storeToM9(s.cy)} enter={162 + i * 6} />
          <Packet
            points={storeToM9(s.cy)}
            from={180 + i * 6}
            duration={24}
            tone="data"
            impact={i === 2}
          />
        </g>
      ))}
      <Node
        {...M9}
        label="M9 reconciliation"
        sub="books × IMS × 2B"
        enter={152}
        tone={frame >= 204 && frame < 270 ? 'accent' : 'default'}
      />
      {classifications.map((c, i) => (
        <Chip key={c.text} x={c.x} y={c.y} text={c.text} tone={c.tone} enter={212 + i * 6} />
      ))}
      <Edge points={m9ToSse} enter={244} />
      <Node {...SSE} label="SSE → client" sub="queued · async result" enter={240} />
      <Packet points={m9ToSse} from={252} duration={20} tone="accent" label="result" />

      {/* Domain events keep the projection fresh */}
      <Edge points={writersToProjection} enter={282} tone="accent" glow />
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
        label="source-changed"
      />
      <Packet points={writersToProjection} from={326} duration={26} tone="accent" />

      {/* Read path: the old runtime walk, then the projection read */}
      <Node
        {...API}
        label="Returns read API"
        sub="returns dashboard"
        enter={362}
        tone={frame >= AFTER_START + 8 ? 'ok' : frame >= BEFORE_START ? 'error' : 'default'}
      />
      <g opacity={beforeFade}>
        <Edge points={beforePath} enter={372} tone="error" dashed arrow={false} />
        <Packet
          points={beforePath}
          from={BEFORE_START}
          duration={44}
          tone="error"
          impact={false}
          trail={4}
        />
        <Label x={470} y={520} enter={378} color={colors.faint}>
          BEFORE · WALK THE SOURCES
        </Label>
        <RollingNumber
          x={470}
          y={550}
          from={0}
          to={3000}
          start={BEFORE_START}
          duration={44}
          size={22}
          color={colors.error}
          suffix="ms+"
          suffixAt={BEFORE_START + 40}
        />
      </g>
      {[0.12, 0.3, 0.5, 0.7, 0.9].map((t) => {
        const p = pointAt(beforePath, t);
        return (
          <Dissolve key={t} x={p.x} y={p.y} at={SHATTER} tone="error" count={10} spread={26} />
        );
      })}

      <Edge points={apiToProjection} enter={AFTER_START - 6} tone="ok" glow width={2} />
      <Packet
        points={apiToProjection}
        from={AFTER_START}
        duration={7}
        tone="ok"
        hold={8}
        trail={10}
        label="query"
      />
      <Ripple x={PROJ.x + PROJ.w} y={436} at={AFTER_START + 7} tone="ok" radius={46} rings={2} />
      <Label x={1216} y={494} enter={AFTER_START} anchor="end" color={colors.faint}>
        AFTER · PEAK LOAD
      </Label>
      <g opacity={frame >= AFTER_START + 4 ? 1 : 0}>
        <RollingNumber
          x={1216}
          y={524}
          from={3000}
          to={15}
          start={AFTER_START + 4}
          duration={14}
          size={26}
          anchor="end"
          color={colors.ok}
          prefix="<"
          prefixAt={AFTER_START + 16}
          suffix="ms"
          glow
        />
      </g>

      <Label
        x={1216}
        y={620}
        enter={458}
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
            text: 'The returns read API serves the projection: 3,000ms+ before, sub-15ms at peak load.',
          },
        ]}
      />
    </Stage>
  );
}
