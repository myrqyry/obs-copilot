export const DEFAULT_OBS_WEBSOCKET_URL =
  import.meta.env.VITE_OBS_WEBSOCKET_URL || 'ws://localhost:4455';

// Common video resolution presets
export const COMMON_RESOLUTIONS = [
  { label: '1920 × 1080 (1080p)', width: 1920, height: 1080 },
  { label: '1280 × 720 (720p)', width: 1280, height: 720 },
  { label: '1600 × 900 (900p)', width: 1600, height: 900 },
  { label: '2560 × 1440 (1440p)', width: 2560, height: 1440 },
  { label: '3840 × 2160 (4K)', width: 3840, height: 2160 },
  { label: '1366 × 768', width: 1366, height: 768 },
  { label: '1024 × 768', width: 1024, height: 768 },
  { label: '854 × 480 (480p)', width: 854, height: 480 },
  { label: '640 × 360 (360p)', width: 640, height: 360 },
  { label: 'Custom', width: 0, height: 0 }, // Special case for custom input
];

// Common FPS presets
export const COMMON_FPS = [
  { label: '60 FPS', numerator: 60, denominator: 1 },
  { label: '30 FPS', numerator: 30, denominator: 1 },
  { label: '24 FPS', numerator: 24, denominator: 1 },
  { label: '59.94 FPS', numerator: 60000, denominator: 1001 },
  { label: '29.97 FPS', numerator: 30000, denominator: 1001 },
  { label: '23.976 FPS', numerator: 24000, denominator: 1001 },
  { label: '25 FPS', numerator: 25, denominator: 1 },
  { label: '50 FPS', numerator: 50, denominator: 1 },
  { label: 'Custom', numerator: 0, denominator: 1 }, // Special case for custom input
];
