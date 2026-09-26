// Scene 6 — resolve. The frame notation (bottom corners only; the site header owns the top)
// runs through the sequence: the scene index swaps on the beat with a hard cut, a progress
// rule measures the scene, and the signal's coordinates read out on the right. Before the
// rest it retracts into its corners, leaving exactly the frame the homepage continues from.
import { useColors, typography } from '../../primitives';
import { CUES, beat, ease, sceneAt } from './identityStoryboard';
import { between, signalX, useFrame, useLayout } from './identityShared';

export function FrameNotation() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const drawIn = between(f, CUES.chromeIn, CUES.chromeIn + 0.5, ease.structural);
  const out = between(f, CUES.chromeOut[0], CUES.chromeOut[1], ease.structural);
  const k = drawIn * (1 - out);
  if (k <= 0) return null;

  const { inset, size } = l.chrome;
  const arm = 22 * k;
  const bottom = l.height - inset;
  const scene = sceneAt(f);
  const progress = (f - beat(scene.from)) / (beat(scene.to) - beat(scene.from));
  const nx = (signalX(l, f) / l.width).toFixed(3);
  const ny = (l.rule.y / l.height).toFixed(3);
  const text = {
    fontFamily: typography.mono,
    fontSize: size,
    letterSpacing: '0.1em',
    fill: c.faint,
  } as const;
  const labelWidth = 16 * l.chrome.size;

  return (
    <g>
      <clipPath id="hero-chrome-left">
        <rect x={inset} y={bottom - size * 3} width={(labelWidth + 24) * k} height={size * 4} />
      </clipPath>
      <clipPath id="hero-chrome-right">
        <rect
          x={l.width - inset - (labelWidth + 24) * k}
          y={bottom - size * 3}
          width={(labelWidth + 24) * k}
          height={size * 4}
        />
      </clipPath>
      <g stroke={c.lineStrong} strokeWidth={1.2} fill="none">
        <path d={`M${inset} ${bottom - arm} V${bottom} H${inset + arm}`} />
        <path d={`M${l.width - inset} ${bottom - arm} V${bottom} H${l.width - inset - arm}`} />
      </g>
      <g clipPath="url(#hero-chrome-left)">
        <text {...text} x={inset + 16} y={bottom - 10}>
          {scene.label}
        </text>
        <line
          x1={inset + 16}
          x2={inset + 16 + labelWidth * Math.min(1, Math.max(0, progress))}
          y1={bottom - 2}
          y2={bottom - 2}
          stroke={c.lineStrong}
          strokeWidth={1}
        />
      </g>
      <g clipPath="url(#hero-chrome-right)">
        <text {...text} x={l.width - inset - 16} y={bottom - 10} textAnchor="end">
          x {nx} · y {ny}
        </text>
      </g>
    </g>
  );
}
