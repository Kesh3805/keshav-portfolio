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
  typography,
  useTrack,
} from '../primitives';

export const QR_REDEMPTION_DURATION = 480;

const W = 156;
const H = 64;
const Y = 256;
const CY = Y + H / 2;
const x = (i: number) => 64 + i * 166;
const cx = (i: number) => x(i) + W / 2;

const stages = [
  { label: 'QR scan', sub: 'mobile client' },
  { label: 'Pre-validation', sub: 'before the DB' },
  { label: 'Inventory', sub: 'availability' },
  { label: 'Redis lock', sub: '' },
  { label: 'Redemption', sub: 'atomic update' },
  { label: 'SSE', sub: 'live stats' },
  { label: 'Dashboard', sub: '' },
];

const REJECT = { x: x(4), y: 430, w: W + 40, h: H };
const LANE_A = 214;
const LANE_B = 236;
const WAIT_X = cx(3) - 58;

function Token({
  name,
  keys,
  tone,
  fadeOut,
}: {
  name: string;
  keys: [number, number, number][];
  tone: string;
  fadeOut: number;
}) {
  const colors = useColors();
  const frame = useCurrentFrame();
  const pos = useTrack(keys);
  const start = keys[0]![0];
  if (frame < start) return null;
  const opacity =
    Math.min(1, (frame - start) / 6) *
    (frame > fadeOut ? Math.max(0, 1 - (frame - fadeOut) / 10) : 1);
  return (
    <g opacity={opacity}>
      <circle cx={pos.x} cy={pos.y} r={10} fill={colors.bg} stroke={tone} strokeWidth={2} />
      <text
        x={pos.x}
        y={pos.y + 4.5}
        textAnchor="middle"
        fill={tone}
        fontFamily={typography.mono}
        fontSize={13}
        fontWeight={500}
      >
        {name}
      </text>
    </g>
  );
}

export function QrRedemptionFlow() {
  const colors = useColors();
  const frame = useCurrentFrame();
  const holder = frame >= 196 && frame < 262 ? 'A' : frame >= 306 && frame < 372 ? 'B' : null;
  const inventory = frame < 238 ? 1 : 0;
  const dashboardCount = frame < 288 ? 1 : 0;

  const aKeys: [number, number, number][] = [
    [90, cx(0), LANE_A],
    [100, cx(0), LANE_A],
    [124, cx(1), LANE_A],
    [142, cx(1), LANE_A],
    [166, cx(2), LANE_A],
    [178, cx(2), LANE_A],
    [196, cx(3), LANE_A],
    [212, cx(3), LANE_A],
    [236, cx(4), LANE_A],
  ];
  const bKeys: [number, number, number][] = [
    [90, cx(0), LANE_B],
    [100, cx(0), LANE_B],
    [124, cx(1), LANE_B],
    [142, cx(1), LANE_B],
    [166, cx(2), LANE_B],
    [178, cx(2), LANE_B],
    [196, WAIT_X, LANE_B],
    [300, WAIT_X, LANE_B],
    [314, cx(3), LANE_B],
    [338, cx(3), LANE_B],
    [366, REJECT.x + 20, REJECT.y - 22],
  ];

  const redeemToDashboard: Pt[] = [
    { x: x(4) + W, y: CY },
    { x: x(5), y: CY },
    { x: x(5) + W, y: CY },
    { x: x(6), y: CY },
  ];
  const lockToReject: Pt[] = [
    { x: cx(3), y: Y + H },
    { x: cx(3), y: REJECT.y + H / 2 },
    { x: REJECT.x, y: REJECT.y + H / 2 },
  ];

  return (
    <Stage figure="Fig. 2 — Dynamic QR" title="Two concurrent scans, one unit left">
      {stages.map((s, i) => (
        <g key={s.label}>
          {i > 0 && (
            <Edge
              points={[
                { x: x(i - 1) + W, y: CY },
                { x: x(i), y: CY },
              ]}
              enter={24 + i * 8}
            />
          )}
          <Node
            x={x(i)}
            y={Y}
            w={W}
            h={H}
            label={s.label}
            labelSize={15}
            sub={
              i === 3
                ? holder
                  ? `held by ${holder}`
                  : 'free'
                : i === 6
                  ? `inventory ${dashboardCount}`
                  : s.sub
            }
            enter={16 + i * 8}
            tone={
              i === 3 && holder
                ? 'accent'
                : i === 1 && frame >= 118 && frame < 150
                  ? 'ok'
                  : i === 4 && frame >= 236 && frame < 262
                    ? 'ok'
                    : i === 6 && frame >= 288 && frame < 310
                      ? 'data'
                      : 'default'
            }
          />
        </g>
      ))}

      <Chip x={x(2) + 8} y={Y + H + 12} text="1 available" tone="ok" enter={160} exit={200} />
      <Chip x={WAIT_X - 100} y={LANE_B - 13} text="waiting" tone="accent" enter={200} exit={296} />
      <Chip x={x(4) + 8} y={Y + H + 12} text="scan history ✓" tone="ok" enter={242} exit={300} />

      <Token name="A" keys={aKeys} tone={colors.accent} fadeOut={262} />
      <Token name="B" keys={bKeys} tone={colors.data} fadeOut={392} />

      <Packet
        points={redeemToDashboard}
        from={258}
        duration={30}
        tone="data"
        label="inventory: 0"
      />

      {/* Failure branch: B re-reads under the lock and finds nothing left. */}
      <Edge points={lockToReject} enter={338} tone="error" />
      <Node {...REJECT} label="Rejected" sub="re-read: 0 left" enter={350} tone="error" />

      {/* Inventory counter */}
      <g>
        <Label x={64} y={452} enter={60} color={colors.faint}>
          INVENTORY · CAMPAIGN LINE
        </Label>
        <Label
          x={64}
          y={530}
          enter={60}
          color={inventory ? colors.text : colors.ok}
          size={72}
          weight={500}
        >
          {String(inventory)}
        </Label>
        <Label x={130} y={530} enter={250} color={colors.faint} size={16}>
          redeemed by A
        </Label>
        <Label x={130} y={552} enter={380} color={colors.faint} size={16}>
          never −1
        </Label>
      </g>

      <Label
        x={1216}
        y={560}
        anchor="end"
        enter={396}
        color={colors.text}
        size={24}
        mono={false}
        weight={600}
      >
        One unit. One redemption.
      </Label>

      <Captions
        end={480}
        beats={[
          {
            from: 10,
            text: 'One campaign line, one unit left. Two scans arrive at the same moment.',
          },
          {
            from: 100,
            text: 'Both pass pre-validation, which runs before the database is touched.',
          },
          { from: 180, text: 'Both reach the Redis lock. A holds it; B waits.' },
          { from: 212, text: 'A redeems atomically: inventory 1 → 0, scan history recorded.' },
          {
            from: 256,
            text: 'The new count streams to the dashboard over SSE; the lock is released.',
          },
          {
            from: 300,
            text: 'B takes the lock and re-reads inventory: 0. Rejected — no double redemption.',
          },
        ]}
      />
    </Stage>
  );
}
