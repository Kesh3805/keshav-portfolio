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
  typography,
  useColors,
  useProgress,
  useStoryFrame,
} from '../primitives';

/** Story frames (see motion-tokens `story`); rendered at 60 fps over 12 s. */
export const DHVVS_DURATION = 480;

// Hash values are illustrative; the point is equality with the anchored value.
const ANCHORED = '7f3a…c21';
const TAMPERED = '19be…04d';

const W = 190;
const H = 64;
const Y = 150;
const CY = Y + H / 2;
const x = (i: number) => 64 + i * 232;
const cx = (i: number) => x(i) + W / 2;

const chain = [
  { label: 'Presence', sub: 'NFC / QR + GPS' },
  { label: 'Sign on device', sub: 'ECDSA' },
  { label: 'NestJS ingestion', sub: 'verify · persist' },
  { label: 'BullMQ', sub: 'async job' },
  { label: 'EVM L2', sub: 'stores the hash' },
];

const RECORD = { x: 64, y: 300, w: 470, h: 214 };
const CHECK = { x: 700, y: 300, w: 516, h: 214 };

// Beats (story frames)
const SIGNED = 96;
const VERIFIED = 130;
const PERSISTED = 156;
const ANCHOR_AT = 214;
const EDIT = 252;
const RECOMPUTE_BAD = 282;
const MISMATCH = 294;
const RESTORE = 346;
const RECOMPUTE_OK = 374;
const MATCH = 386;

function Row({
  y,
  name,
  value,
  enter,
  color,
}: {
  y: number;
  name: string;
  value: string;
  enter: number;
  color?: string;
}) {
  const colors = useColors();
  const p = useProgress(enter, 10);
  return (
    <g opacity={p}>
      <text x={RECORD.x + 20} y={y} fill={colors.faint} fontFamily={typography.mono} fontSize={14}>
        {name}
      </text>
      <text
        x={RECORD.x + RECORD.w - 20}
        y={y}
        textAnchor="end"
        fill={color ?? colors.text}
        fontFamily={typography.mono}
        fontSize={15}
      >
        {value}
      </text>
    </g>
  );
}

function Panel({
  box,
  title,
  enter,
  stroke,
}: {
  box: typeof RECORD;
  title: string;
  enter: number;
  stroke?: string;
}) {
  const colors = useColors();
  const p = useProgress(enter, 14);
  return (
    <g opacity={p}>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={6}
        fill={colors.surface}
        stroke={stroke ?? colors.lineStrong}
        strokeWidth={stroke ? 1.75 : 1}
      />
      <text
        x={box.x + 20}
        y={box.y + 30}
        fill={colors.muted}
        fontFamily={typography.mono}
        fontSize={13}
        letterSpacing="0.06em"
      >
        {title}
      </text>
      <line
        x1={box.x + 20}
        x2={box.x + box.w - 20}
        y1={box.y + 44}
        y2={box.y + 44}
        stroke={colors.line}
      />
    </g>
  );
}

export function DhvvsProofChain() {
  const colors = useColors();
  const frame = useStoryFrame();

  const tampered = frame >= EDIT && frame < RESTORE;
  const recomputed = frame >= RECOMPUTE_OK ? ANCHORED : frame >= RECOMPUTE_BAD ? TAMPERED : null;
  const verdict = frame >= MATCH ? 'match' : frame >= MISMATCH ? 'mismatch' : null;
  const verdictColor =
    verdict === 'match' ? colors.ok : verdict === 'mismatch' ? colors.error : colors.faint;
  const flash =
    frame >= MISMATCH && frame < MISMATCH + 14 ? (1 - (frame - MISMATCH) / 14) * 0.07 : 0;

  // Retroactive edit: the timestamp flips, briefly strobing as it is overwritten.
  const editing = frame >= EDIT - 6 && frame < EDIT;
  const timestamp = tampered ? '11:15' : '10:42';
  const timestampColor = tampered
    ? colors.error
    : frame >= RESTORE && frame < RESTORE + 30
      ? colors.ok
      : undefined;

  const ingestToRecord: Pt[] = [
    { x: cx(2), y: Y + H },
    { x: cx(2), y: 270 },
    { x: RECORD.x + RECORD.w - 40, y: 270 },
    { x: RECORD.x + RECORD.w - 40, y: RECORD.y },
  ];
  const anchorToCheck: Pt[] = [
    { x: cx(4), y: Y + H },
    { x: cx(4), y: CHECK.y },
  ];
  const recordToCheck: Pt[] = [
    { x: RECORD.x + RECORD.w, y: RECORD.y + 150 },
    { x: CHECK.x, y: RECORD.y + 150 },
  ];
  const lit = (i: number, from: number, to: number) => frame >= from && frame < to && i >= 0;

  return (
    <Stage figure="Fig. 6 — DHVVS · proof chain" title="Anchor a hash, and any edit shows">
      {chain.map((s, i) => (
        <g key={s.label}>
          {i > 0 && (
            <Edge
              points={[
                { x: x(i - 1) + W, y: CY },
                { x: x(i), y: CY },
              ]}
              enter={24 + i * 8}
              arrow
            />
          )}
          <Node
            x={x(i)}
            y={Y}
            w={W}
            h={H}
            label={s.label}
            sub={s.sub}
            labelSize={15}
            enter={16 + i * 8}
            tone={
              (i === 0 && lit(i, 60, 92)) ||
              (i === 1 && lit(i, SIGNED - 4, 126)) ||
              (i === 2 && lit(i, VERIFIED - 4, 166)) ||
              (i === 3 && lit(i, 176, 200)) ||
              (i === 4 && lit(i, ANCHOR_AT - 2, 250))
                ? 'ok'
                : 'default'
            }
          />
        </g>
      ))}

      {/* The visit: presence, signing, verification */}
      <Ripple x={cx(0)} y={CY} at={60} tone="ok" radius={40} />
      <Packet
        points={[
          { x: x(0) + W, y: CY },
          { x: x(1), y: CY },
        ]}
        from={64}
        duration={28}
        tone="data"
        label="visit payload"
        trail={10}
      />
      <Chip
        x={x(1) + 10}
        y={Y - 40}
        text="signed before the network"
        tone="ok"
        enter={SIGNED}
        exit={150}
      />
      <Packet
        points={[
          { x: x(1) + W, y: CY },
          { x: x(2), y: CY },
        ]}
        from={100}
        duration={26}
        tone="data"
        label="payload + signature"
        trail={10}
      />
      <Chip
        x={x(2) + 10}
        y={Y - 40}
        text="signature ✓"
        tone="ok"
        enter={VERIFIED}
        exit={200}
        glow
      />

      {/* Persist the record */}
      <Edge points={ingestToRecord} enter={132} tone="data" dashed />
      <Packet points={ingestToRecord} from={134} duration={22} tone="data" trail={8} />
      <Panel box={RECORD} title="POSTGRESQL · VISIT RECORD" enter={40} />
      <Row y={RECORD.y + 72} name="CHW ID" value="chw-A17" enter={PERSISTED} />
      <Row y={RECORD.y + 102} name="patient ID" value="pt-0381" enter={PERSISTED + 4} />
      <Row
        y={RECORD.y + 132}
        name="timestamp"
        value={editing ? (frame % 2 ? '1█:██' : '██:4█') : timestamp}
        enter={PERSISTED + 8}
        color={timestampColor}
      />
      <Row y={RECORD.y + 162} name="GPS" value="inside geofence" enter={PERSISTED + 12} />
      <Row
        y={RECORD.y + 192}
        name="signature"
        value="ECDSA ✓"
        enter={PERSISTED + 16}
        color={colors.ok}
      />
      {tampered && (
        <rect
          x={RECORD.x + 10}
          y={RECORD.y + 114}
          width={RECORD.w - 20}
          height={26}
          rx={3}
          fill={colors.error}
          opacity={0.1}
        />
      )}
      <Chip
        x={RECORD.x + 20}
        y={RECORD.y - 36}
        text="retroactive edit"
        tone="error"
        enter={EDIT - 8}
        exit={RESTORE}
        glow
      />
      <Chip
        x={RECORD.x + 20}
        y={RECORD.y - 36}
        text="original restored"
        tone="ok"
        enter={RESTORE}
        exit={420}
      />

      {/* Anchor a hash of the verified record */}
      <Packet
        points={[
          { x: x(2) + W, y: CY },
          { x: x(3), y: CY },
          { x: x(3) + W, y: CY },
          { x: x(4), y: CY },
        ]}
        from={166}
        duration={46}
        tone="data"
        label={`hash ${ANCHORED}`}
        trail={12}
      />
      <Ripple x={cx(4)} y={CY} at={ANCHOR_AT} tone="ok" radius={56} rings={2} />
      <Chip x={x(4) + 10} y={Y - 40} text="anchored on-chain" tone="ok" enter={ANCHOR_AT} glow />

      {/* Verification: recompute the record's hash and compare with the anchor */}
      <Edge points={anchorToCheck} enter={ANCHOR_AT} tone="ok" dashed />
      <Panel
        box={CHECK}
        title="HASH CHECK"
        enter={200}
        stroke={verdict ? verdictColor : undefined}
      />
      <g
        opacity={interpolate(frame, [ANCHOR_AT, ANCHOR_AT + 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })}
      >
        <text
          x={CHECK.x + 20}
          y={CHECK.y + 80}
          fill={colors.faint}
          fontFamily={typography.mono}
          fontSize={14}
        >
          anchored
        </text>
        <text
          x={CHECK.x + 200}
          y={CHECK.y + 80}
          fill={colors.ok}
          fontFamily={typography.mono}
          fontSize={22}
        >
          {ANCHORED}
        </text>
        <text
          x={CHECK.x + 20}
          y={CHECK.y + 122}
          fill={colors.faint}
          fontFamily={typography.mono}
          fontSize={14}
        >
          hash(record)
        </text>
        <text
          x={CHECK.x + 200}
          y={CHECK.y + 122}
          fill={recomputed === TAMPERED ? colors.error : recomputed ? colors.ok : colors.faint}
          fontFamily={typography.mono}
          fontSize={22}
        >
          {recomputed ?? '—'}
        </text>
      </g>
      <Edge
        points={recordToCheck}
        enter={RECOMPUTE_BAD - 16}
        tone={frame >= RECOMPUTE_OK - 16 ? 'ok' : 'error'}
        glow
      />
      <Packet
        points={recordToCheck}
        from={RECOMPUTE_BAD - 14}
        duration={14}
        tone="error"
        trail={8}
        impact={false}
      />
      <Packet
        points={recordToCheck}
        from={RECOMPUTE_OK - 14}
        duration={14}
        tone="ok"
        trail={8}
        impact={false}
      />
      {verdict && (
        <text
          x={CHECK.x + 20}
          y={CHECK.y + 180}
          fill={verdictColor}
          fontFamily={typography.mono}
          fontSize={21}
          fontWeight={600}
          filter="url(#glow)"
        >
          {verdict === 'match' ? 'MATCH · record verified' : 'MISMATCH · altered after anchoring'}
        </text>
      )}
      <Ripple
        x={CHECK.x + CHECK.w / 2}
        y={CHECK.y + CHECK.h / 2}
        at={MISMATCH}
        tone="error"
        radius={120}
        rings={2}
      />
      <Ripple
        x={CHECK.x + CHECK.w / 2}
        y={CHECK.y + CHECK.h / 2}
        at={MATCH}
        tone="ok"
        radius={120}
        rings={2}
      />
      <rect width="100%" height="100%" fill={colors.error} opacity={flash} />

      <Label
        x={1216}
        y={574}
        anchor="end"
        enter={410}
        color={colors.text}
        size={24}
        mono={false}
        weight={600}
      >
        The record stays in Postgres. The proof does not.
      </Label>

      <Captions
        end={480}
        beats={[
          {
            from: 10,
            text: 'At the door: an NFC tag or encrypted QR proves presence; GPS adds a geofence.',
          },
          {
            from: 90,
            text: 'The visit payload is ECDSA-signed on the device, before any network call.',
          },
          {
            from: 126,
            text: 'The NestJS API verifies the signature and persists the record in PostgreSQL.',
          },
          {
            from: 164,
            text: 'A BullMQ job anchors a hash of the verified record on an EVM Layer-2.',
          },
          {
            from: 240,
            text: 'Edit one field afterwards and the record no longer hashes to the anchor.',
          },
          {
            from: 340,
            text: 'Restore the original and the hashes match again: the edit cannot hide.',
          },
        ]}
      />
    </Stage>
  );
}
