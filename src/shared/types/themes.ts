/**
 * Theme definitions and color palettes for the application.
 * Colors are statically defined in constants/colors.ts and extended in tailwind.config.js for Tailwind utilities.
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

// Import from colors file to avoid circular dependency
import { catppuccinMochaColors } from '../constants/theme';

// These will be populated by themes.ts when it's imported
export let allThemes: Theme[] = [];
export const getTheme = (name: string): Theme | undefined => {
  return allThemes.find((theme) => theme.name === name);
};

export const setAllThemes = (themes: Theme[]) => {
  allThemes = themes;
};

export const darkThemes = () => allThemes.filter((theme) => theme.type === 'dark');
export const lightThemes = () => allThemes.filter((theme) => theme.type === 'light');

// Type definitions for catppuccin colors
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

// Re-export colors from constants (for backward compatibility)
export { catppuccinMochaColors } from '../constants/theme';
