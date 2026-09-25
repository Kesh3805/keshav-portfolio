import type { ShikiTransformer } from '@shikijs/types';

const LANGUAGE_LABELS: Record<string, string> = {
  ts: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  py: 'Python',
  python: 'Python',
  rs: 'Rust',
  rust: 'Rust',
  sql: 'SQL',
  sh: 'Bash',
  bash: 'Bash',
  shell: 'Shell',
  yaml: 'YAML',
  yml: 'YAML',
  json: 'JSON',
  text: 'Text',
  plaintext: 'Text',
};

/** A Lucide-style 24×24 stroke icon as hast, so the copy button needs no client-side icon code. */
function icon(
  className: string,
  shapes: [string, Record<string, string>][],
): import('hast').Element {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: [className],
      viewBox: '0 0 24 24',
      width: '14',
      height: '14',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
    },
    children: shapes.map(([tagName, properties]) => ({
      type: 'element',
      tagName,
      properties,
      children: [],
    })),
  };
}

/**
 * Wraps each highlighted block in a <figure> with a header carrying the
 * language, an optional `title="file.ts"` from the fence meta, and a copy
 * button that the client script un-hides.
 */
export function transformerCodeFrame(): ShikiTransformer {
  return {
    name: 'code-frame',
    root(root) {
      const lang = this.options.lang ?? 'text';
      const raw = (this.options.meta as { __raw?: string } | undefined)?.__raw ?? '';
      const title = /title="([^"]+)"/.exec(raw)?.[1];
      const pre = root.children.find(
        (node): node is import('hast').Element => node.type === 'element' && node.tagName === 'pre',
      );
      if (!pre) return;

      const headerChildren: import('hast').ElementContent[] = [
        {
          type: 'element',
          tagName: 'span',
          properties: { className: ['code-lang'] },
          children: [{ type: 'text', value: LANGUAGE_LABELS[lang] ?? lang }],
        },
      ];
      if (title) {
        headerChildren.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['code-title'] },
          children: [{ type: 'text', value: title }],
        });
      }
      headerChildren.push({
        type: 'element',
        tagName: 'button',
        properties: {
          type: 'button',
          className: ['code-copy'],
          hidden: true,
          'data-copy': '',
          'aria-label': 'Copy code to clipboard',
        },
        children: [
          icon('code-copy-icon', [
            ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }],
            ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }],
          ]),
          icon('code-check-icon', [['path', { d: 'M20 6 9 17l-5-5' }]]),
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-copy-label'] },
            children: [{ type: 'text', value: 'Copy' }],
          },
        ],
      });

      root.children = [
        {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['code-block'], 'data-language': lang },
          children: [
            {
              type: 'element',
              tagName: 'figcaption',
              properties: { className: ['code-header'] },
              children: headerChildren,
            },
            pre,
          ],
        },
      ];
    },
    pre(node) {
      node.properties.tabindex = '0';
    },
  };
}
