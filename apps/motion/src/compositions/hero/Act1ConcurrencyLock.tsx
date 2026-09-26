// ACT I — High-concurrency edge (QuestQR).
// Source: content/projects/questqr.md — scan → pre-validation → inventory check →
// Redis lock → atomic redemption; "a redemption must never be granted twice for one unit".
import {
  Chip,
  Dissolve,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  Ripple,
  typography,
  useColors,
  useProgress,
  useStoryFrame,
} from '../../primitives';

const H = 60;
const LANE_A = 312;
const LANE_B = 330;

const SCAN_A = { x: 70, y: 196 };
const SCAN_B = { x: 70, y: 400 };
const PRE = { x: 330, y: 290, w: 180 };
const INV = { x: 560, y: 290, w: 170 };
const LOCK = { x: 790, y: 280, w: 200, h: 80 };
const REDEEM = { x: 1050, y: 186, w: 170 };
const REJECT = { x: 1050, y: 420, w: 170 };

// Beats, relative to the act's start (story frames).
const DEPART = 40;
const AT_LOCK = 112;
const A_REDEEMS = 150;
const RELEASED = 172;
const B_REREADS = 188;
const B_REJECTED = 214;

export function Act1ConcurrencyLock({ start }: { start: number }) {
  const colors = useColors();
  const frame = useStoryFrame() - start;
  const at = (n: number) => start + n;

  const holder =
    frame >= AT_LOCK + 4 && frame < RELEASED
      ? 'A'
      : frame >= RELEASED && frame < B_REJECTED + 10
        ? 'B'
        : null;
  const inventory = frame >= A_REDEEMS ? '00' : '01';
  const swap = useProgress(at(A_REDEEMS), 8);

  const toLock = (lane: number, from: { x: number; y: number }): Pt[] => [
    { x: from.x + 170, y: from.y + H / 2 },
    { x: 290, y: from.y + H / 2 },
    { x: 290, y: lane },
    { x: LOCK.x, y: lane },
  ];

  return (
    <g>
      {/* Paths */}
      <Edge
        points={toLock(LANE_A, SCAN_A).slice(0, 3).concat({ x: PRE.x, y: LANE_A })}
        enter={at(20)}
        arrow
      />
      <Edge
        points={toLock(LANE_B, SCAN_B).slice(0, 3).concat({ x: PRE.x, y: LANE_B })}
        enter={at(22)}
        arrow
      />
      <Edge
        points={[
          { x: PRE.x + PRE.w, y: 320 },
          { x: INV.x, y: 320 },
        ]}
        enter={at(26)}
        arrow
      />
      <Edge
        points={[
          { x: INV.x + INV.w, y: 320 },
          { x: LOCK.x, y: 320 },
        ]}
        enter={at(30)}
        arrow
      />
      <Edge
        points={[
          { x: LOCK.x + LOCK.w, y: 300 },
          { x: 1020, y: 300 },
          { x: 1020, y: REDEEM.y + H / 2 },
          { x: REDEEM.x, y: REDEEM.y + H / 2 },
        ]}
        enter={at(A_REDEEMS - 30)}
        tone="ok"
      />
      <Edge
        points={[
          { x: LOCK.x + LOCK.w, y: 340 },
          { x: 1020, y: 340 },
          { x: 1020, y: REJECT.y + H / 2 },
          { x: REJECT.x, y: REJECT.y + H / 2 },
        ]}
        enter={at(B_REREADS)}
        tone="error"
      />

      {/* Components */}
      <Node
        {...SCAN_A}
        w={170}
        h={H}
        label="Scan A"
        sub="mobile client"
        enter={at(6)}
        tone={frame < AT_LOCK ? 'data' : 'default'}
      />
      <Node
        {...SCAN_B}
        w={170}
        h={H}
        label="Scan B"
        sub="same instant"
        enter={at(10)}
        tone={frame < AT_LOCK ? 'data' : 'default'}
      />
      <Node
        {...PRE}
        h={H}
        label="Pre-validation"
        sub="before the DB"
        enter={at(14)}
        tone={frame >= 70 && frame < 96 ? 'ok' : 'default'}
      />
      <Node
        {...INV}
        h={H}
        label="Inventory"
        sub="1 available"
        enter={at(18)}
        tone={frame >= 88 && frame < AT_LOCK ? 'ok' : 'default'}
      />
      <Node
        {...LOCK}
        label="Redis lock"
        sub={holder ? `held by ${holder}` : 'free'}
        labelSize={17}
        enter={at(22)}
        tone={holder ? 'accent' : 'default'}
        intense={holder !== null}
      />
      <Node
        {...REDEEM}
        h={H}
        label="Redemption"
        sub="atomic decrement"
        enter={at(A_REDEEMS - 26)}
        tone={frame >= A_REDEEMS ? 'ok' : 'default'}
      />
      <Node
        {...REJECT}
        h={H}
        label="Rejected"
        sub="re-read: 0 left"
        enter={at(B_REREADS + 8)}
        tone="error"
        intense={frame >= B_REJECTED && frame < B_REJECTED + 30}
      />

      {/* The race: both scans arrive together */}
      <Packet
        points={toLock(LANE_A, SCAN_A)}
        from={at(DEPART)}
        duration={AT_LOCK - DEPART}
        tone="data"
        label="A"
        trail={10}
      />
      <Packet
        points={toLock(LANE_B, SCAN_B)}
        from={at(DEPART + 2)}
        duration={AT_LOCK - DEPART - 2}
        tone="data"
        label="B"
        trail={10}
      />
      <Ripple
        x={LOCK.x + LOCK.w / 2}
        y={LOCK.y + LOCK.h / 2}
        at={at(AT_LOCK)}
        tone="accent"
        radius={70}
        rings={3}
      />
      <Chip
        x={LOCK.x + 4}
        y={LOCK.y - 40}
        text="A · LOCK ACQUIRED"
        tone="ok"
        enter={at(AT_LOCK + 4)}
        exit={at(RELEASED)}
        glow
      />
      <Chip
        x={LOCK.x + 4}
        y={LOCK.y + LOCK.h + 14}
        text="B · WAITING"
        tone="warning"
        enter={at(AT_LOCK + 8)}
        exit={at(RELEASED)}
      />

      {/* A redeems: one unit, one redemption */}
      <Packet
        points={[
          { x: LOCK.x + LOCK.w, y: 300 },
          { x: 1020, y: 300 },
          { x: 1020, y: REDEEM.y + H / 2 },
          { x: REDEEM.x, y: REDEEM.y + H / 2 },
        ]}
        from={at(AT_LOCK + 14)}
        duration={A_REDEEMS - AT_LOCK - 14}
        tone="ok"
        trail={8}
      />
      <Ripple x={REDEEM.x + 85} y={REDEEM.y + H / 2} at={at(A_REDEEMS)} tone="ok" radius={46} />

      {/* B takes the lock, re-reads, and is rejected */}
      <Chip
        x={LOCK.x + 4}
        y={LOCK.y - 40}
        text="B · LOCK ACQUIRED"
        tone="ok"
        enter={at(RELEASED + 2)}
        exit={at(B_REREADS)}
      />
      <Chip
        x={LOCK.x + 4}
        y={LOCK.y - 40}
        text="B · RE-READ: 0 LEFT"
        tone="error"
        enter={at(B_REREADS)}
        exit={at(250)}
      />
      <Packet
        points={[
          { x: LOCK.x + LOCK.w, y: 340 },
          { x: 1020, y: 340 },
          { x: 1020, y: REJECT.y + H / 2 },
          { x: REJECT.x, y: REJECT.y + H / 2 },
        ]}
        from={at(B_REREADS + 4)}
        duration={B_REJECTED - B_REREADS - 4}
        tone="error"
        trail={8}
        impact={false}
      />
      <Ripple
        x={REJECT.x + 85}
        y={REJECT.y + H / 2}
        at={at(B_REJECTED)}
        tone="error"
        radius={60}
        rings={2}
      />
      <Dissolve
        x={REJECT.x + 85}
        y={REJECT.y + H / 2}
        at={at(B_REJECTED + 12)}
        tone="error"
        count={18}
        spread={46}
        seed="act1"
      />

      {/* Inventory: a state, not a count-up */}
      <Label x={70} y={532} enter={at(30)} color={colors.faint}>
        INVENTORY · CAMPAIGN LINE
      </Label>
      <text
        x={70}
        y={600}
        fontFamily={typography.mono}
        fontSize={62}
        fontWeight={500}
        fill={frame >= A_REDEEMS ? colors.ok : colors.text}
        opacity={frame < 30 ? 0 : 1}
        transform={`translate(0 ${(1 - swap) * (frame >= A_REDEEMS ? 8 : 0)})`}
      >
        {inventory}
      </text>
      <Label x={170} y={574} enter={at(A_REDEEMS + 4)} color={colors.muted} size={15}>
        redeemed once
      </Label>
      <Label x={170} y={596} enter={at(B_REJECTED + 6)} color={colors.muted} size={15}>
        never below zero
      </Label>

      <Label
        x={1220}
        y={600}
        anchor="end"
        enter={at(232)}
        color={colors.text}
        size={24}
        mono={false}
        weight={600}
      >
        Two scans. One unit. One redemption.
      </Label>
    </g>
  );
}
