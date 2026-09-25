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
        children: [{ type: 'text', value: 'Copy' }],
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
