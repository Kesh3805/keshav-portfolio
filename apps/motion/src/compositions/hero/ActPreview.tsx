// A single act on its own stage, starting at frame 0 — for reviewing or testing one act
// in Studio without scrubbing through the film. Not rendered by scripts/render.mjs.
import type { ComponentType } from 'react';
import { AbsoluteFill } from 'remotion';
import { StageDefs, typography, useColors } from '../../primitives';

export function actPreview(Act: ComponentType<{ start: number }>) {
  return function ActPreview() {
    const colors = useColors();
    return (
      <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: typography.sans }}>
        <svg width="100%" height="100%" viewBox="0 0 1280 720">
          <StageDefs />
          <rect width="100%" height="100%" fill="url(#grid)" />
          <Act start={0} />
        </svg>
      </AbsoluteFill>
    );
  };
}
