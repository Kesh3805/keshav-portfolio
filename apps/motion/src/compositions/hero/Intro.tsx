// Scene 1 — the ruler. Precision before content: a hairline draws out from the signal's
// starting point at constant speed, dropping minor ticks as it passes. The minor ticks
// retract into the rule when the name contracts, leaving only the letter ticks.
import { useColors } from '../../primitives';
import { CUES, beat, ease } from './identityStoryboard';
import { between, over, useFrame, useLayout } from './identityShared';

const TICK_STEP = 40;

export function Ruler() {
  const l = useLayout();
  const c = useColors();
  const f = useFrame();
  const draw = between(f, CUES.rulerDraw[0], CUES.rulerDraw[1], ease.data);
  if (draw <= 0) return null;
  const head = l.left + (l.right - l.left) * draw;
  const minor = 1 - over(f, beat(CUES.contract), 24, ease.structural);

  const ticks = [];
  for (let x = l.left + TICK_STEP; x < l.right; x += TICK_STEP) {
    if (x > head || minor <= 0) break;
    const major = (x - l.left) % (TICK_STEP * 5) === 0;
    // Each tick drops in over a few frames after the head passes it.
    const passed =
      beat(CUES.rulerDraw[0]) +
      ((x - l.left) / (l.right - l.left)) * beat(CUES.rulerDraw[1] - CUES.rulerDraw[0]);
    const grow = over(f, passed, 6);
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
      <line x1={l.left} x2={head} y1={l.rule.y} y2={l.rule.y} stroke={c.faint} strokeWidth={1.5} />
      {ticks}
    </g>
  );
}
