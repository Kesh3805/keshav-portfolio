import { interpolate, useCurrentFrame } from 'remotion';
import {
  Boundary,
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
  useProgress,
} from '../primitives';

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
const REVIEW = { x: 990, y: 430, w: 226, h: 64 };
const CHIP_Y = 410;

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
  const frame = useCurrentFrame();
  const draw = useProgress(8, 30);
  const safe = frame >= 424;
  const color = safe ? colors.ok : colors.lineStrong;
  return (
    <g>
      <line
        x1={64}
        x2={64 + (1216 - 64) * draw}
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
          opacity={draw * 1216 > x ? 1 : 0}
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
          opacity={interpolate(frame, [424, 436], [0, 1], { extrapolateRight: 'clamp' })}
        >
          no writes from the reviewer
        </text>
      )}
    </g>
  );
}

export function AntigravityReviewPipeline() {
  const colors = useColors();
  const frame = useCurrentFrame();
  const dissolve = interpolate(frame, [400, 420], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const finale = useProgress(428, 22);

  return (
    <Stage figure="Fig. — Antigravity · PR review" title="Review without write access to main">
      <MainLane />

      <Node {...PR} label="GitHub PR" sub="review-requested" enter={40} />
      <Boundary
        x={270}
        y={236}
        w={680}
        h={292}
        label="isolated git worktree · temp dir"
        enter={70}
        exit={400}
      />

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
                tone={active ? 'accent' : 'default'}
              />
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
                exit={dropped ? 336 : undefined}
              />
              {pass.finding.anchored === true && (
                <Packet
                  points={toGate(passCx(i) - 20)}
                  from={296 + i * 6}
                  duration={30}
                  tone="data"
                />
              )}
              {pass.finding.anchored === false && (
                <>
                  <Packet
                    points={stopsShort(passCx(i) - 20)}
                    from={296}
                    duration={12}
                    tone="error"
                    hold={16}
                  />
                  <Label x={passX(i)} y={500} enter={314} exit={340} color={colors.error}>
                    dropped
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
        tone={frame >= 324 && frame < 360 ? 'accent' : 'default'}
      />
      <Edge
        points={[
          { x: GATE.x + GATE.w / 2, y: GATE.y + GATE.h },
          { x: GATE.x + GATE.w / 2, y: REVIEW.y },
        ]}
        enter={350}
      />
      <Packet
        points={[
          { x: GATE.x + GATE.w / 2, y: GATE.y + GATE.h },
          { x: GATE.x + GATE.w / 2, y: REVIEW.y },
        ]}
        from={356}
        duration={12}
        tone="data"
      />
      <Node
        {...REVIEW}
        label="GitHub review"
        sub="REQUEST_CHANGES · 2"
        enter={362}
        tone={frame >= 368 && frame < 400 ? 'data' : 'default'}
      />

      <Label x={610} y={400} enter={404} exit={426} anchor="middle" color={colors.data}>
        worktree removed
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
