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
    [key: string]: string;
  };
  accentColor?: string;
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
export const allThemes: Theme[] = [];

export const darkThemes = allThemes.filter((theme) => theme.type === 'dark');
export const lightThemes = allThemes.filter((theme) => theme.type === 'light');

export const getTheme = (name: string): Theme | undefined => {
  return allThemes.find((theme) => theme.name === name);
};

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
