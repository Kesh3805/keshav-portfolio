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
  typography,
  useColors,
  useProgress,
  useStoryFrame,
} from '../primitives';

/** Story frames (see motion-tokens `story`); rendered at 60 fps over 12 s. */
export const ACFS_DURATION = 480;

// Illustrative digest; what matters is that the same value reaches the report.
const DIGEST = '9c41…e07';

const ART = { x: 64, y: 300, w: 176, h: 64 };
const LANE_X = 318;
const LANE_W = 262;
const LANES = [
  { y: 150, label: 'ViT / DeiT classifier', sub: 'generative artifacts' },
  { y: 300, label: 'Error Level Analysis', sub: 're-compression' },
  { y: 450, label: 'EXIF anomaly check', sub: 'sensor metadata' },
];
const CAM = { x: 640, y: 150, w: 196, h: 64 };
const REPORT = { x: 912, y: 150, w: 304, h: 364 };
const H = 64;

// Beats (story frames)
const HASHED = 52;
const FAN_OUT = 90;
const CAM_AT = 154;
const TO_REPORT = 190;
const PROVENANCE = 262;
const STAMPED = 316;

function ReportRow({
  y,
  text,
  enter,
  color,
}: {
  y: number;
  text: string;
  enter: number;
  color?: string;
}) {
  const colors = useColors();
  const p = useProgress(enter, 10);
  return (
    <g opacity={p}>
      <rect x={REPORT.x + 20} y={y - 13} width={10} height={10} rx={2} fill={color ?? colors.ok} />
      <text
        x={REPORT.x + 42}
        y={y - 3}
        fill={colors.text}
        fontFamily={typography.mono}
        fontSize={14}
      >
        {text}
      </text>
    </g>
  );
}

export function AcfsForensicReport() {
  const colors = useColors();
  const frame = useStoryFrame();
  const reportIn = useProgress(40, 14);
  const stamped = frame >= STAMPED;

  const fan = (i: number): Pt[] => {
    const lane = LANES[i]!;
    const sy = ART.y + H / 2;
    const ly = lane.y + H / 2;
    return [
      { x: ART.x + ART.w, y: sy },
      { x: ART.x + ART.w + 34, y: sy },
      { x: ART.x + ART.w + 34, y: ly },
      { x: LANE_X, y: ly },
    ];
  };
  const toReport = (i: number): Pt[] => {
    const ly = LANES[i]!.y + H / 2;
    const start = i === 0 ? CAM.x + CAM.w : LANE_X + LANE_W;
    const ry = REPORT.y + 96 + i * 40;
    return [
      { x: start, y: ly },
      { x: REPORT.x - 40, y: ly },
      { x: REPORT.x - 40, y: ry },
      { x: REPORT.x, y: ry },
    ];
  };
  const provenance: Pt[] = [
    { x: ART.x + ART.w / 2, y: ART.y + H + 40 },
    { x: ART.x + ART.w / 2, y: 560 },
    { x: REPORT.x + REPORT.w / 2, y: 560 },
    { x: REPORT.x + REPORT.w / 2, y: REPORT.y + REPORT.h },
  ];

  return (
    <Stage figure="Fig. 5 — ACFS · forensic report" title="Every finding points back to one file">
      {/* Artifact and its digest */}
      <Node
        {...ART}
        label="Artifact"
        sub="image file"
        enter={16}
        tone={frame >= HASHED - 4 && frame < FAN_OUT ? 'data' : 'default'}
      />
      <Ripple x={ART.x + ART.w / 2} y={ART.y + H / 2} at={HASHED} tone="data" radius={48} />
      <Chip
        x={ART.x}
        y={ART.y + H + 16}
        text={`sha256 ${DIGEST}`}
        tone="data"
        enter={HASHED}
        glow={frame >= PROVENANCE}
      />

      {/* Independent analyses on the same bytes */}
      {LANES.map((lane, i) => (
        <g key={lane.label}>
          <Edge points={fan(i)} enter={FAN_OUT - 20 + i * 6} arrow />
          <Node
            x={LANE_X}
            y={lane.y}
            w={LANE_W}
            h={H}
            label={lane.label}
            sub={lane.sub}
            labelSize={15}
            enter={24 + i * 8}
            tone={
              frame >= FAN_OUT + 24 + i * 6 && frame < TO_REPORT + i * 10 ? 'accent' : 'default'
            }
          />
          <Packet
            points={fan(i)}
            from={FAN_OUT + i * 6}
            duration={24}
            tone="data"
            label={DIGEST}
            trail={8}
          />
          <Edge points={toReport(i)} enter={TO_REPORT - 16 + i * 10} arrow />
          <Packet
            points={toReport(i)}
            from={TO_REPORT + i * 10}
            duration={30}
            tone="data"
            label={DIGEST}
            trail={8}
          />
        </g>
      ))}

      {/* Classifier attention → Grad-CAM heatmap */}
      <Edge
        points={[
          { x: LANE_X + LANE_W, y: CAM.y + H / 2 },
          { x: CAM.x, y: CAM.y + H / 2 },
        ]}
        enter={CAM_AT - 12}
        arrow
      />
      <Node
        {...CAM}
        label="Grad-CAM"
        sub="heatmap"
        enter={32}
        tone={frame >= CAM_AT && frame < TO_REPORT ? 'accent' : 'default'}
      />
      <Ripple x={CAM.x + CAM.w / 2} y={CAM.y + H / 2} at={CAM_AT} tone="accent" radius={40} />
      <Chip
        x={LANE_X + 10}
        y={LANES[1]!.y + H + 12}
        text="compression regions"
        enter={FAN_OUT + 40}
        exit={TO_REPORT + 20}
      />
      <Chip
        x={LANE_X + 10}
        y={LANES[2]!.y + H + 12}
        text="camera fields checked"
        enter={FAN_OUT + 48}
        exit={TO_REPORT + 30}
      />

      {/* The report */}
      <g opacity={reportIn}>
        <rect
          x={REPORT.x}
          y={REPORT.y}
          width={REPORT.w}
          height={REPORT.h}
          rx={6}
          fill={colors.surface}
          stroke={stamped ? colors.data : colors.lineStrong}
          strokeWidth={stamped ? 1.75 : 1}
        />
        <text
          x={REPORT.x + 20}
          y={REPORT.y + 34}
          fill={colors.muted}
          fontFamily={typography.mono}
          fontSize={13}
          letterSpacing="0.06em"
        >
          PDF FORENSIC REPORT
        </text>
        <line
          x1={REPORT.x + 20}
          x2={REPORT.x + REPORT.w - 20}
          y1={REPORT.y + 50}
          y2={REPORT.y + 50}
          stroke={colors.line}
        />
        <line
          x1={REPORT.x + 20}
          x2={REPORT.x + REPORT.w - 20}
          y1={REPORT.y + 258}
          y2={REPORT.y + 258}
          stroke={colors.line}
          strokeDasharray="4 4"
        />
        <text
          x={REPORT.x + 20}
          y={REPORT.y + 290}
          fill={colors.faint}
          fontFamily={typography.mono}
          fontSize={13}
        >
          SHA-256 of original
        </text>
      </g>
      <ReportRow y={REPORT.y + 102} text="classifier + Grad-CAM" enter={TO_REPORT + 30} />
      <ReportRow y={REPORT.y + 142} text="error level analysis" enter={TO_REPORT + 40} />
      <ReportRow y={REPORT.y + 182} text="EXIF anomalies" enter={TO_REPORT + 50} />

      {/* Provenance: the digest computed at intake is the one printed in the report */}
      <Edge points={provenance} enter={PROVENANCE - 12} tone="data" dashed glow />
      <Packet
        points={provenance}
        from={PROVENANCE}
        duration={50}
        tone="data"
        label={`sha256 ${DIGEST}`}
        trail={14}
      />
      {stamped && (
        <text
          x={REPORT.x + 20}
          y={REPORT.y + 326}
          fill={colors.data}
          fontFamily={typography.mono}
          fontSize={24}
          filter="url(#glow)"
        >
          {DIGEST}
        </text>
      )}
      <Ripple
        x={REPORT.x + REPORT.w / 2}
        y={REPORT.y + 318}
        at={STAMPED}
        tone="data"
        radius={90}
        rings={2}
      />
      <Chip x={REPORT.x + 180} y={REPORT.y + 306} text="= intake" tone="ok" enter={STAMPED + 16} />

      <Label x={64} y={610} enter={400} color={colors.text} size={24} mono={false} weight={600}>
        The report names the exact file it describes.
      </Label>

      <Captions
        end={480}
        beats={[
          {
            from: 10,
            text: 'An artifact arrives. Before any analysis, the SHA-256 of the original is computed.',
          },
          {
            from: 86,
            text: 'Independent analyses read the same file: a ViT / DeiT classifier, ELA and EXIF checks.',
          },
          { from: 148, text: "The classifier's attention is rendered as a Grad-CAM heatmap." },
          { from: 186, text: 'Every finding flows into one PDF forensic report.' },
          {
            from: 258,
            text: 'The digest from intake travels with the artifact and is printed in the report.',
          },
          {
            from: 350,
            text: 'Evidence stays tied to its source: change one byte, and the digest no longer matches.',
          },
        ]}
      />
    </Stage>
  );
}
