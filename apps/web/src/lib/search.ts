// Client-side search over the build-time index (pages/search.json.ts).
// Shared by the /search page and the command palette so both rank identically.
import type { SearchDoc } from '../pages/search.json';

export type { SearchDoc };

let cache: Promise<SearchDoc[]> | undefined;

/** Fetches the index once per page load. */
export const loadIndex = (url: string) =>
  (cache ??= fetch(url).then((r) => r.json() as Promise<SearchDoc[]>));

const fields = (d: SearchDoc) =>
  [
    [d.title, 8],
    [d.tags.join(' '), 5],
    [d.headings.join(' '), 3],
    [d.description, 2],
  ] as const;

function score(doc: SearchDoc, terms: string[]) {
  let total = 0;
  for (const term of terms) {
    let best = 0;
    for (const [text, weight] of fields(doc)) {
      if (text.toLowerCase().includes(term)) best = Math.max(best, weight);
    }
    if (best === 0) return 0; // every term must match somewhere
    total += best;
  }
  return total;
}

/** Documents matching every term, best first. */
export function rank(docs: SearchDoc[], query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return docs
    .map((doc) => ({ doc, s: score(doc, terms) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.doc);
}

export const kindLabel = (doc: SearchDoc) =>
  doc.type === 'writing'
    ? 'Writing'
    : doc.category === 'professional'
      ? 'Professional project'
      : 'Personal project';
