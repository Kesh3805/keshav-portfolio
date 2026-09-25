import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';
import { withBase } from '../paths';

/** Content is authored with root-relative links (`/projects/fintax`); GitHub Pages serves under a base path. */
export function rehypeBaseLinks({ base }: { base: string }) {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const attr = node.tagName === 'a' ? 'href' : node.tagName === 'img' ? 'src' : null;
      if (!attr) return;
      const value = node.properties?.[attr];
      if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return;
      node.properties[attr] = withBase(value, base);
    });
  };
}
