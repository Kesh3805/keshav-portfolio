import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fps, outputFrames } from '@keshav/motion-tokens';
import { describe, expect, it } from 'vitest';
import { ACTS, CONVERGES_TO, FILM_STORY_FRAMES } from '../../motion/src/compositions/hero/timeline';
import { nodeById } from '../src/lib/topology';

// Content QA for the systems film: everything on screen must be traceable to content/.
const motionSrc = resolve(__dirname, '../../motion/src/compositions');
const filmSource = [
  readFileSync(resolve(motionSrc, 'SystemsHeroFilm.tsx'), 'utf8'),
  ...readdirSync(resolve(motionSrc, 'hero'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => readFileSync(resolve(motionSrc, 'hero', f), 'utf8')),
].join('\n');

const content = resolve(__dirname, '../../../content');
// content/ is the source of truth. motion.json is excluded because it holds the film's own
// storyboard, which would make the check circular.
const projectsText = readdirSync(content, { recursive: true, encoding: 'utf8' })
  .filter((f) => /\.(md|mdx)$/.test(f))
  .map((f) => readFileSync(resolve(content, f), 'utf8'))
  .join('\n');
const film = (
  JSON.parse(readFileSync(resolve(content, 'site/motion.json'), 'utf8')) as {
    id: string;
    steps: string[];
    takeaway: string;
  }[]
).find((e) => e.id === 'systems-hero-film');

describe('systems film', () => {
  it('runs 34 seconds at 60 fps', () => {
    expect(fps).toBe(60);
    expect(outputFrames(FILM_STORY_FRAMES)).toBe(34 * 60);
    expect(ACTS.concurrency.start).toBe(0);
  });

  it.each([
    ['RRF or reranking', /\bRRF\b|rerank/i],
    ['"canonical form"', /canonical form/i],
    ['an HMAC claim', /HMAC/i],
    ['a Redis command that is not documented', /\bSETNX\b|\bNX PX\b/],
    ['invented latencies', /3,420|<\s?12\s?ms|under 4 seconds/i],
    ['double-entry wording', /double-entry/i],
    ['repository, PR or vulnerability counts', /\b83\b|240\+|vulnerabilit/i],
    ['internal service or header names', /fintax-(api|fps)|X-Fintax/i],
    ['automatic approval', /auto-?approv/i],
  ])('contains no %s', (_, pattern) => {
    expect(filmSource).not.toMatch(pattern);
    expect(JSON.stringify(film)).not.toMatch(pattern);
  });

  it('uses only the documented read-model figures', () => {
    const figures = [...filmSource.matchAll(/([\d,]+)\s?ms/g)].map((m) => m[1]);
    expect(figures.length).toBeGreaterThan(0);
    for (const f of figures) expect(['3,000', '15']).toContain(f);
    expect(projectsText).toMatch(/3,000ms\+ → <15ms/);
  });

  it.each([
    'Redis lock',
    'BullMQ',
    'GCS',
    'LlamaIndex Cloud',
    'PostgreSQL',
    'Decimal.js',
    'GSTR-2B',
    'IMS',
    'SSE',
    'policy.py',
    'behavior_engine',
    'topic_threading',
    'CodeGraph',
    'EXACT',
    'MISMATCH',
    'MISSING_IN_2B',
    'MISSING_IN_BOOKS',
    'DRIFT',
  ])('names %s, which the write-ups document', (term) => {
    expect(filmSource).toContain(term);
    expect(projectsText).toContain(term);
  });

  it('converges into nodes that exist in the homepage topology', () => {
    for (const ids of Object.values(CONVERGES_TO)) {
      for (const id of ids) expect(nodeById.has(id), id).toBe(true);
    }
  });

  it('has a text alternative for every act', () => {
    expect(film?.steps.length).toBeGreaterThanOrEqual(5);
    expect(film?.takeaway.length).toBeGreaterThan(20);
  });
});
