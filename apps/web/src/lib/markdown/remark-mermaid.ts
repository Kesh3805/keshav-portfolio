import type { Code, Root } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Turns ```mermaid fences into <pre class="mermaid"> before Shiki sees them.
 * Uses mdast `data.h*` fields instead of a raw `html` node so it also works in MDX.
 * The source text stays in the page, so the diagram degrades to readable text without JS.
 */
export function remarkMermaid() {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      if (node.lang !== 'mermaid') return;
      node.data = {
        hName: 'pre',
        hProperties: { className: ['mermaid'], 'data-diagram': '' },
        hChildren: [{ type: 'text', value: node.value }],
      };
    });
  };
}
