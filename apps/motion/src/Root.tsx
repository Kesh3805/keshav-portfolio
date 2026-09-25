import { canvas, fps, outputFrames } from '@keshav/motion-tokens';
import { Composition } from 'remotion';
import './fonts';
import { themed } from './primitives';
import {
  AntigravityReviewPipeline,
  ANTIGRAVITY_DURATION,
} from './compositions/AntigravityReviewPipeline';
import { BaraMemoryArchitecture, BARA_DURATION } from './compositions/BaraMemoryArchitecture';
import {
  GstReturnsArchitecture,
  GST_RETURNS_DURATION,
} from './compositions/GstReturnsArchitecture';
import { QrRedemptionFlow, QR_REDEMPTION_DURATION } from './compositions/QrRedemptionFlow';

// Output filenames for each id are mapped in scripts/render.mjs. The `theme`
// input prop selects the palette; Studio previews dark by default.
export const compositions = [
  {
    id: 'GstReturnsArchitecture',
    component: themed(GstReturnsArchitecture),
    durationInFrames: GST_RETURNS_DURATION,
  },
  {
    id: 'QrRedemptionFlow',
    component: themed(QrRedemptionFlow),
    durationInFrames: QR_REDEMPTION_DURATION,
  },
  {
    id: 'BaraMemoryArchitecture',
    component: themed(BaraMemoryArchitecture),
    durationInFrames: BARA_DURATION,
  },
  {
    id: 'AntigravityReviewPipeline',
    component: themed(AntigravityReviewPipeline),
    durationInFrames: ANTIGRAVITY_DURATION,
  },
] as const;

export function Root() {
  return (
    <>
      {compositions.map(({ id, component, durationInFrames }) => (
        <Composition
          key={id}
          id={id}
          component={component}
          defaultProps={{ theme: 'dark' as const }}
          durationInFrames={outputFrames(durationInFrames)}
          fps={fps}
          width={canvas.width}
          height={canvas.height}
        />
      ))}
    </>
  );
}
