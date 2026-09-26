import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CUES,
  HERO_BEATS,
  PERSONAL_HERO_FRAMES,
  SCENES,
  beat,
} from '../../motion/src/compositions/hero/identityStoryboard';
import {
  IDENTITY_COPY,
  LANDSCAPE,
  MONO_ADVANCE,
  PORTRAIT,
  cellWidth,
  letterX,
} from '../src/lib/identity-hero';
import { site } from '../src/site.config';

const layouts = [
  ['landscape', LANDSCAPE],
  ['portrait', PORTRAIT],
] as const;

describe('identity hero layout', () => {
  it('says exactly the site headline, split across lines', () => {
    for (const [, l] of layouts) {
      expect(l.thesis.lines.join(' ')).toBe(site.headline);
      expect(l.thesis.lines[0]!.startsWith(IDENTITY_COPY.lead)).toBe(true);
    }
    expect(IDENTITY_COPY.name).toBe(site.name.toUpperCase());
  });

  it.each(layouts)('%s: the name fits on the rule, wide and final', (_, l) => {
    const end = (tracking: number) => letterX(l, 5, tracking) + cellWidth(l);
    expect(end(l.name.tracking)).toBeLessThanOrEqual(l.right + 1);
    expect(end(l.name.wideTracking)).toBeLessThanOrEqual(l.right + 1);
    expect(l.name.wideTracking).toBeGreaterThanOrEqual(l.name.tracking);
  });

  it.each(layouts)('%s: reads top to bottom inside the frame', (_, l) => {
    const order = [l.name.baseline, l.rule.y, l.role.baseline, l.thesis.baseline, l.ctaTop];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const lastThesis = l.thesis.baseline + (l.thesis.lines.length - 1) * l.thesis.lineHeight;
    expect(lastThesis).toBeLessThan(l.ctaTop);
    expect(l.ctaTop).toBeLessThan(l.height - l.chrome.inset * 2);
    // The role, in mono, stays on the rule's width.
    const role = IDENTITY_COPY.role.length * (MONO_ADVANCE + l.role.tracking) * l.role.size;
    expect(l.left + role).toBeLessThanOrEqual(l.right);
  });
});

describe('identity hero storyboard', () => {
  it('runs 8 seconds on a 120 BPM grid with contiguous scenes', () => {
    expect(PERSONAL_HERO_FRAMES).toBe(8 * 60);
    expect(SCENES[0]!.from).toBe(0);
    expect(SCENES.at(-1)!.to).toBe(HERO_BEATS);
    SCENES.slice(1).forEach((s, i) => expect(s.from).toBe(SCENES[i]!.to));
  });

  it('holds a beat of stillness before the name, and rests before the hand-off', () => {
    expect(CUES.hold[0]).toBe(CUES.travel[1]);
    expect(CUES.hit).toBe(CUES.hold[1]);
    expect(beat(HERO_BEATS) - beat(CUES.chromeOut[1])).toBeGreaterThanOrEqual(30);
  });

  it('contains no dependency names — the hero is about the person', () => {
    const src = [
      'PersonalHero.tsx',
      'hero/Intro.tsx',
      'hero/Identity.tsx',
      'hero/Typography.tsx',
      'hero/Resolve.tsx',
    ]
      .map((f) => readFileSync(resolve(__dirname, '../../motion/src/compositions', f), 'utf8'))
      .join('\n');
    expect(src).not.toMatch(/NestJS|PostgreSQL|Redis|BullMQ|React|Python|\bAI\b/);
  });
});
