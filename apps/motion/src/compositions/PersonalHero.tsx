// PersonalHero — the homepage identity sequence (9.5 s, 120 BPM grid). The K mark resolves
// out of a macro close-up, falls over into a ruler, and its hub becomes a signal: the
// system reacts, the name resolves from its stems, a caret types the role and raises the
// thesis, and the frame notation retracts into the final composition that the homepage
// continues as live HTML. Storyboard: STORYBOARDS.md → PersonalHero.
import { AbsoluteFill, interpolate } from 'remotion';
import { LANDSCAPE, PORTRAIT, type IdentityLayout } from '../../../web/src/lib/identity-hero';
import { useColors } from '../primitives';
import { Columns, Signal } from './hero/Identity';
import { Ruler } from './hero/Intro';
import { FrameNotation } from './hero/Resolve';
import { Role, Thesis } from './hero/Typography';
import { MarkAndForm, useMarkPlace } from './hero/Mark';
import { CUES, MACRO, PUSH, beat, ease } from './hero/identityStoryboard';
import { LayoutContext, between, travelEnd, useFrame } from './hero/identityShared';

export { PERSONAL_HERO_FRAMES } from './hero/identityStoryboard';

/**
 * Camera: a macro pull-back from MACRO× onto the K's hub at the cold open (scaled in log
 * space, so the move feels even), still through the morph, a slow push toward the ruler
 * while the system builds, and a hard cut back to 1 on the hit.
 */
function useCamera(l: IdentityLayout) {
  const f = useFrame();
  const place = useMarkPlace();
  if (f < beat(CUES.pullBack[1])) {
    const k = between(f, CUES.pullBack[0], CUES.pullBack[1], ease.camera);
    const scale = Math.pow(MACRO, 1 - k);
    const { x, y } = place.hub;
    return `translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`;
  }
  const push = f < beat(CUES.hit) ? between(f, CUES.travel[0], CUES.hold[0], ease.structural) : 0;
  const scale = interpolate(push, [0, 1], [1, PUSH]);
  const ax = (l.left + travelEnd(l)) / 2;
  const ay = l.rule.y;
  return `translate(${ax} ${ay}) scale(${scale}) translate(${-ax} ${-ay})`;
}

function Scene({ layout }: { layout: IdentityLayout }) {
  const c = useColors();
  const camera = useCamera(layout);
  return (
    <AbsoluteFill style={{ background: c.bg }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${layout.width} ${layout.height}`}>
        <g transform={camera}>
          <MarkAndForm />
          <Ruler />
          <Columns />
          <Signal />
          <Role />
          <Thesis />
        </g>
        {/* Frame notation sits outside the camera: it belongs to the frame, not the scene. */}
        <FrameNotation />
      </svg>
    </AbsoluteFill>
  );
}

export function PersonalHero() {
  return (
    <LayoutContext.Provider value={LANDSCAPE}>
      <Scene layout={LANDSCAPE} />
    </LayoutContext.Provider>
  );
}

export function PersonalHeroPortrait() {
  return (
    <LayoutContext.Provider value={PORTRAIT}>
      <Scene layout={PORTRAIT} />
    </LayoutContext.Provider>
  );
}
