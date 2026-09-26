// The ruler. It is born from the K mark's stem (Mark.tsx); from the last frame of that
// morph it is a plain hairline, and minor ticks drop along it left to right at constant
// speed. The minor ticks retract when the name contracts, leaving only the letter ticks.
import { useColors } from '../../primitives';
import { CUES, beat, ease } from './identityStoryboard';
import { over, useFrame, useLayout } from './identityShared';

const TICK_STEP = 40;

export function Ruler() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  if (f < beat(CUES.collapse[1])) return null;
  const [m0, m1] = CUES.minorTicks;
  const minor = 1 - over(f, beat(CUES.contract), 24, ease.structural);

  const ticks = [];
  for (let x = l.left + TICK_STEP; x < l.right && minor > 0; x += TICK_STEP) {
    const major = (x - l.left) % (TICK_STEP * 5) === 0;
    const at = beat(m0) + ((x - l.left) / (l.right - l.left)) * beat(m1 - m0);
    const grow = over(f, at, 6);
    if (grow <= 0) break;
    ticks.push(
      <line
        key={x}
        x1={x}
        x2={x}
        y1={l.rule.y}
        y2={l.rule.y + (major ? 12 : 6) * grow * minor}
        stroke={c.lineStrong}
        strokeWidth={1}
      />,
    );
  }

  return (
    <g>
      <line
        x1={l.left}
        x2={l.right}
        y1={l.rule.y}
        y2={l.rule.y}
        stroke={c.faint}
        strokeWidth={1.5}
      />
      {ticks}
    </g>
  );
}
