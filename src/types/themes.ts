/**
 * NOTE:
 * Avoid importing 'tm-themes' at build/JIT time because Tailwind (via jiti) will try to
 * evaluate this module while loading tailwind.config.js, causing a Node "exports" resolution error.
 * If you need the full theme list at runtime, do a guarded dynamic import from browser code.
 */

export interface Theme {
  name: string;
  displayName: string;
  type: 'light' | 'dark';
  colors: {
    [key: string]: string | { [key: string]: string };
  };
  accentColor?: string;
  accentColors?: Record<string, string>;
}

/**
 * Runtime themes are intentionally left empty here to prevent Node from resolving 'tm-themes'
 * during Tailwind config evaluation. In app code, dynamically import and populate as needed:
 *
 *   if (typeof window !== 'undefined') {
 *     import('tm-themes').then(({ themes }) => {
 *       // use themes in the browser only
 *     });
 *   }
 */
export let allThemes: Theme[] = [];

if (typeof window !== 'undefined') {
  import('../themes').then((module) => {
    allThemes = module.themes;
  });
}

export const getTheme = (name: string): Theme | undefined => {
  return allThemes.find((theme) => theme.name === name);
};

export const darkThemes = allThemes.filter((theme) => theme.type === 'dark');
export const lightThemes = allThemes.filter((theme) => theme.type === 'light');

export const catppuccinMochaColors = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
  gemini: {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
  },
  obs: {
    dark: '#202020',
    light: '#E6E6E6',
  },
};

export type CatppuccinColorName = keyof typeof catppuccinMochaColors;

export type CatppuccinAccentColorName =
  | 'sky'
  | 'mauve'
  | 'pink'
  | 'green'
  | 'teal'
  | 'peach'
  | 'yellow'
  | 'red'
  | 'flamingo'
  | 'rosewater'
  | 'sapphire'
  | 'blue'
  | 'lavender';

export const catppuccinAccentColorsHexMap: Record<CatppuccinAccentColorName, string> = {
  sky: catppuccinMochaColors.sky,
  mauve: catppuccinMochaColors.mauve,
  pink: catppuccinMochaColors.pink,
  green: catppuccinMochaColors.green,
  teal: catppuccinMochaColors.teal,
  peach: catppuccinMochaColors.peach,
  yellow: catppuccinMochaColors.yellow,
  red: catppuccinMochaColors.red,
  flamingo: catppuccinMochaColors.flamingo,
  rosewater: catppuccinMochaColors.rosewater,
  sapphire: catppuccinMochaColors.sapphire,
  blue: catppuccinMochaColors.blue,
  lavender: catppuccinMochaColors.lavender,
};

// For secondary accent, we can reuse the same set of colors
export type CatppuccinSecondaryAccentColorName = CatppuccinAccentColorName;
export const catppuccinSecondaryAccentColorsHexMap: Record<
  CatppuccinSecondaryAccentColorName,
  string
> = catppuccinAccentColorsHexMap;

// For chat bubbles, we can also reuse the same accent colors
export type CatppuccinChatBubbleColorName = CatppuccinAccentColorName;
export const catppuccinChatBubbleColorsHexMap: Record<CatppuccinChatBubbleColorName, string> =
  catppuccinAccentColorsHexMap;

export const catppuccinLatteColors = {
  rosewater: '#dc8a78',
  flamingo: '#dd7878',
  pink: '#ea76cb',
  mauve: '#8839ef',
  red: '#d20f39',
  maroon: '#e64553',
  peach: '#fe640b',
  yellow: '#df8e1d',
  green: '#40a02b',
  teal: '#179299',
  sky: '#04a5e5',
  sapphire: '#209fb5',
  blue: '#1e66f5',
  lavender: '#7287fd',
  text: '#4c4f69',
  subtext1: '#5c5f77',
  subtext0: '#6c6f85',
  overlay2: '#7c7f93',
  overlay1: '#8c8fa1',
  overlay0: '#9ca0b0',
  surface2: '#acb0be',
  surface1: '#bcc0cc',
  surface0: '#ccd0da',
  base: '#eff1f5',
  mantle: '#e6e9ef',
  crust: '#dce0e8',
};

export const catppuccinFrappeColors = {
  rosewater: '#f2d5cf',
  flamingo: '#eebebe',
  pink: '#f4b8e4',
  mauve: '#ca9ee6',
  red: '#e78284',
  maroon: '#ea999c',
  peach: '#ef9f76',
  yellow: '#e5c890',
  green: '#a6d189',
  teal: '#81c8be',
  sky: '#99d1db',
  sapphire: '#85c1dc',
  blue: '#8caaee',
  lavender: '#babbf1',
  text: '#c6d0f5',
  subtext1: '#b5bfe2',
  subtext0: '#a5adce',
  overlay2: '#949cbb',
  overlay1: '#838ba7',
  overlay0: '#737994',
  surface2: '#626880',
  surface1: '#51576d',
  surface0: '#414559',
  base: '#303446',
  mantle: '#292c3c',
  crust: '#232634',
};

export const catppuccinMacchiatoColors = {
  rosewater: '#f4dbd6',
  flamingo: '#f0c6c6',
  pink: '#f5bde6',
  mauve: '#c6a0f6',
  red: '#ed8796',
  maroon: '#ee99a0',
  peach: '#f5a97f',
  yellow: '#eed49f',
  green: '#a6da95',
  teal: '#8bd5ca',
  sky: '#91d7e3',
  sapphire: '#7dc4e4',
  blue: '#8aadf4',
  lavender: '#b7bdf8',
  text: '#cad3f5',
  subtext1: '#b8c0e0',
  subtext0: '#a5adcb',
  overlay2: '#939ab7',
  overlay1: '#8087a2',
  overlay0: '#6e738d',
  surface2: '#5b6078',
  surface1: '#494d64',
  surface0: '#363a4f',
  base: '#24273a',
  mantle: '#1e2030',
  crust: '#181926',
};

export const rosePineColors = {
  base: '#191724',
  surface: '#1f1d2e',
  overlay: '#26233a',
  muted: '#6e6a86',
  subtle: '#908caa',
  text: '#e0def4',
  love: '#eb6f92',
  gold: '#f6c177',
  rose: '#ebbcba',
  pine: '#31748f',
  foam: '#9ccfd8',
  iris: '#c4a7e7',
  highlightLow: '#21202e',
  highlightMed: '#403d52',
  highlightHigh: '#524f67',
};

export const rosePineMoonColors = {
  base: '#232136',
  surface: '#2a273f',
  overlay: '#393552',
  muted: '#6e6a86',
  subtle: '#908caa',
  text: '#e0def4',
  love: '#eb6f92',
  gold: '#f6c177',
  rose: '#ea9a97',
  pine: '#3e8fb0',
  foam: '#9ccfd8',
  iris: '#c4a7e7',
  highlightLow: '#2a283e',
  highlightMed: '#44415a',
  highlightHigh: '#56526e',
};

export const rosePineDawnColors = {
  base: '#faf4ed',
  surface: '#fffaf3',
  overlay: '#f2e9e1',
  muted: '#9893a5',
  subtle: '#797593',
  text: '#575279',
  love: '#b4637a',
  gold: '#ea9d34',
  rose: '#d7827e',
  pine: '#286983',
  foam: '#56949f',
  iris: '#907aa9',
  highlightLow: '#f4ede8',
  highlightMed: '#dfdad9',
  highlightHigh: '#cecacd',
};
