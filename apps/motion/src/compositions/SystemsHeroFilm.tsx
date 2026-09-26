// Systems Architecture Hero Film — 34 s, 1920×1080 at 60 fps, dark and light.
//
// Five acts on one plane: the camera moves from system to system, then pulls back until
// all four share the frame and resolve into the homepage topology. Every claim on screen
// is taken from content/ (see each act's header comment for its source).
import type { ReactElement } from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { Captions, StageDefs, typography, useColors, useStoryFrame } from '../primitives';
import { Act1ConcurrencyLock } from './hero/Act1ConcurrencyLock';
import { Act2DocumentAiPipeline } from './hero/Act2DocumentAiPipeline';
import { Act3M9Reconciliation } from './hero/Act3M9Reconciliation';
import { Act4MemoryAndSandbox } from './hero/Act4MemoryAndSandbox';
import { Act5Convergence } from './hero/Act5Convergence';
import {
  ACTS,
  CAMERA,
  FILM_STORY_FRAMES,
  WORLD,
  WORLD_BOUNDS,
  convergenceBeat,
  type ActId,
} from './hero/timeline';

export const SYSTEMS_HERO_DURATION = FILM_STORY_FRAMES;
export const HERO_WIDTH = 1920;
export const HERO_HEIGHT = 1080;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const cameraEase = Easing.bezier(0.45, 0, 0.2, 1);

/** Camera at a story frame: eased between keys; zoom interpolated in log space so pull-backs feel even. */
export function cameraAt(frame: number) {
  const i = Math.max(
    0,
    CAMERA.findIndex(([f], k) => frame >= f && frame < (CAMERA[k + 1]?.[0] ?? Infinity)),
  );
  const a = CAMERA[i]!;
  const b = CAMERA[i + 1] ?? a;
  const t = b === a ? 1 : cameraEase(Math.min(1, (frame - a[0]) / (b[0] - a[0])));
  return {
    cx: a[1] + (b[1] - a[1]) * t,
    cy: a[2] + (b[2] - a[2]) * t,
    zoom: Math.exp(Math.log(a[3]) + (Math.log(b[3]) - Math.log(a[3])) * t),
  };
}

const HEADERS: Record<
  Exclude<ActId, 'convergence'>,
  { index: string; title: string; system: string }
> = {
  concurrency: {
    index: '01',
    title: 'High-concurrency edge',
    system: 'Dynamic QR campaign platform',
  },
  pipeline: {
    index: '02',
    title: 'Asynchronous document pipeline',
    system: 'GST compliance & document AI platform',
  },
  reconciliation: {
    index: '03',
    title: 'Reconciliation, then a read model',
    system: 'GST compliance & document AI platform',
  },
  review: {
    index: '04',
    title: 'Deterministic memory · isolated review',
    system: 'BARA · Antigravity PR reviewer',
  },
};

function ActHeader({ act }: { act: Exclude<ActId, 'convergence'> }) {
  const colors = useColors();
  const frame = useStoryFrame();
  const { start, end } = ACTS[act];
  const opacity = interpolate(
    frame,
    [start + 8, start + 22, end - 18, end - 4],
    [0, 1, 1, 0],
    clamp,
  );
  if (opacity <= 0) return null;
  const h = HEADERS[act];
  return (
    <g opacity={opacity}>
      <text
        x={64}
        y={56}
        fontFamily={typography.mono}
        fontSize={13}
        letterSpacing="0.12em"
        fill={colors.accent}
      >
        {`${h.index} — ${h.system.toUpperCase()}`}
      </text>
      <text
        x={64}
        y={90}
        fontFamily={typography.sans}
        fontSize={30}
        fontWeight={600}
        letterSpacing="-0.02em"
        fill={colors.text}
      >
        {h.title}
      </text>
    </g>
  );
}

export function SystemsHeroFilm() {
  const colors = useColors();
  const frame = useStoryFrame();
  const camera = cameraAt(frame);
  const conv = ACTS.convergence.start;

  // During convergence the four systems recede so the architecture they share can come forward.
  const world = interpolate(
    frame,
    [conv + 50, conv + 72, conv + 120, conv + 145],
    [1, 0.18, 0.18, 0],
    clamp,
  );
  const captions = 1 - interpolate(frame, [conv + 120, conv + 140], [0, 1], clamp);
  // Panel frames fade on their own schedule so a lit frame reads even while its content recedes.
  const panels = interpolate(frame, [conv, conv + 30, conv + 124, conv + 146], [0, 1, 1, 0], clamp);

  const order = ['concurrency', 'pipeline', 'reconciliation', 'review'] as const;
  const lit = (id: (typeof order)[number]) => {
    const beat = convergenceBeat(order.indexOf(id));
    return frame >= beat && frame < beat + 44;
  };

  const acts: [Exclude<ActId, 'convergence'>, ReactElement][] = [
    ['concurrency', <Act1ConcurrencyLock start={ACTS.concurrency.start} />],
    ['pipeline', <Act2DocumentAiPipeline start={ACTS.pipeline.start} />],
    ['reconciliation', <Act3M9Reconciliation start={ACTS.reconciliation.start} />],
    ['review', <Act4MemoryAndSandbox start={ACTS.review.start} />],
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: typography.sans }}>
      <svg width="100%" height="100%" viewBox="0 0 1280 720">
        <StageDefs />
        <g
          transform={`translate(640 360) scale(${camera.zoom}) translate(${-camera.cx} ${-camera.cy})`}
        >
          <rect
            x={WORLD_BOUNDS.x - 1400}
            y={WORLD_BOUNDS.y - 1000}
            width={WORLD_BOUNDS.w + 2800}
            height={WORLD_BOUNDS.h + 2000}
            fill="url(#grid)"
          />
          <g>
            {acts.map(([id, node]) => {
              const w = WORLD[id];
              // Only draw an act near its own time, or once the camera pulls back to show them all.
              const near = frame >= ACTS[id].start - 30 && frame <= ACTS[id].end + 30;
              if (!near && frame < conv) return null;
              return (
                <g key={id} transform={`translate(${w.x} ${w.y})`}>
                  <rect
                    x={-30}
                    y={-30}
                    width={w.w + 60}
                    height={w.h + 60}
                    rx={18}
                    fill="none"
                    stroke={lit(id) ? colors.data : colors.lineStrong}
                    strokeWidth={lit(id) ? 5 : 3}
                    opacity={panels}
                  />
                  <g opacity={world}>{node}</g>
                </g>
              );
            })}
          </g>
        </g>

        {(['concurrency', 'pipeline', 'reconciliation', 'review'] as const).map((a) => (
          <ActHeader key={a} act={a} />
        ))}
        <Act5Convergence />

        <g opacity={captions}>
          <Captions
            end={FILM_STORY_FRAMES}
            beats={[
              { from: 10, text: 'Two scans reach the same campaign line with one unit left.' },
              {
                from: 108,
                text: 'A Redis lock makes the decrement atomic: one scan redeems, the other re-reads 0.',
              },
              {
                from: ACTS.pipeline.start + 10,
                text: 'An invoice passes the invoice guard, lands in GCS and goes to LlamaIndex Cloud.',
              },
              {
                from: ACTS.pipeline.start + 140,
                text: 'The signed webhook is verified, mapped, and handed to the core service through BullMQ.',
              },
              {
                from: ACTS.reconciliation.start + 10,
                text: 'M9 matches purchase books against IMS and GSTR-2B and classifies every document.',
              },
              {
                from: ACTS.reconciliation.start + 190,
                text: 'Return status was assembled on every read. Now the writers keep a projection fresh.',
              },
              {
                from: ACTS.review.start + 10,
                text: 'BARA classifies each message first; 41 deterministic gates decide whether to retrieve.',
              },
              {
                from: ACTS.review.start + 104,
                text: 'Antigravity reviews each PR in a disposable worktree; unanchored findings are dropped.',
              },
              { from: conv + 10, text: 'Each of these is part of one architecture.' },
            ]}
          />
        </g>
        <rect width="100%" height="100%" fill="url(#vignette)" pointerEvents="none" />
      </svg>
    </AbsoluteFill>
  );
}
