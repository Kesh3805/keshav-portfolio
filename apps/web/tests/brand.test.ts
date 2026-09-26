import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INTO_MARK } from '../../motion/src/compositions/hero/timeline';
import {
  MARK,
  MARK_SMALL,
  RESOLVE_ORDER,
  edgeSegments,
  markBounds,
  markSvg,
  nodeShapes,
  type MarkGeometry,
} from '../src/lib/brand';
import { nodeById } from '../src/lib/topology';

const pub = resolve(__dirname, '../../../public');
const ids = (g: MarkGeometry) => new Set(g.nodes.map((n) => n.id));

describe('brand mark geometry', () => {
  it.each([
    ['MARK', MARK],
    ['MARK_SMALL', MARK_SMALL],
  ])('%s: edges join known nodes and stay on the 32-unit grid', (_, g) => {
    for (const e of g.edges) {
      expect(ids(g).has(e.from), e.from).toBe(true);
      expect(ids(g).has(e.to), e.to).toBe(true);
    }
    const b = markBounds(g);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(32);
    expect(b.y + b.height).toBeLessThanOrEqual(32);
  });

  it('lights exactly one node in the accent variant', () => {
    expect(MARK.nodes.filter((n) => n.accent)).toHaveLength(1);
  });

  it('leaves a visible edge between every pair of nodes at full size', () => {
    for (const s of edgeSegments(MARK)) expect(s.length, `${s.from}-${s.to}`).toBeGreaterThan(2);
  });

  it('closes the gaps in the small variant so 16–24px reads as one K', () => {
    expect(MARK_SMALL.gap).toBe(0);
    expect(MARK_SMALL.stroke).toBeGreaterThan(MARK.stroke);
    expect(MARK_SMALL.nodes).toBe(MARK.nodes);
    expect(MARK_SMALL.edges).toBe(MARK.edges);
  });

  it('resolves every visible node and edge, and signals along real edges', () => {
    expect([...RESOLVE_ORDER.nodes].sort()).toEqual(
      nodeShapes(MARK)
        .map((n) => n.id)
        .sort(),
    );
    expect(RESOLVE_ORDER.edges).toHaveLength(MARK.edges.length);
    const joined = (a: string, b: string) =>
      MARK.edges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
    RESOLVE_ORDER.signal.slice(1).forEach((id, i) => {
      expect(joined(RESOLVE_ORDER.signal[i]!, id), `${RESOLVE_ORDER.signal[i]}→${id}`).toBe(true);
    });
  });

  it('contracts from topology nodes that exist, one per mark node', () => {
    expect(Object.keys(INTO_MARK).sort()).toEqual(MARK.nodes.map((n) => n.id).sort());
    for (const id of Object.values(INTO_MARK)) expect(nodeById.has(id), id).toBe(true);
    expect(new Set(Object.values(INTO_MARK)).size).toBe(MARK.nodes.length);
  });
});

describe('brand assets', () => {
  it('are generated from the current geometry (run `pnpm --filter @keshav/web brand`)', () => {
    expect(readFileSync(resolve(pub, 'brand/mark.svg'), 'utf8')).toBe(markSvg({ size: 32 }));
    expect(readFileSync(resolve(pub, 'brand/mark-small.svg'), 'utf8')).toBe(markSvg({ size: 16 }));
  });

  it('ship outlined text only, so they render without the site fonts', () => {
    for (const f of [
      'wordmark-on-dark.svg',
      'logo-horizontal-on-light.svg',
      'logo-stacked-on-dark.svg',
    ]) {
      const svg = readFileSync(resolve(pub, 'brand', f), 'utf8');
      expect(svg, f).not.toMatch(/<text|font-family|<image/);
    }
  });

  it('adapt the favicon to the colour scheme', () => {
    const svg = readFileSync(resolve(pub, 'favicon.svg'), 'utf8');
    expect(svg).toMatch(/prefers-color-scheme: ?dark/);
    expect(svg).toContain(`stroke-width="${MARK_SMALL.stroke}"`);
  });
});
