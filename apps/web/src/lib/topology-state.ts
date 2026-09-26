// Pure state rules for the homepage topology and the cards it filters. No imports,
// so pages that only render project cards don't pull in the topology data.

export interface TopologySelection {
  id: string | null;
  projects: string[];
}

export const SELECT_EVENT = 'topology:select';

/** Clicking the selected node again (or Escape → null) clears the selection. */
export const toggleSelection = (current: string | null, id: string | null) =>
  id && id !== current ? id : null;

/** Hover/focus wins over selection, so exploring never loses your place. */
export const emphasised = (focus: string | null, selected: string | null) => focus ?? selected;

/** How a project card responds to a selection: matched, receded, or untouched. */
export const cardState = (slug: string, selection: TopologySelection) =>
  !selection.id ? undefined : selection.projects.includes(slug) ? 'match' : 'dim';

/** Project-filter predicate: a card matches when it carries any of the filter's tags. */
export const matchesFilter = (tags: readonly string[], filterTags: readonly string[] | null) =>
  !filterTags || tags.some((t) => filterTags.includes(t));

export interface MotionEnvironment {
  reducedMotion: boolean;
  finePointer: boolean;
}

/**
 * Which kinds of topology motion may run. Reduced motion keeps every
 * interaction but removes movement: the final state renders immediately.
 */
export const topologyMotion = ({ reducedMotion, finePointer }: MotionEnvironment) => ({
  entrance: !reducedMotion,
  signal: !reducedMotion,
  ring: !reducedMotion,
  parallax: !reducedMotion && finePointer,
});
