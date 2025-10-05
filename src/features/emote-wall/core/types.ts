import { EmoteWallTheme } from '../presets/StylePresets';

export interface EmoteInstance {
  id: string;
  element: HTMLElement;
}

export type AnimationStyle = 'bounce' | 'slide' | 'epic' | 'physics';

/**
 * Represents the runtime configuration for the Emote Wall feature.
 * It determines if the feature is active and which theme is currently applied.
 */
export interface EmoteWallConfig {
  enabled: boolean;
  theme: EmoteWallTheme;
}