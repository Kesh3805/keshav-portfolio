// PersonalHero — the homepage identity sequence (8 s, 120 BPM grid). One signal travels
// a ruler, the system reacts, the name resolves from its stems, a caret types the role
// and opens the thesis, and the frame notation retracts into the final composition that
// the homepage continues as live HTML. Storyboard: STORYBOARDS.md → PersonalHero.
import { AbsoluteFill, interpolate } from 'remotion';
import { LANDSCAPE, PORTRAIT, type IdentityLayout } from '../../../web/src/lib/identity-hero';
import { useColors } from '../primitives';
import { Columns, Signal } from './hero/Identity';
import { Ruler } from './hero/Intro';
import { FrameNotation } from './hero/Resolve';
import { Role, Thesis } from './hero/Typography';
import { CUES, PUSH, beat, ease } from './hero/identityStoryboard';
import { LayoutContext, between, travelEnd, useFrame } from './hero/identityShared';

export { PERSONAL_HERO_FRAMES } from './hero/identityStoryboard';

/** Slow push toward the ruler while the system builds; a hard cut back to 1 on the hit. */
function useCamera(l: IdentityLayout) {
  const f = useFrame();
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
