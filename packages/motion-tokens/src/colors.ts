// Mirror the two themes in apps/web/src/styles/tokens.css so rendered media
// sits on the page without a visible seam in either theme.
export const palettes = {
  dark: {
    bg: '#0e1011',
    surface: '#15181a',
    surfaceRaised: '#1b1f22',
    line: '#2a2f33',
    lineStrong: '#3b4247',
    text: '#e8e6e1',
    muted: '#9ba1a4',
    faint: '#646b70',
    accent: '#f0a64a',
    data: '#6cc4cb',
    ok: '#7fc486',
    error: '#e5675e',
    grid: 'rgba(255,255,255,0.035)',
  },
  light: {
    bg: '#f6f4ef',
    surface: '#fdfcf9',
    surfaceRaised: '#ffffff',
    line: '#dedad0',
    // Slightly darker than the page token: thin 1.5px strokes need more weight on paper.
    lineStrong: '#aca694',
    text: '#1a1c1d',
    muted: '#545b5f',
    faint: '#6f767b',
    accent: '#9a5200',
    data: '#0f6c73',
    ok: '#2e6f36',
    error: '#b3342b',
    grid: 'rgba(0,0,0,0.045)',
  },
} as const;

export type Theme = keyof typeof palettes;
export type Palette = { [K in keyof (typeof palettes)['dark']]: string };
export type ColorToken = keyof Palette;

/** Default (dark) palette, used where a single palette is enough (e.g. OG images). */
export const colors: Palette = palettes.dark;
