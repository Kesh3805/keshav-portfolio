import {
  Captions,
  Chip,
  Dissolve,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  Ripple,
  RollingNumber,
  Stage,
  type Tone,
  typography,
  useColors,
  useGlow,
  useStoryFrame,
  useTone,
  useTrack,
} from '../primitives';

/** Story frames (see motion-tokens `story`); rendered at 60 fps over 12 s. */
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
const B_END = { x: REJECT.x + 20, y: REJECT.y - 22 };

// Beats (story frames)
const ARRIVE_LOCK = 196;
const A_REDEEMS = 238;
const LOCK_RELEASED = 262;
const B_ACQUIRES = 306;
const B_REJECTED = 350;

function Token({
  name,
  keys,
  toneAt,
  fadeOut,
}: {
  name: string;
  keys: [number, number, number][];
  toneAt: (frame: number) => Tone;
  fadeOut: number;
}) {
  const colors = useColors();
  const glow = useGlow();
  const frame = useStoryFrame();
  const pos = useTrack(keys);
  const color = useTone(toneAt(frame));
  const start = keys[0]![0];
  if (frame < start || frame > fadeOut + 8) return null;
  const opacity =
    Math.min(1, (frame - start) / 6) * Math.max(0, 1 - Math.max(0, frame - fadeOut) / 8);
  return (
    <g opacity={opacity}>
      <circle cx={pos.x} cy={pos.y} r={15} fill={color} opacity={0.14 * glow + 0.04} />
      <circle
        cx={pos.x}
        cy={pos.y}
        r={10}
        fill={colors.bg}
        stroke={color}
        strokeWidth={2}
        filter="url(#glow)"
      />
      <text
        x={pos.x}
        y={pos.y + 4.5}
        textAnchor="middle"
        fill={color}
        fontFamily={typography.mono}
        fontSize={13}
        fontWeight={600}
      >
        {name}
      </text>
    </g>
  );
}

export function QrRedemptionFlow() {
  const colors = useColors();
  const frame = useStoryFrame();
  const holder =
    frame >= ARRIVE_LOCK && frame < LOCK_RELEASED
      ? 'A'
      : frame >= B_ACQUIRES && frame < 372
        ? 'B'
        : null;
  const dashboardCount = frame < 288 ? 1 : 0;
  const flash =
    frame >= B_REJECTED && frame < B_REJECTED + 14 ? (1 - (frame - B_REJECTED) / 14) * 0.08 : 0;

  const aKeys: [number, number, number][] = [
    [90, cx(0), LANE_A],
    [100, cx(0), LANE_A],
    [124, cx(1), LANE_A],
    [142, cx(1), LANE_A],
    [166, cx(2), LANE_A],
    [178, cx(2), LANE_A],
    [ARRIVE_LOCK, cx(3), LANE_A],
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
    [ARRIVE_LOCK, WAIT_X, LANE_B],
    [300, WAIT_X, LANE_B],
    [314, cx(3), LANE_B],
    [338, cx(3), LANE_B],
    [366, B_END.x, B_END.y],
  ];
  const toneA = (f: number): Tone => (f >= ARRIVE_LOCK ? 'ok' : 'data');
  const toneB = (f: number): Tone =>
    f >= 338 ? 'error' : f >= B_ACQUIRES ? 'ok' : f >= ARRIVE_LOCK ? 'accent' : 'data';

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
            intense={i === 3 && holder !== null}
            tone={
              i === 3 && holder
                ? holder === 'A'
                  ? 'ok'
                  : 'accent'
                : i === 1 && frame >= 118 && frame < 150
                  ? 'ok'
                  : i === 2 && frame >= 160 && frame < 196
                    ? 'ok'
                    : i === 4 && frame >= 236 && frame < 262
                      ? 'ok'
                      : i === 6 && frame >= 288 && frame < 316
                        ? 'data'
                        : 'default'
            }
          />
        </g>
      ))}

      {/* Checks pass for both scans */}
      <Ripple x={cx(1)} y={CY} at={124} tone="ok" radius={36} />
      <Chip x={x(2) + 8} y={Y + H + 12} text="1 available" tone="ok" enter={160} exit={200} />

      {/* Contention: both hit the lock at once */}
      <Ripple x={cx(3)} y={CY} at={ARRIVE_LOCK} tone="accent" radius={60} rings={3} />
      <Chip
        x={cx(3) + 18}
        y={LANE_A - 44}
        text="[LOCK_ACQUIRED] A"
        tone="ok"
        enter={198}
        exit={236}
        glow
      />
      <Chip
        x={WAIT_X - 150}
        y={LANE_B - 13}
        text="[MUTEX_WAIT] B"
        tone="accent"
        enter={202}
        exit={298}
        glow
      />

      {/* A redeems */}
      <Chip x={x(4) + 8} y={Y + H + 12} text="scan history ✓" tone="ok" enter={242} exit={300} />
      <Ripple x={cx(4)} y={CY} at={A_REDEEMS} tone="ok" radius={40} />

      <Token name="A" keys={aKeys} toneAt={toneA} fadeOut={262} />
      <Token name="B" keys={bKeys} toneAt={toneB} fadeOut={366} />

      <Packet
        points={redeemToDashboard}
        from={258}
        duration={30}
        tone="data"
        label="inventory: 0"
        trail={12}
      />

      {/* B acquires, re-reads 0, and is rejected */}
      <Ripple x={cx(3)} y={CY} at={B_ACQUIRES} tone="accent" radius={44} rings={2} />
      <Chip
        x={cx(3) + 18}
        y={LANE_A - 44}
        text="[LOCK_ACQUIRED] B"
        tone="ok"
        enter={308}
        exit={336}
      />
      <Chip
        x={cx(3) + 18}
        y={LANE_A - 44}
        text="re-read: 0 left"
        tone="error"
        enter={338}
        exit={372}
      />
      <Edge points={lockToReject} enter={338} tone="error" glow />
      <Node {...REJECT} label="Rejected" sub="re-read: 0 left" enter={346} tone="error" intense />
      <Ripple
        x={REJECT.x + REJECT.w / 2}
        y={REJECT.y + REJECT.h / 2}
        at={B_REJECTED}
        tone="error"
        radius={80}
        rings={2}
      />
      <Dissolve x={B_END.x} y={B_END.y} at={366} tone="error" count={22} spread={48} />
      <rect width="100%" height="100%" fill={colors.error} opacity={flash} />

      {/* Inventory odometer */}
      <Label x={64} y={452} enter={60} color={colors.faint}>
        INVENTORY · CAMPAIGN LINE
      </Label>
      <RollingNumber
        x={64}
        y={530}
        from={1}
        to={0}
        start={A_REDEEMS}
        size={72}
        ease="pop"
        color={frame >= A_REDEEMS ? colors.ok : colors.text}
        glow={frame >= A_REDEEMS}
      />
      <Ripple x={86} y={506} at={A_REDEEMS} tone="ok" radius={54} rings={2} />
      <Label x={130} y={530} enter={250} color={colors.faint} size={16}>
        redeemed by A
      </Label>
      <Label x={130} y={552} enter={380} color={colors.faint} size={16}>
        never −1
      </Label>

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
          { from: 180, text: 'Both reach the Redis lock. A acquires it; B waits.' },
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
