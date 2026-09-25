import { describe, expect, it } from 'vitest';
import { downloadName, linkHref, withBase } from '../src/lib/paths';

describe('configured links', () => {
  it('passes absolute URLs through and only names downloads for site files', () => {
    expect(linkHref('https://example.com/cv.pdf')).toBe('https://example.com/cv.pdf');
    expect(linkHref('mailto:someone@example.com')).toBe('mailto:someone@example.com');
    expect(linkHref('/resume.pdf')).toMatch(/\/resume\.pdf$/);
    expect(downloadName('https://example.com/cv.pdf', 'x.pdf')).toBeUndefined();
    expect(downloadName('/resume.pdf', 'Keshav_Resume.pdf')).toBe('Keshav_Resume.pdf');
  });
});

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
