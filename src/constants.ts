import systemPromptRaw from './constants/prompts/geminiSystemPrompt.md?raw';

export const GEMINI_API_KEY_ENV_VAR = 'VITE_GEMINI_API_KEY';
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const DEFAULT_OBS_WEBSOCKET_URL = "ws://localhost:4455";

// Common video resolution presets
export const COMMON_RESOLUTIONS = [
  { label: "1920 × 1080 (1080p)", width: 1920, height: 1080 },
  { label: "1280 × 720 (720p)", width: 1280, height: 720 },
  { label: "1600 × 900 (900p)", width: 1600, height: 900 },
  { label: "2560 × 1440 (1440p)", width: 2560, height: 1440 },
  { label: "3840 × 2160 (4K)", width: 3840, height: 2160 },
  { label: "1366 × 768", width: 1366, height: 768 },
  { label: "1024 × 768", width: 1024, height: 768 },
  { label: "854 × 480 (480p)", width: 854, height: 480 },
  { label: "640 × 360 (360p)", width: 640, height: 360 },
  { label: "Custom", width: 0, height: 0 } // Special case for custom input
];

// Common FPS presets
export const COMMON_FPS = [
  { label: "60 FPS", numerator: 60, denominator: 1 },
  { label: "30 FPS", numerator: 30, denominator: 1 },
  { label: "24 FPS", numerator: 24, denominator: 1 },
  { label: "59.94 FPS", numerator: 60000, denominator: 1001 },
  { label: "29.97 FPS", numerator: 30000, denominator: 1001 },
  { label: "23.976 FPS", numerator: 24000, denominator: 1001 },
  { label: "25 FPS", numerator: 25, denominator: 1 },
  { label: "50 FPS", numerator: 50, denominator: 1 },
  { label: "Custom", numerator: 0, denominator: 1 } // Special case for custom input
];

export const INITIAL_SYSTEM_PROMPT = systemPromptRaw;

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
} as const;

export const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};
