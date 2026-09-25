import { describe, expect, it } from 'vitest';
import { withBase } from '../src/lib/paths';

describe('withBase', () => {
  const base = '/keshav-portfolio';

  it('prefixes the base and adds a trailing slash to page routes', () => {
    expect(withBase('/projects/fintax', base)).toBe('/keshav-portfolio/projects/fintax/');
    expect(withBase('/', base)).toBe('/keshav-portfolio/');
  });

  it('leaves files without a trailing slash', () => {
    expect(withBase('/rss.xml', base)).toBe('/keshav-portfolio/rss.xml');
    expect(withBase('/og/writing/a.png', base)).toBe('/keshav-portfolio/og/writing/a.png');
  });

  it('keeps hashes and queries after the slash', () => {
    expect(withBase('/projects/fintax#architecture', base)).toBe(
      '/keshav-portfolio/projects/fintax/#architecture',
    );
    expect(withBase('/search?q=redis', base)).toBe('/keshav-portfolio/search/?q=redis');
  });

  it('is idempotent', () => {
    const once = withBase('/work', base);
    expect(withBase(once, base)).toBe(once);
  });

  it('works for a root deployment', () => {
    expect(withBase('/work', '/')).toBe('/work/');
    expect(withBase('/work', '')).toBe('/work/');
  });
});
