import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { edges, nodes, signalPath } from '../src/lib/topology';

// The homepage topology may only claim what the write-ups say: every
// node → project link must be backed by that project's own Markdown.
const source = (slug: string) =>
  readFileSync(resolve(__dirname, '../../../content/projects', `${slug}.md`), 'utf8');

describe('topology', () => {
  it('has unique node ids and a small scene', () => {
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
    expect(nodes.length).toBeLessThan(20);
    expect(edges.length).toBeLessThan(40);
  });

  it.each(nodes.flatMap((n) => n.projects.map((p) => [n.id, p.slug, p.evidence] as const)))(
    '%s → %s is documented in the project write-up',
    (_, slug, evidence) => {
      expect(source(slug)).toMatch(evidence);
    },
  );

  it('connects only known nodes, without duplicates', () => {
    const ids = new Set(nodes.map((n) => n.id));
    const seen = new Set<string>();
    for (const e of edges) {
      expect(ids).toContain(e.from);
      expect(ids).toContain(e.to);
      const key = [e.from, e.to].sort().join('|');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it('sends the data signal along real edges only', () => {
    for (let i = 1; i < signalPath.length; i++) {
      const [a, b] = [signalPath[i - 1], signalPath[i]];
      const found = edges.some((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a));
      expect(found, `${a} → ${b}`).toBe(true);
    }
  });

  it('leaves every node reachable', () => {
    for (const n of nodes) {
      expect(
        edges.some((e) => e.from === n.id || e.to === n.id),
        n.id,
      ).toBe(true);
    }
  });
});
