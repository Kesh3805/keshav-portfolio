// ACT IV — Deterministic memory (BARA) beside isolated review (Antigravity).
// Sources: content/projects/bara.md — behavior_engine → topic_threading → policy.py
// (41 deterministic gates) → selected tiers only, or no retrieval → LLM;
// content/site/motion.json — an acknowledgement retrieves nothing; a message that refers
// back opens only the research and episodic tiers.
// content/projects/antigravity-pr-reviewer.md — isolated worktree at PR head, five passes,
// evidence gate (diff-anchored findings only), review pinned to diff lines, worktree removed,
// main branch never touched.
import {
  Boundary,
  Chip,
  Dissolve,
  Edge,
  Label,
  Node,
  Packet,
  type Pt,
  useColors,
  useStoryFrame,
} from '../../primitives';

// ── BARA (left half)
const MSG = { x: 50, y: 170, w: 180, h: 56 };
const BEHAVIOR = { x: 50, y: 256, w: 180, h: 56 };
const TOPIC = { x: 50, y: 342, w: 180, h: 56 };
const GRID = { x: 262, y: 206, cols: 7, cell: 22, gap: 6 };
const GATES = 41;
const TIERS = ['Research memory', 'Conversational state', 'Semantic profile', 'Episodic memory'];
const TIER_X = 488;
const tierY = (i: number) => 170 + i * 62;
const LLM = { x: 262, y: 460, w: 196, h: 56 };

// Deterministic "which gates fire" sets for the two requests (no randomness in a render).
const ACK_GATES = new Set([2, 17, 30]);
const REFER_GATES = new Set([1, 5, 9, 14, 19, 22, 27, 33, 38]);
const READS = new Set([0, 3]); // research + episodic

// ── Antigravity (right half)
const MAIN_Y = 150;
const PR = { x: 690, y: 176, w: 200, h: 56 };
const WT = { x: 690, y: 262, w: 550, h: 250 };
const PASSES = ['CodeGraph', 'Tenant AST', 'tsc', 'ESLint', 'dep-cruiser'];
const passX = (i: number) => 706 + i * 106;
const GATE = { x: 860, y: 420, w: 200, h: 56 };
const REVIEW = { x: 1060, y: 500, w: 180, h: 56 };

// Beats relative to act start.
const ACK = 20;
const REFER = 112;
const WT_OPEN = 18;
const FIND = 104;
const WT_CLOSE = 196;

export function Act4MemoryAndSandbox({ start }: { start: number }) {
  const colors = useColors();
  const frame = useStoryFrame() - start;
  const at = (n: number) => start + n;

  const phase = frame >= REFER ? 'refer' : frame >= ACK ? 'ack' : 'idle';
  const lit =
    phase === 'refer'
      ? frame >= REFER + 26
        ? REFER_GATES
        : null
      : phase === 'ack' && frame >= ACK + 22
        ? ACK_GATES
        : null;
  const tierOn = (i: number) => phase === 'refer' && frame >= REFER + 44 && READS.has(i);

  const toTier = (i: number): Pt[] => [
    { x: GRID.x + GRID.cols * (GRID.cell + GRID.gap), y: 290 },
    { x: 470, y: 290 },
    { x: 470, y: tierY(i) + 23 },
    { x: TIER_X, y: tierY(i) + 23 },
  ];
  const tierToLlm = (i: number): Pt[] => [
    { x: TIER_X + 130, y: tierY(i) + 23 },
    { x: 632, y: tierY(i) + 23 },
    { x: 632, y: LLM.y + 28 },
    { x: LLM.x + LLM.w, y: LLM.y + 28 },
  ];

  return (
    <g>
      <line x1={650} x2={650} y1={140} y2={620} stroke={colors.line} />

      {/* ── BARA: classify first, then decide */}
      <Label x={50} y={150} enter={at(4)} color={colors.faint}>
        BARA · RETRIEVAL GATING
      </Label>
      <Node
        {...MSG}
        label="User message"
        sub={phase === 'refer' ? 'refers back' : phase === 'ack' ? 'acknowledgement' : '—'}
        enter={at(6)}
        tone={phase === 'idle' ? 'default' : 'data'}
      />
      <Node
        {...BEHAVIOR}
        label="behavior_engine"
        sub="intent · type · shift"
        labelSize={14}
        enter={at(10)}
      />
      <Node {...TOPIC} label="topic_threading" sub="refers back?" labelSize={14} enter={at(14)} />
      <Edge
        points={[
          { x: 140, y: MSG.y + MSG.h },
          { x: 140, y: BEHAVIOR.y },
        ]}
        enter={at(12)}
        arrow
      />
      <Edge
        points={[
          { x: 140, y: BEHAVIOR.y + BEHAVIOR.h },
          { x: 140, y: TOPIC.y },
        ]}
        enter={at(16)}
        arrow
      />
      <Edge
        points={[
          { x: TOPIC.x + TOPIC.w, y: TOPIC.y + 28 },
          { x: GRID.x - 8, y: TOPIC.y + 28 },
          { x: GRID.x - 8, y: 290 },
        ]}
        enter={at(20)}
      />

      <Label x={GRID.x} y={194} enter={at(16)} color={colors.muted} size={13}>
        policy.py · 41 gates
      </Label>
      {Array.from({ length: GATES }, (_, i) => {
        const col = i % GRID.cols;
        const row = Math.floor(i / GRID.cols);
        const on = lit?.has(i) ?? false;
        return (
          <rect
            key={i}
            x={GRID.x + col * (GRID.cell + GRID.gap)}
            y={GRID.y + row * (GRID.cell + GRID.gap)}
            width={GRID.cell}
            height={GRID.cell}
            rx={3}
            fill={on ? colors.accent : colors.surface}
            stroke={on ? colors.accent : colors.lineStrong}
            opacity={frame < 16 ? 0 : on ? 1 : 0.85}
            filter={on ? 'url(#glow)' : undefined}
          />
        );
      })}

      {TIERS.map((t, i) => (
        <g key={t}>
          <Edge points={toTier(i)} enter={at(24 + i * 3)} opacity={0.6} />
          <Node
            x={TIER_X}
            y={tierY(i)}
            w={130}
            h={46}
            label={t.split(' ')[0]!}
            sub={t.split(' ').slice(1).join(' ')}
            labelSize={13}
            enter={at(20 + i * 4)}
            tone={tierOn(i) ? 'accent' : 'default'}
          />
        </g>
      ))}
      <Node
        {...LLM}
        label="LLM"
        sub="multi-provider client"
        enter={at(24)}
        tone={
          frame >= ACK + 44 && frame < REFER ? 'accent' : frame >= REFER + 64 ? 'ok' : 'default'
        }
      />

      {/* Request 1: nothing to retrieve */}
      <Edge
        points={[
          { x: GRID.x + 98, y: GRID.y + 6 * (GRID.cell + GRID.gap) },
          { x: GRID.x + 98, y: LLM.y },
        ]}
        enter={at(ACK + 34)}
        tone="accent"
        dashed
        opacity={frame < REFER ? 1 : 0}
      />
      <Chip
        x={GRID.x + 108}
        y={420}
        text="no retrieval"
        tone="accent"
        enter={at(ACK + 36)}
        exit={at(REFER)}
      />

      {/* Request 2: two tiers opened, the rest stay closed */}
      {[...READS].map((i) => (
        <Packet
          key={i}
          points={tierToLlm(i)}
          from={at(REFER + 52)}
          duration={22}
          tone="accent"
          trail={6}
        />
      ))}
      <Chip
        x={GRID.x + 108}
        y={420}
        text="2 of 4 tiers read"
        tone="accent"
        enter={at(REFER + 48)}
      />

      <Label x={50} y={606} enter={at(214)} color={colors.text} size={22} mono={false} weight={600}>
        Retrieval is a decision.
      </Label>

      {/* ── Antigravity: review that cannot touch main */}
      <line
        x1={690}
        x2={1240}
        y1={MAIN_Y}
        y2={MAIN_Y}
        stroke={colors.ok}
        strokeWidth={2}
        opacity={0.8}
      />
      <Label x={690} y={MAIN_Y - 10} enter={at(4)} color={colors.faint}>
        MAIN
      </Label>
      <Label x={1240} y={MAIN_Y - 10} anchor="end" enter={at(4)} color={colors.faint}>
        no writes from the reviewer
      </Label>
      <Node {...PR} label="Pull request" sub="review-requested" enter={at(8)} tone="data" />
      <Boundary
        {...WT}
        label="temporary worktree · PR head"
        enter={at(WT_OPEN)}
        exit={at(WT_CLOSE)}
        tone="data"
        scan
      />
      {PASSES.map((p, i) => (
        <Node
          key={p}
          x={passX(i)}
          y={300}
          w={96}
          h={44}
          label={p}
          labelSize={12}
          enter={at(WT_OPEN + 10 + i * 4)}
          tone={
            frame >= 40 + i * 12 && frame < WT_CLOSE
              ? frame >= 40 + i * 12 + 20
                ? 'ok'
                : 'data'
              : frame >= WT_CLOSE
                ? 'dim'
                : 'default'
          }
          opacity={frame >= WT_CLOSE ? Math.max(0, 1 - (frame - WT_CLOSE) / 10) : 1}
        />
      ))}
      <Node
        {...GATE}
        label="Evidence gate"
        sub="diff-anchored only"
        enter={at(WT_OPEN + 30)}
        tone={frame >= FIND && frame < WT_CLOSE ? 'accent' : 'default'}
        opacity={frame >= WT_CLOSE ? Math.max(0, 1 - (frame - WT_CLOSE) / 10) : 1}
      />

      {/* Two findings: one without a line anchor is dropped, one pinned to a line survives */}
      <Packet
        points={[
          { x: 812, y: 344 },
          { x: 812, y: 448 },
          { x: GATE.x, y: 448 },
        ]}
        from={at(FIND)}
        duration={18}
        tone="error"
        trail={6}
        impact={false}
      />
      <Chip
        x={GATE.x - 150}
        y={GATE.y + 64}
        text="no line anchor → dropped"
        tone="error"
        enter={at(FIND + 18)}
        exit={at(WT_CLOSE)}
      />
      <Dissolve
        x={GATE.x - 4}
        y={448}
        at={at(FIND + 20)}
        tone="error"
        count={16}
        spread={36}
        seed="act4"
      />
      <Packet
        points={[
          { x: 1130, y: 344 },
          { x: 1130, y: 390 },
          { x: 960, y: 390 },
          { x: 960, y: GATE.y },
        ]}
        from={at(FIND + 16)}
        duration={18}
        tone="data"
        trail={6}
        impact={false}
      />
      <Edge
        points={[
          { x: GATE.x + GATE.w, y: 448 },
          { x: 1150, y: 448 },
          { x: 1150, y: REVIEW.y },
        ]}
        enter={at(FIND + 36)}
        tone="ok"
        arrow
      />
      <Packet
        points={[
          { x: GATE.x + GATE.w, y: 448 },
          { x: 1150, y: 448 },
          { x: 1150, y: REVIEW.y },
        ]}
        from={at(FIND + 40)}
        duration={16}
        tone="ok"
        label="line 42"
      />
      <Node
        {...REVIEW}
        label="GitHub review"
        sub="pinned to diff line"
        enter={at(FIND + 44)}
        tone={frame >= FIND + 56 ? 'ok' : 'default'}
      />

      {/* Where the worktree was: the only thing left is main, unchanged */}
      <Label
        x={965}
        y={344}
        anchor="middle"
        enter={at(WT_CLOSE + 12)}
        color={colors.text}
        size={34}
        weight={600}
      >
        MAIN BRANCH
      </Label>
      <Label
        x={965}
        y={390}
        anchor="middle"
        enter={at(WT_CLOSE + 18)}
        color={colors.ok}
        size={34}
        weight={600}
        glow
      >
        UNTOUCHED
      </Label>
      <Label
        x={965}
        y={424}
        anchor="middle"
        enter={at(WT_CLOSE + 24)}
        color={colors.faint}
        size={13}
      >
        worktree removed after the review
      </Label>
    </g>
  );
}
