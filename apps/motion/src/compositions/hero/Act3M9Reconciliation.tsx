// ACT III — M9 reconciliation, then the returns read model (fintax).
// Sources: content/projects/fintax.md — M9 matches the purchase register against IMS
// and GSTR-2B, classifies EXACT / MISMATCH / MISSING_IN_2B / MISSING_IN_BOOKS / DRIFT,
// queued async, result over SSE; returns status served from a precomputed projection kept
// fresh by source-changed events from GSTR-1/GSTR-3B writers: 3,000ms+ → <15ms at peak load.
import {
  Chip,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  Ripple,
  type Tone,
  typography,
  useColors,
  useStoryFrame,
} from '../../primitives';

const H = 60;

// ── Upper view: reconciliation (local y 110–560)
const SOURCES = [
  { label: 'Purchase books', sub: 'purchase register', y: 170 },
  { label: 'IMS', sub: 'GST portal sync', y: 290 },
  { label: 'GSTR-2B', sub: 'per-invoice rows', y: 410 },
];
const SRC_X = 70;
const SRC_W = 210;
const M9 = { x: 440, y: 280, w: 240, h: 80 };
const STATES: { text: string; tone: Tone }[] = [
  { text: 'EXACT', tone: 'ok' },
  { text: 'MISMATCH', tone: 'error' },
  { text: 'MISSING_IN_2B', tone: 'warning' },
  { text: 'MISSING_IN_BOOKS', tone: 'warning' },
  { text: 'DRIFT', tone: 'accent' },
];
const SSE = { x: 1010, y: 290, w: 200 };

// ── Lower view: read model (local y 560–1000)
const READ_API = { x: 70, y: 640, w: 210 };
const G1 = { x: 470, y: 600, w: 200 };
const G3 = { x: 470, y: 700, w: 200 };
const WRITERS = { x: 70, y: 860, w: 230 };
const PROJ = { x: 420, y: 850, w: 280, h: 80 };
const API_AFTER = { x: 830, y: 860, w: 210 };

// Beats relative to act start.
const DOCS = 30;
const CLASSIFY = 96;
const TO_SSE = 158;
const BEFORE = 206;
const SLOW = 246;
const AFTER = 262;
const FAST = 296;

export function Act3M9Reconciliation({ start }: { start: number }) {
  const colors = useColors();
  const frame = useStoryFrame() - start;
  const at = (n: number) => start + n;
  // The reconciliation view recedes while the camera moves down to the read model.
  const upper = frame < 160 ? 1 : Math.max(0.2, 1 - (frame - 160) / 40);

  const srcOut = (y: number): Pt => ({ x: SRC_X + SRC_W, y: y + H / 2 });
  const toM9 = (y: number): Pt[] => [
    srcOut(y),
    { x: 380, y: y + H / 2 },
    { x: 380, y: 320 },
    { x: M9.x, y: 320 },
  ];

  return (
    <g>
      <g opacity={upper}>
        {/* Three streams into one reconciliation */}
        {SOURCES.map((s, i) => (
          <g key={s.label}>
            <Edge points={toM9(s.y)} enter={at(14 + i * 5)} arrow />
            <Node
              x={SRC_X}
              y={s.y}
              w={SRC_W}
              h={H}
              label={s.label}
              sub={s.sub}
              enter={at(6 + i * 5)}
              tone={frame >= DOCS && frame < CLASSIFY ? 'data' : 'default'}
            />
            {[0, 1].map((k) => (
              <Packet
                key={k}
                points={toM9(s.y)}
                from={at(DOCS + i * 8 + k * 22)}
                duration={30}
                tone="data"
                trail={6}
                impact={false}
              />
            ))}
          </g>
        ))}
        <Node
          {...M9}
          label="M9 reconciliation"
          sub="books × IMS × 2B · queued"
          labelSize={16}
          enter={at(18)}
          tone={frame >= 86 && frame < TO_SSE ? 'accent' : 'default'}
          intense={frame >= CLASSIFY - 6 && frame < CLASSIFY + 40}
        />
        <Ripple
          x={M9.x + M9.w / 2}
          y={M9.y + M9.h / 2}
          at={at(CLASSIFY - 6)}
          tone="accent"
          radius={70}
          rings={2}
        />
        {STATES.map((s, i) => (
          <Chip
            key={s.text}
            x={740}
            y={170 + i * 50}
            text={s.text}
            tone={s.tone}
            enter={at(CLASSIFY + i * 10)}
          />
        ))}
        <Edge
          points={[
            { x: M9.x + M9.w, y: 320 },
            { x: 720, y: 320 },
          ]}
          enter={at(CLASSIFY - 4)}
          tone="accent"
        />
        <Edge
          points={[
            { x: 930, y: 320 },
            { x: SSE.x, y: 320 },
          ]}
          enter={at(TO_SSE - 6)}
          arrow
          tone="data"
        />
        <Node
          {...SSE}
          h={H}
          label="SSE → reviewer"
          sub="async result"
          enter={at(TO_SSE - 10)}
          tone={frame >= TO_SSE + 16 ? 'data' : 'default'}
        />
        <Packet
          points={[
            { x: 930, y: 320 },
            { x: SSE.x, y: 320 },
          ]}
          from={at(TO_SSE)}
          duration={16}
          tone="data"
          label="classification"
        />
        <Label x={740} y={440} enter={at(140)} color={colors.faint}>
          EVERY DOCUMENT CLASSIFIED · ONE GSTIN AND PERIOD
        </Label>
      </g>

      {/* ── Read model: before */}
      <Label x={70} y={600} enter={at(BEFORE - 10)} color={colors.error}>
        BEFORE · ASSEMBLED ON EVERY READ
      </Label>
      <Node
        {...READ_API}
        h={H}
        label="Returns read API"
        sub="derives status"
        enter={at(BEFORE)}
        tone={frame >= BEFORE && frame < AFTER ? 'error' : 'dim'}
      />
      <Node {...G1} h={H} label="GSTR-1" sub="outward supplies" enter={at(BEFORE + 4)} />
      <Node {...G3} h={H} label="GSTR-3B" sub="summary return" enter={at(BEFORE + 8)} />
      <Edge
        points={[
          { x: READ_API.x + READ_API.w, y: 660 },
          { x: 400, y: 660 },
          { x: 400, y: 630 },
          { x: G1.x, y: 630 },
        ]}
        enter={at(BEFORE + 6)}
        dashed
      />
      <Edge
        points={[
          { x: READ_API.x + READ_API.w, y: 680 },
          { x: 400, y: 680 },
          { x: 400, y: 730 },
          { x: G3.x, y: 730 },
        ]}
        enter={at(BEFORE + 8)}
        dashed
      />
      {/* Slow: every read walks the sources */}
      <Packet
        points={[
          { x: 280, y: 660 },
          { x: 400, y: 660 },
          { x: 400, y: 630 },
          { x: G1.x, y: 630 },
        ]}
        from={at(BEFORE + 12)}
        duration={16}
        tone="error"
        trail={4}
        impact={false}
      />
      <Packet
        points={[
          { x: 280, y: 680 },
          { x: 400, y: 680 },
          { x: 400, y: 730 },
          { x: G3.x, y: 730 },
        ]}
        from={at(BEFORE + 12)}
        duration={16}
        tone="error"
        trail={4}
        impact={false}
      />
      <Packet
        points={[
          { x: G1.x, y: 630 },
          { x: 400, y: 630 },
          { x: 400, y: 660 },
          { x: 280, y: 660 },
        ]}
        from={at(BEFORE + 30)}
        duration={16}
        tone="error"
        trail={4}
        impact={false}
      />
      <text
        x={780}
        y={690}
        fontFamily={typography.mono}
        fontSize={48}
        fontWeight={500}
        fill={colors.error}
        opacity={frame >= SLOW ? 1 : 0}
      >
        3,000ms+
      </text>

      {/* ── Read model: after */}
      <Label x={70} y={830} enter={at(AFTER - 6)} color={colors.ok}>
        AFTER · READ WHAT IS ALREADY COMPUTED
      </Label>
      <Node {...WRITERS} h={H} label="GSTR-1 · GSTR-3B" sub="filing writers" enter={at(AFTER)} />
      <Node
        {...PROJ}
        label="Returns status projection"
        sub="precomputed per GSTIN × period"
        labelSize={15}
        enter={at(AFTER + 4)}
        tone={frame >= AFTER + 20 ? 'data' : 'default'}
      />
      <Node
        {...API_AFTER}
        h={H}
        label="Returns read API"
        sub="one indexed read"
        enter={at(AFTER + 8)}
        tone={frame >= FAST ? 'ok' : 'default'}
      />
      <Edge
        points={[
          { x: WRITERS.x + WRITERS.w, y: 890 },
          { x: PROJ.x, y: 890 },
        ]}
        enter={at(AFTER + 6)}
        arrow
        tone="data"
      />
      <Edge
        points={[
          { x: API_AFTER.x, y: 890 },
          { x: PROJ.x + PROJ.w, y: 890 },
        ]}
        enter={at(AFTER + 10)}
        arrow
      />
      <Packet
        points={[
          { x: WRITERS.x + WRITERS.w, y: 890 },
          { x: PROJ.x, y: 890 },
        ]}
        from={at(AFTER + 10)}
        duration={14}
        tone="data"
        label="source-changed"
      />
      <Packet
        points={[
          { x: API_AFTER.x, y: 890 },
          { x: PROJ.x + PROJ.w, y: 890 },
        ]}
        from={at(FAST - 12)}
        duration={5}
        tone="ok"
        impact={false}
      />
      <Packet
        points={[
          { x: PROJ.x + PROJ.w, y: 890 },
          { x: API_AFTER.x, y: 890 },
        ]}
        from={at(FAST - 6)}
        duration={5}
        tone="ok"
      />
      <text
        x={830}
        y={990}
        fontFamily={typography.mono}
        fontSize={48}
        fontWeight={500}
        fill={colors.ok}
        opacity={frame >= FAST ? 1 : 0}
      >
        {'<15ms'}
      </text>
      <Label x={830} y={1016} enter={at(FAST + 2)} color={colors.muted} size={14}>
        at peak load · was 3,000ms+
      </Label>
      <Ripple x={API_AFTER.x + 105} y={890} at={at(FAST)} tone="ok" radius={50} />
    </g>
  );
}
