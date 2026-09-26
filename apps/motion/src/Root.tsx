import { canvas, fps, outputFrames } from '@keshav/motion-tokens';
import { Composition, Folder } from 'remotion';
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
import { AcfsForensicReport, ACFS_DURATION } from './compositions/AcfsForensicReport';
import { DhvvsProofChain, DHVVS_DURATION } from './compositions/DhvvsProofChain';
import { QrRedemptionFlow, QR_REDEMPTION_DURATION } from './compositions/QrRedemptionFlow';
import {
  HERO_HEIGHT,
  HERO_WIDTH,
  SystemsHeroFilm,
  SYSTEMS_HERO_DURATION,
} from './compositions/SystemsHeroFilm';
import {
  PERSONAL_HERO_FRAMES,
  PersonalHero,
  PersonalHeroPortrait,
} from './compositions/PersonalHero';
import { LANDSCAPE, PORTRAIT } from '../../web/src/lib/identity-hero';
import { Act1ConcurrencyLock } from './compositions/hero/Act1ConcurrencyLock';
import { Act2DocumentAiPipeline } from './compositions/hero/Act2DocumentAiPipeline';
import { Act3M9Reconciliation } from './compositions/hero/Act3M9Reconciliation';
import { Act4MemoryAndSandbox } from './compositions/hero/Act4MemoryAndSandbox';
import { actPreview } from './compositions/hero/ActPreview';
import { ACTS } from './compositions/hero/timeline';

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
  {
    id: 'AcfsForensicReport',
    component: themed(AcfsForensicReport),
    durationInFrames: ACFS_DURATION,
  },
  {
    id: 'DhvvsProofChain',
    component: themed(DhvvsProofChain),
    durationInFrames: DHVVS_DURATION,
  },
] as const;

// Each hero act on its own, from frame 0, for review in Studio. Not part of the render map.
const heroActs = [
  { id: 'HeroAct1Concurrency', act: Act1ConcurrencyLock, span: ACTS.concurrency },
  { id: 'HeroAct2Pipeline', act: Act2DocumentAiPipeline, span: ACTS.pipeline },
  { id: 'HeroAct3Reconciliation', act: Act3M9Reconciliation, span: ACTS.reconciliation },
  { id: 'HeroAct4Review', act: Act4MemoryAndSandbox, span: ACTS.review },
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
      <Composition
        id="SystemsHeroFilm"
        component={themed(SystemsHeroFilm)}
        defaultProps={{ theme: 'dark' as const }}
        durationInFrames={outputFrames(SYSTEMS_HERO_DURATION)}
        fps={fps}
        width={HERO_WIDTH}
        height={HERO_HEIGHT}
      />
      {/* The homepage identity hero is authored on real frames (a 120 BPM beat grid), not the story clock. */}
      <Composition
        id="PersonalHero"
        component={themed(PersonalHero)}
        defaultProps={{ theme: 'dark' as const }}
        durationInFrames={PERSONAL_HERO_FRAMES}
        fps={fps}
        width={LANDSCAPE.width}
        height={LANDSCAPE.height}
      />
      <Composition
        id="PersonalHeroPortrait"
        component={themed(PersonalHeroPortrait)}
        defaultProps={{ theme: 'dark' as const }}
        durationInFrames={PERSONAL_HERO_FRAMES}
        fps={fps}
        width={PORTRAIT.width}
        height={PORTRAIT.height}
      />
      <Folder name="hero-acts">
        {heroActs.map(({ id, act, span }) => (
          <Composition
            key={id}
            id={id}
            component={themed(actPreview(act))}
            defaultProps={{ theme: 'dark' as const }}
            durationInFrames={outputFrames(span.end - span.start)}
            fps={fps}
            width={HERO_WIDTH}
            height={HERO_HEIGHT}
          />
        ))}
      </Folder>
    </>
  );
}
