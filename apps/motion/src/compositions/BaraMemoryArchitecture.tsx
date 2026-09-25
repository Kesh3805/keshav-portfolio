import { interpolate } from 'remotion';
import {
  Captions,
  Chip,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  Ripple,
  Stage,
  useColors,
  useGlow,
  useStoryFrame,
} from '../primitives';

/** Story frames (see motion-tokens `story`); rendered at 60 fps over 12 s. */
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
const CELL = 14;
const PITCH = 19;
const GX = 400;
const GY = 318;
const SWEEP = 30;
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

/** 41 policy gates as rack LEDs; a scanning beam evaluates them left to right. */
function GateMatrix({ evaluations }: { evaluations: [number, Set<number>][] }) {
  const colors = useColors();
  const glow = useGlow();
  const frame = useStoryFrame();
  const enter = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const width = COLS * PITCH - (PITCH - CELL);
  const height = 3 * PITCH - (PITCH - CELL);
  const active = evaluations.find(([start]) => frame >= start && frame < start + SWEEP);
  const beamX = active ? GX + ((frame - active[0]) / SWEEP) * width : null;

  return (
    <g opacity={enter}>
      <Label x={GX} y={GY - 14} color={colors.faint}>
        policy.py · 41 gates · 50+ thresholds
      </Label>
      <rect
        x={GX - 8}
        y={GY - 8}
        width={width + 16}
        height={height + 16}
        rx={5}
        fill={colors.surface}
        stroke={colors.line}
      />
      {Array.from({ length: GATES }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cellX = GX + col * PITCH;
        const cellY = GY + row * PITCH;
        let fill: string = colors.surfaceRaised;
        let stroke: string = colors.line;
        let bloom = false;
        for (const [start, open] of evaluations) {
          const reached = start + (col / COLS) * SWEEP;
          if (frame >= reached && frame < reached + 5) {
            fill = colors.lineStrong;
          } else if (frame >= start + SWEEP && frame < start + 150 && open.has(i)) {
            const tone = i % 2 === 0 ? colors.accent : colors.data;
            fill = tone;
            stroke = tone;
            bloom = true;
          }
        }
        return (
          <g key={i}>
            {bloom && (
              <rect
                x={cellX}
                y={cellY}
                width={CELL}
                height={CELL}
                rx={3}
                fill={fill}
                filter="url(#glow-strong)"
                opacity={glow}
              />
            )}
            <rect
              x={cellX}
              y={cellY}
              width={CELL}
              height={CELL}
              rx={3}
              fill={fill}
              stroke={stroke}
            />
            <rect
              x={cellX + 3}
              y={cellY + 3}
              width={4}
              height={2}
              rx={1}
              fill={colors.text}
              opacity={bloom ? 0.5 : 0.08}
            />
          </g>
        );
      })}
      {beamX !== null && (
        <g filter="url(#glow-strong)">
          <rect x={beamX - 1.5} y={GY - 10} width={3} height={height + 20} fill={colors.data} />
          <rect
            x={beamX - 26}
            y={GY - 6}
            width={26}
            height={height + 12}
            fill={colors.data}
            opacity={0.08}
          />
        </g>
      )}
    </g>
  );
}

export function BaraMemoryArchitecture() {
  const colors = useColors();
  const frame = useStoryFrame();
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
    <Stage figure="Fig. 3 — BARA · retrieval gating" title="Retrieval as a decision, not a reflex">
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
          intense={retrieving && RETRIEVED.has(i) && frame < 372}
          opacity={retrieving && !RETRIEVED.has(i) ? 0.4 : 1}
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
            label={label}
            labelSize={15}
            sub={subs[i] || undefined}
            enter={30 + i * 6}
            tone={hot(i) ? 'accent' : 'default'}
          />
        </g>
      ))}

      <GateMatrix
        evaluations={[
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
      <Packet points={bypass} from={172} duration={24} tone="data" label="no retrieval" />
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
            <Edge
              points={toTier(t.cy)}
              enter={336}
              tone="accent"
              glow
              width={2.5}
              opacity={frame < 430 ? 1 : 0.3}
            />
            <Packet points={toTier(t.cy)} from={342} duration={20} tone="accent" />
            <Ripple x={TX} y={t.cy} at={362} tone="accent" radius={40} rings={2} />
            <Packet
              points={[...toTier(t.cy)].reverse()}
              from={366}
              duration={22}
              tone="data"
              label={i === 0 ? '+ research context' : '+ episodic context'}
              trail={10}
            />
          </g>
        ) : null,
      )}
      <Packet points={down(4)} from={390} duration={14} tone="data" label="prompt" />
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
