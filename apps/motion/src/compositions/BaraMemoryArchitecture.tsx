import { interpolate, useCurrentFrame } from 'remotion';
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

export const BARA_DURATION = 480;

const PX = 64;
const PW = 280;
const PH = 50;
const py = (i: number) => 118 + i * 70;
const pcx = PX + PW / 2;
const pipeline = [
  'User message',
  'Behavior classification',
  'Topic threading',
  'Policy',
  'Selective retrieval',
  'LLM',
  'Response',
];

const TX = 760;
const TW = 456;
const TH = 86;
const tiers = [
  { label: 'Research memory', sub: 'decisions · hypotheses · concept graph', y: 130 },
  { label: 'Conversational state', sub: 'tone · precision mode · active threads', y: 236 },
  { label: 'Semantic profile', sub: 'identity · preferences · expertise', y: 342 },
  { label: 'Episodic memory', sub: 'past interactions · pgvector', y: 448 },
].map((t) => ({ ...t, cy: t.y + TH / 2 }));
const RETRIEVED = new Set([0, 3]);

const GATES = 41;
const COLS = 14;
const GX = 400;
const GY = 318;
const OPEN_ON_SECOND = new Set([2, 9, 17, 23, 30, 36]);

const down = (i: number): Pt[] => [
  { x: pcx, y: py(i) + PH },
  { x: pcx, y: py(i + 1) },
];
const bypass: Pt[] = [
  { x: PX + PW, y: py(3) + PH / 2 },
  { x: 372, y: py(3) + PH / 2 },
  { x: 372, y: py(5) + PH / 2 },
  { x: PX + PW, y: py(5) + PH / 2 },
];
const toTier = (cy: number): Pt[] => [
  { x: PX + PW, y: py(4) + PH / 2 },
  { x: 720, y: py(4) + PH / 2 },
  { x: 720, y: cy },
  { x: TX, y: cy },
];

const pick = (frame: number, steps: [number, string][]) =>
  steps.reduce((value, [from, text]) => (frame >= from ? text : value), '');

function GateMatrix({ evalStarts }: { evalStarts: [number, Set<number>][] }) {
  const colors = useColors();
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <g opacity={enter}>
      <Label x={GX} y={GY - 12} color={colors.faint}>
        policy.py · 41 gates · 50+ thresholds
      </Label>
      {Array.from({ length: GATES }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        let fill: string = colors.surfaceRaised;
        let stroke: string = colors.line;
        for (const [start, open] of evalStarts) {
          const t = start + i * 0.7;
          if (frame >= t && frame < t + 6) {
            fill = colors.lineStrong;
          } else if (frame >= start + GATES * 0.7 && frame < start + 150) {
            if (open.has(i)) {
              fill = colors.accent;
              stroke = colors.accent;
            }
          }
        }
        return (
          <rect
            key={i}
            x={GX + col * 19}
            y={GY + row * 19}
            width={14}
            height={14}
            rx={2}
            fill={fill}
            stroke={stroke}
          />
        );
      })}
    </g>
  );
}

export function BaraMemoryArchitecture() {
  const colors = useColors();
  const frame = useCurrentFrame();
  const retrieving = frame >= 336 && frame < 430;

  const subs = [
    '',
    pick(frame, [
      [86, 'intent: acknowledgement'],
      [220, ''],
      [244, 'intent: question · refers back'],
    ]),
    pick(frame, [
      [112, 'no topic shift'],
      [220, ''],
      [268, 'thread: earlier decision'],
    ]),
    pick(frame, [
      [166, 'retrieve: none'],
      [220, ''],
      [322, 'retrieve: research + episodic'],
    ]),
    pick(frame, [[366, '2 of 4 tiers read']]),
    pick(frame, [
      [198, 'no retrieved context'],
      [220, ''],
      [404, 'context from 2 tiers'],
    ]),
    '',
  ];

  const hot = (i: number) =>
    (i === 3 && ((frame >= 136 && frame < 172) || (frame >= 292 && frame < 330))) ||
    (i === 4 && retrieving) ||
    (i === 5 && ((frame >= 196 && frame < 214) || (frame >= 404 && frame < 420)));

  return (
    <Stage figure="Fig. — BARA · retrieval gating" title="Retrieval as a decision, not a reflex">
      {tiers.map((t, i) => (
        <Node
          key={t.label}
          x={TX}
          y={t.y}
          w={TW}
          h={TH}
          label={t.label}
          sub={t.sub}
          enter={18 + i * 8}
          tone={retrieving && RETRIEVED.has(i) ? 'accent' : frame < 60 ? 'dim' : 'default'}
          opacity={retrieving && !RETRIEVED.has(i) ? 0.45 : 1}
        />
      ))}
      <Label x={TX} y={118} enter={30} color={colors.faint}>
        FOUR MEMORY TIERS
      </Label>

      {pipeline.map((label, i) => (
        <g key={label}>
          {i < pipeline.length - 1 && <Edge points={down(i)} enter={40 + i * 6} />}
          <Node
            x={PX}
            y={py(i)}
            w={PW}
            h={PH}
            label={i === 3 ? 'Policy' : label}
            labelSize={15}
            sub={subs[i] || undefined}
            enter={30 + i * 6}
            tone={hot(i) ? 'accent' : 'default'}
          />
        </g>
      ))}

      <GateMatrix
        evalStarts={[
          [136, new Set()],
          [292, OPEN_ON_SECOND],
        ]}
      />

      {/* Message 1: acknowledgement — no retrieval */}
      <Label x={372} y={148} enter={60} exit={206} color={colors.text} size={18} mono={false}>
        “thanks, that works”
      </Label>
      <Label x={372} y={168} enter={60} exit={206} color={colors.faint}>
        illustrative input
      </Label>
      {[0, 1, 2].map((i) => (
        <Packet key={`m1-${i}`} points={down(i)} from={70 + i * 26} duration={16} tone="data" />
      ))}
      <Edge points={bypass} enter={166} tone="accent" opacity={frame < 216 ? 1 : 0.25} />
      <Packet points={bypass} from={172} duration={24} tone="data" />
      <Chip x={384} y={py(4) + 12} text="retrieval skipped" tone="accent" enter={172} exit={214} />
      <Packet points={down(5)} from={198} duration={14} tone="data" />

      {/* Message 2: refers back to an earlier decision */}
      <Label x={372} y={148} enter={220} exit={430} color={colors.text} size={18} mono={false}>
        “what did we decide about retries?”
      </Label>
      <Label x={372} y={168} enter={220} exit={430} color={colors.faint}>
        illustrative input
      </Label>
      {[0, 1, 2, 3].map((i) => (
        <Packet
          key={`m2-${i}`}
          points={down(i)}
          from={228 + i * 24 + (i === 3 ? 26 : 0)}
          duration={16}
          tone="data"
        />
      ))}
      {tiers.map((t, i) =>
        RETRIEVED.has(i) ? (
          <g key={`r-${t.label}`}>
            <Edge points={toTier(t.cy)} enter={336} tone="accent" opacity={frame < 430 ? 1 : 0.3} />
            <Packet points={toTier(t.cy)} from={342} duration={20} tone="accent" />
            <Packet points={[...toTier(t.cy)].reverse()} from={366} duration={22} tone="data" />
          </g>
        ) : null,
      )}
      <Packet points={down(4)} from={390} duration={14} tone="data" />
      <Packet points={down(5)} from={410} duration={14} tone="data" />

      <Label x={TX} y={600} enter={430} color={colors.text} size={24} mono={false} weight={600}>
        Retrieval is a decision, not a reflex.
      </Label>

      <Captions
        end={480}
        beats={[
          {
            from: 10,
            text: 'Four memory tiers with different lifetimes, behind one message pipeline.',
          },
          {
            from: 70,
            text: 'Every message is classified and threaded before retrieval is considered.',
          },
          { from: 136, text: 'An acknowledgement: the policy gates keep every tier closed.' },
          { from: 222, text: 'A message that points back at an earlier decision.' },
          { from: 292, text: 'Gates open research memory and episodic memory — and nothing else.' },
          { from: 390, text: 'Only the selected context reaches the multi-provider LLM client.' },
        ]}
      />
    </Stage>
  );
}
