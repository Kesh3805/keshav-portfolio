import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { edges, nearSet, selectionDetail } from '../src/lib/topology';
import {
  cardState,
  emphasised,
  matchesFilter,
  toggleSelection,
  topologyMotion,
} from '../src/lib/topology-state';

const source = (slug: string) =>
  readFileSync(resolve(__dirname, '../../../content/projects', `${slug}.md`), 'utf8');

describe('topology relationships', () => {
  it.each(edges.map((e) => [`${e.from} → ${e.to}`, e] as const))(
    '%s is documented in a project write-up',
    (_, e) => {
      expect(source(e.source.slug)).toMatch(e.source.evidence);
    },
  );
});

describe('topology selection', () => {
  it('selects, switches and clears', () => {
    expect(toggleSelection(null, 'postgres')).toBe('postgres');
    expect(toggleSelection('postgres', 'redis')).toBe('redis');
    expect(toggleSelection('postgres', 'postgres')).toBeNull(); // clicking again clears
    expect(toggleSelection('postgres', null)).toBeNull(); // Escape clears
  });

  it('lets hover and focus override the selection without losing it', () => {
    expect(emphasised('redis', 'postgres')).toBe('redis');
    expect(emphasised(null, 'postgres')).toBe('postgres');
    expect(emphasised(null, null)).toBeNull();
  });

  it('announces the projects the selected node appears in', () => {
    expect(selectionDetail('postgres')).toEqual({
      id: 'postgres',
      projects: ['fintax', 'dhvvs', 'bara'],
    });
    expect(selectionDetail(null)).toEqual({ id: null, projects: [] });
  });

  it('emphasises a node together with its direct neighbours only', () => {
    expect([...nearSet('postgres')].sort()).toEqual(['api', 'memory', 'postgres']);
    expect(nearSet(null).size).toBe(0);
  });
});

describe('project cards', () => {
  const selection = selectionDetail('redis');

  it('match, recede, or stay untouched', () => {
    expect(cardState('fintax', selection)).toBe('match');
    expect(cardState('bara', selection)).toBe('dim'); // dimmed, never hidden
    expect(cardState('fintax', { id: null, projects: [] })).toBeUndefined();
  });

  it('filter by any matching tag, and show everything without a filter', () => {
    expect(matchesFilter(['Backend', 'Redis'], ['Security', 'Backend'])).toBe(true);
    expect(matchesFilter(['AI'], ['Security'])).toBe(false);
    expect(matchesFilter(['AI'], null)).toBe(true);
  });
});

describe('reduced motion', () => {
  it('removes every kind of topology movement but nothing else', () => {
    expect(topologyMotion({ reducedMotion: true, finePointer: true })).toEqual({
      entrance: false,
      signal: false,
      ring: false,
      parallax: false,
    });
  });

  it('keeps parallax to fine pointers', () => {
    expect(topologyMotion({ reducedMotion: false, finePointer: false }).parallax).toBe(false);
    expect(topologyMotion({ reducedMotion: false, finePointer: true })).toEqual({
      entrance: true,
      signal: true,
      ring: true,
      parallax: true,
    });
  });
});
