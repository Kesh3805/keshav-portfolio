// Mirror the two themes in apps/web/src/styles/tokens.css so rendered media
// sits on the page without a visible seam in either theme.
export const palettes = {
  dark: {
    bg: '#0b0d10',
    surface: '#111418',
    surfaceRaised: '#171b20',
    line: '#232830',
    lineStrong: '#343b45',
    text: '#e6e9ee',
    muted: '#a1a9b4',
    faint: '#7e8895',
    accent: '#9095ff',
    data: '#4cc2e4',
    ok: '#5cb88a',
    warning: '#d6a24e',
    error: '#e26a63',
    grid: 'rgba(255,255,255,0.028)',
  },
  light: {
    bg: '#f4f2ed',
    surface: '#fbfaf6',
    surfaceRaised: '#ffffff',
    line: '#dfdcd4',
    // Darker than the page token: thin 1.5px strokes need more weight on paper.
    lineStrong: '#aeaaa0',
    text: '#1b1e23',
    muted: '#4e5660',
    faint: '#616a74',
    accent: '#4a47c2',
    data: '#0b6d8f',
    ok: '#2d7549',
    warning: '#93610a',
    error: '#b3372e',
    grid: 'rgba(0,0,0,0.04)',
  },
} as const;

export type Theme = keyof typeof palettes;
export type Palette = { [K in keyof (typeof palettes)['dark']]: string };
export type ColorToken = keyof Palette;

/** Default (dark) palette, used where a single palette is enough (e.g. OG images). */
export const colors: Palette = palettes.dark;
