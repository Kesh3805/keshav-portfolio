// ACT II — Asynchronous document pipeline (fintax).
// Source: content/projects/fintax.md — upload → invoice guard ("rejected before OCR")
// → GCS → LlamaIndex Cloud → signed webhook, signature verified → result mapping →
// BullMQ → core domain service → ledger; monetary maths in Decimal.js.
import {
  Chip,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  Ripple,
  useColors,
  useStoryFrame,
} from '../../primitives';

const H = 60;
const W = 200;
const ROW1 = 150;
const ROW2 = 320;
const ROW3 = 480;
const COL = [70, 330, 590, 850];

const STEPS = [
  { key: 'pdf', label: 'Invoice PDF', sub: 'upload', x: COL[0]!, y: ROW1 },
  { key: 'guard', label: 'Invoice guard', sub: 'LLM classification', x: COL[1]!, y: ROW1 },
  { key: 'gcs', label: 'GCS', sub: 'original file', x: COL[2]!, y: ROW1 },
  { key: 'ocr', label: 'LlamaIndex Cloud', sub: 'extraction', x: COL[3]!, y: ROW1 },
  { key: 'hook', label: 'Signed webhook', sub: 'signature verified', x: COL[3]!, y: ROW2 },
  { key: 'map', label: 'Result mapping', sub: 'extraction worker', x: COL[2]!, y: ROW2 },
  { key: 'queue', label: 'BullMQ', sub: 'worker → core', x: COL[1]!, y: ROW2 },
  { key: 'core', label: 'Core service', sub: 'ledger domain', x: COL[0]!, y: ROW2 },
] as const;

const LEDGER = { x: COL[0]!, y: ROW3, w: 460, h: 70 };

const mid = (s: { x: number; y: number }) => ({ x: s.x + W / 2, y: s.y + H / 2 });

// The document's path, centre to centre, snaking through both rows and down to the ledger.
const PATH: Pt[] = [...STEPS.map(mid), { x: COL[0]! + W / 2, y: LEDGER.y + LEDGER.h / 2 }];

const TRAVEL_START = 64;
const SEG = 18;
const arrival = (i: number) => TRAVEL_START + i * SEG;

export function Act2DocumentAiPipeline({ start }: { start: number }) {
  const colors = useColors();
  const frame = useStoryFrame() - start;
  const at = (n: number) => start + n;

  return (
    <g>
      {PATH.slice(1).map((p, i) => (
        <Edge
          key={`e${i}`}
          points={[PATH[i]!, p]}
          enter={at(20 + i * 5)}
          arrow
          tone={frame >= arrival(i + 1) ? 'data' : 'default'}
        />
      ))}

      {STEPS.map((s, i) => (
        <Node
          key={s.key}
          x={s.x}
          y={s.y}
          w={W}
          h={H}
          label={s.label}
          sub={s.sub}
          enter={at(8 + i * 5)}
          tone={
            frame >= arrival(i) && frame < arrival(i) + SEG + 6
              ? s.key === 'hook'
                ? 'ok'
                : 'data'
              : 'default'
          }
        />
      ))}
      <Node
        {...LEDGER}
        label="Ledger · PostgreSQL"
        sub="structured invoice data · Decimal.js tax maths"
        labelSize={16}
        enter={at(50)}
        tone={frame >= arrival(STEPS.length) ? 'ok' : 'default'}
        intense={frame >= arrival(STEPS.length) && frame < arrival(STEPS.length) + 30}
      />

      {/* One document, moving at constant speed through each stage */}
      {PATH.slice(1).map((p, i) => (
        <Packet
          key={`p${i}`}
          points={[PATH[i]!, p]}
          from={at(arrival(i))}
          duration={SEG}
          tone="data"
          label={i === 0 ? 'invoice' : undefined}
          trail={6}
          impact={i === PATH.length - 2}
        />
      ))}

      {/* What the guard stops, and what each boundary proves */}
      <Chip
        x={COL[1]!}
        y={ROW1 + H + 14}
        text="non-invoice → rejected before OCR"
        tone="warning"
        enter={at(arrival(1))}
        exit={at(arrival(4))}
      />
      <Chip
        x={COL[3]!}
        y={ROW2 + H + 14}
        text="signature verified"
        tone="ok"
        enter={at(arrival(4))}
        glow
      />
      <Ripple x={COL[3]! + W / 2} y={ROW2 + H / 2} at={at(arrival(4))} tone="ok" radius={44} />
      <Chip
        x={COL[1]!}
        y={ROW2 + H + 14}
        text="async hand-off"
        tone="data"
        enter={at(arrival(6))}
        exit={at(250)}
      />

      <Label
        x={1210}
        y={600}
        anchor="end"
        enter={at(232)}
        color={colors.text}
        size={24}
        mono={false}
        weight={600}
      >
        From document ingestion to structured ledger data.
      </Label>
    </g>
  );
}
