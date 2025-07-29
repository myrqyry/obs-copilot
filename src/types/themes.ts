import { themes } from 'tm-themes';

export interface Theme {
  name: string;
  displayName: string;
  type: 'light' | 'dark';
  colors: {
    [key: string]: string;
  };
  accentColor?: string;
}

export const allThemes: Theme[] = themes.map((theme) => ({
  name: theme.name,
  displayName: theme.displayName,
  type: theme.type,
  colors: theme.colors,
  accentColor: theme.colors['editor.selectionBackground'] || '#888888',
}));

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
