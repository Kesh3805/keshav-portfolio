import { interpolate } from 'remotion';
import {
  Boundary,
  Captions,
  Chip,
  Dissolve,
  Edge,
  Gauge,
  Label,
  Node,
  Packet,
  type Pt,
  Ripple,
  Stage,
  typography,
  useColors,
  useEnter,
  useGlow,
  useProgress,
  useStoryFrame,
} from '../primitives';

/** Story frames (see motion-tokens `story`); rendered at 60 fps over 12 s. */
export const ANTIGRAVITY_DURATION = 480;

const MAIN_Y = 140;
const PASS_Y = 300;
const PASS_W = 122;
const PASS_H = 64;
const passX = (i: number) => 292 + i * 131;
const passCx = (i: number) => passX(i) + PASS_W / 2;
const passStart = (i: number) => 118 + i * 34;

const passes = [
  { label: 'CodeGraph', finding: { text: 'no diff line', anchored: false } },
  { label: 'Tenant AST', finding: { text: 'line 42', anchored: true } },
  { label: 'tsc', finding: { text: 'line 17', anchored: true } },
  { label: 'ESLint', finding: { text: 'no diff line', anchored: false } },
  { label: 'dep-cruiser', finding: { text: 'clean', anchored: null } },
] as const;

const PR = { x: 64, y: 330, w: 170, h: 64 };
const GATE = { x: 990, y: 300, w: 226, h: 64 };
const CARD = { x: 990, y: 420, w: 226, h: 150 };
const CHIP_Y = 410;
const WORKTREE = { x: 270, y: 236, w: 680, h: 292 };
const TEARDOWN = 400;

const toGate = (cx: number): Pt[] => [
  { x: cx, y: CHIP_Y + 26 },
  { x: cx, y: 478 },
  { x: 972, y: 478 },
  { x: 972, y: GATE.y + GATE.h / 2 },
  { x: GATE.x, y: GATE.y + GATE.h / 2 },
];
const stopsShort = (cx: number): Pt[] => [
  { x: cx, y: CHIP_Y + 26 },
  { x: cx, y: 470 },
];

function MainLane() {
  const colors = useColors();
  const glow = useGlow();
  const frame = useStoryFrame();
  const draw = useProgress(8, 30);
  const safe = frame >= 424;
  const shine = interpolate(frame, [424, 440], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const color = safe ? colors.ok : colors.lineStrong;
  const x2 = 64 + (1216 - 64) * draw;
  return (
    <g>
      {safe && (
        <line
          x1={64}
          x2={x2}
          y1={MAIN_Y}
          y2={MAIN_Y}
          stroke={colors.ok}
          strokeWidth={4}
          filter="url(#glow-strong)"
          opacity={shine * glow}
        />
      )}
      <line
        x1={64}
        x2={x2}
        y1={MAIN_Y}
        y2={MAIN_Y}
        stroke={color}
        strokeWidth={safe ? 2.5 : 1.75}
      />
      {[140, 300, 460, 620, 780, 940, 1100].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={MAIN_Y}
          r={5}
          fill={colors.bg}
          stroke={color}
          strokeWidth={1.75}
          opacity={x2 > x ? 1 : 0}
        />
      ))}
      <Label x={64} y={MAIN_Y - 16} enter={20} color={safe ? colors.ok : colors.text} size={15}>
        main
      </Label>
      <Label x={1216} y={MAIN_Y - 16} enter={30} anchor="end" color={colors.faint}>
        src/github.rs: no push · no merge (AST-tested)
      </Label>
      {safe && (
        <text
          x={1216}
          y={MAIN_Y + 26}
          textAnchor="end"
          fill={colors.ok}
          fontFamily={typography.mono}
          fontSize={13}
          opacity={shine}
        >
          no writes from the reviewer
        </text>
      )}
    </g>
  );
}

/** Anchored findings land as one GitHub review with line comments. */
function ReviewCard() {
  const colors = useColors();
  const p = useEnter(360);
  const lift = interpolate(p, [0, 1], [12, 0]);
  return (
    <g opacity={p} transform={`translate(0 ${lift})`}>
      <rect
        x={CARD.x}
        y={CARD.y}
        width={CARD.w}
        height={CARD.h}
        rx={6}
        fill="none"
        stroke={colors.data}
        strokeWidth={2}
        filter="url(#glow)"
        opacity={0.6}
      />
      <rect
        x={CARD.x}
        y={CARD.y}
        width={CARD.w}
        height={CARD.h}
        rx={6}
        fill={colors.surface}
        stroke={colors.data}
        strokeWidth={1.5}
      />
      <text
        x={CARD.x + 14}
        y={CARD.y + 26}
        fill={colors.text}
        fontFamily={typography.mono}
        fontSize={16}
        fontWeight={500}
      >
        GitHub review
      </text>
      <line
        x1={CARD.x}
        x2={CARD.x + CARD.w}
        y1={CARD.y + 40}
        y2={CARD.y + 40}
        stroke={colors.line}
      />
    </g>
  );
}

export function AntigravityReviewPipeline() {
  const colors = useColors();
  const frame = useStoryFrame();
  const dissolve = interpolate(frame, [TEARDOWN, TEARDOWN + 7], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const finale = useProgress(430, 20);

  return (
    <Stage figure="Fig. 4 — Antigravity · PR review" title="Review without write access to main">
      <MainLane />

      <Node {...PR} label="GitHub PR" sub="review-requested" enter={40} />
      <Boundary {...WORKTREE} label="isolated git worktree · temp dir" enter={70} exit={TEARDOWN} />

      <g opacity={dissolve}>
        <Label x={294} y={276} enter={92} color={colors.data}>
          checkout: PR head (detached)
        </Label>
        <Edge
          points={[
            { x: PR.x + PR.w, y: PR.y + PR.h / 2 },
            { x: 262, y: PR.y + PR.h / 2 },
            { x: 262, y: PASS_Y + PASS_H / 2 },
            { x: passX(0), y: PASS_Y + PASS_H / 2 },
          ]}
          enter={96}
        />
        <Packet
          points={[
            { x: PR.x + PR.w, y: PR.y + PR.h / 2 },
            { x: 262, y: PR.y + PR.h / 2 },
            { x: 262, y: PASS_Y + PASS_H / 2 },
            { x: passX(0), y: PASS_Y + PASS_H / 2 },
          ]}
          from={100}
          duration={18}
          tone="data"
          label="PR head"
        />

        {passes.map((pass, i) => {
          const start = passStart(i);
          const active = frame >= start && frame < start + 34;
          const tone =
            pass.finding.anchored === null ? 'ok' : pass.finding.anchored ? 'data' : 'default';
          const dropped = pass.finding.anchored === false && frame >= 312;
          return (
            <g key={pass.label}>
              {i > 0 && (
                <Edge
                  points={[
                    { x: passX(i - 1) + PASS_W, y: PASS_Y + PASS_H / 2 },
                    { x: passX(i), y: PASS_Y + PASS_H / 2 },
                  ]}
                  enter={start - 10}
                />
              )}
              <Node
                x={passX(i)}
                y={PASS_Y}
                w={PASS_W}
                h={PASS_H}
                label={pass.label}
                sub={`pass ${i + 1}`}
                labelSize={14}
                enter={104 + i * 6}
                tone={active ? 'accent' : frame >= start + 34 ? 'ok' : 'default'}
              />
              <Gauge x={passX(i)} y={PASS_Y + PASS_H + 8} w={PASS_W} start={start} duration={28} />
              {i < passes.length - 1 && (
                <Packet
                  points={[
                    { x: passX(i) + PASS_W, y: PASS_Y + PASS_H / 2 },
                    { x: passX(i + 1), y: PASS_Y + PASS_H / 2 },
                  ]}
                  from={start + 26}
                  duration={8}
                  tone="data"
                />
              )}
              <Chip
                x={passX(i)}
                y={CHIP_Y}
                text={pass.finding.text}
                tone={dropped ? 'error' : tone}
                enter={start + 18}
                exit={dropped ? 326 : undefined}
              />
              {pass.finding.anchored === true && (
                <Packet
                  points={toGate(passCx(i) - 20)}
                  from={296 + i * 6}
                  duration={30}
                  tone="data"
                  label={pass.finding.text}
                />
              )}
              {pass.finding.anchored === false && (
                <>
                  <Packet
                    points={stopsShort(passCx(i) - 20)}
                    from={296}
                    duration={12}
                    tone="error"
                    hold={14}
                    impact={false}
                  />
                  <Dissolve
                    x={passX(i) + 50}
                    y={CHIP_Y + 13}
                    at={324}
                    tone="default"
                    count={26}
                    spread={56}
                    rise={30}
                    duration={40}
                  />
                  <Label x={passX(i)} y={500} enter={314} exit={346} color={colors.error}>
                    dropped · no anchor
                  </Label>
                </>
              )}
            </g>
          );
        })}
        <Label x={294} y={CHIP_Y - 10} enter={130} color={colors.faint}>
          findings (illustrative)
        </Label>
        <Edge
          points={[
            { x: passX(4) + PASS_W, y: PASS_Y + PASS_H / 2 },
            { x: GATE.x, y: PASS_Y + PASS_H / 2 },
          ]}
          enter={284}
          opacity={0.6}
        />
      </g>

      <Node
        {...GATE}
        label="Evidence gate"
        sub="diff-anchored only"
        enter={120}
        tone={frame >= 326 && frame < 360 ? 'accent' : 'default'}
      />
      <Ripple x={GATE.x} y={GATE.y + GATE.h / 2} at={326} tone="data" radius={40} rings={2} />
      <Edge
        points={[
          { x: GATE.x + GATE.w / 2, y: GATE.y + GATE.h },
          { x: GATE.x + GATE.w / 2, y: CARD.y },
        ]}
        enter={350}
        tone="data"
      />
      <Packet
        points={[
          { x: GATE.x + GATE.w / 2, y: GATE.y + GATE.h },
          { x: GATE.x + GATE.w / 2, y: CARD.y },
        ]}
        from={354}
        duration={10}
        tone="data"
      />
      <ReviewCard />
      <Chip x={CARD.x + 14} y={CARD.y + 52} text="REQUEST_CHANGES" tone="accent" enter={368} glow />
      <Chip x={CARD.x + 14} y={CARD.y + 86} text="✎ line 42" tone="data" enter={376} />
      <Chip x={CARD.x + 112} y={CARD.y + 86} text="✎ line 17" tone="data" enter={382} />
      <Label x={CARD.x + 14} y={CARD.y + 136} enter={388} color={colors.faint}>
        pinned to diff lines
      </Label>

      <g opacity={finale}>
        <text
          x={610}
          y={370}
          textAnchor="middle"
          fill={colors.text}
          fontSize={56}
          fontWeight={600}
          letterSpacing="-0.02em"
        >
          MAIN BRANCH
        </text>
        <text
          x={610}
          y={436}
          textAnchor="middle"
          fill={colors.ok}
          fontSize={56}
          fontWeight={600}
          letterSpacing="-0.02em"
          filter="url(#glow)"
        >
          UNTOUCHED
        </text>
      </g>

      <Captions
        end={480}
        beats={[
          {
            from: 10,
            text: 'The daemon has repository access. src/github.rs has no push or merge path.',
          },
          {
            from: 70,
            text: 'Each labelled PR is checked out into its own worktree in a temp directory.',
          },
          {
            from: 118,
            text: 'Five passes run inside it: impact, tenant isolation, types, lint, dependencies.',
          },
          { from: 296, text: 'The evidence gate keeps only findings anchored to a changed line.' },
          { from: 362, text: 'Those become one GitHub review, pinned to exact diff lines.' },
          { from: 402, text: 'The worktree is removed, whether the pipeline passed or failed.' },
        ]}
      />
    </Stage>
  );
}
