// Development-only diagnostics: ?debug=topology or ?debug=motion.
// Loaded from BaseLayout behind import.meta.env.DEV, so production never ships it.
// It polls with setInterval, never requestAnimationFrame, so it can't disturb
// the idle-frame measurement it exists to make.

type Mode = 'topology' | 'motion';

let frames = 0;
const nativeRaf = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (cb) => {
  frames++;
  return nativeRaf(cb);
};

const rows = (mode: Mode, fps: number): [string, unknown][] => {
  const common: [string, unknown][] = [
    ['RAF', fps ? `active (${fps}/s)` : 'idle'],
    ['Reduced motion', matchMedia('(prefers-reduced-motion: reduce)').matches],
    ['Document', document.visibilityState],
  ];
  if (mode === 'topology') {
    const t = (window as Window & { __topology?: () => Record<string, unknown> }).__topology?.();
    if (!t) return [['Topology', 'not on this page'], ...common];
    return [
      ['Nodes', t.nodes],
      ['Edges', t.edges],
      ['WebGL', t.webgl],
      ['Draw calls', t.drawCalls ?? '—'],
      ['Triangles', t.triangles ?? '—'],
      ['Scene RAF', t.raf ?? '—'],
      ['DPR', t.dpr ?? devicePixelRatio],
      ['Hero visible', t.visible],
      ['Emphasis', t.emphasis ?? '—'],
      ['Selected', t.selected ?? '—'],
      ...common,
    ];
  }
  const reveals = document.querySelectorAll('[data-reveal]');
  const revealed = document.querySelectorAll('[data-reveal].is-revealed');
  const running = document.getAnimations().filter((a) => a.playState === 'running');
  return [
    ['JS', document.documentElement.classList.contains('js')],
    ['Reveals', `${revealed.length} / ${reveals.length}`],
    ['Explainers playing', document.querySelectorAll('[data-explainer].is-playing').length],
    ['Animations running', running.length],
    [
      'Longest running',
      running
        .map((a) => (a as CSSAnimation).animationName ?? a.id)
        .filter(Boolean)
        .slice(0, 3)
        .join(', ') || '—',
    ],
    ['View transitions', 'startViewTransition' in document],
    ...common,
  ];
};

export function mount(mode: Mode) {
  const panel = document.createElement('aside');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText = [
    'position:fixed',
    'left:12px',
    'bottom:12px',
    'z-index:9999',
    'min-width:220px',
    'padding:10px 12px',
    'border:1px solid var(--line-strong)',
    'border-radius:8px',
    'background:var(--surface-elevated)',
    'box-shadow:var(--shadow-3)',
    'font:11px/1.6 var(--font-mono)',
    'color:var(--text-muted)',
    'pointer-events:none',
  ].join(';');
  document.body.append(panel);

  let last = frames;
  setInterval(() => {
    // The panel's own interval is 500ms, so frames/0.5s → frames per second.
    const fps = Math.round((frames - last) * 2);
    last = frames;
    panel.innerHTML =
      `<strong style="color:var(--text)">debug · ${mode}</strong><br>` +
      rows(mode, fps)
        .map(([k, v]) => `${k}: <span style="color:var(--data)">${String(v)}</span>`)
        .join('<br>');
  }, 500);
}
