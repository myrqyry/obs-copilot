export interface EmoteInstance {
  id: string;
  element: HTMLElement;
  // Properties for physics, animation, etc. will be added later
}

export type AnimationStyle = 'bounce' | 'slide' | 'epic' | 'physics';

export interface EmoteWallConfig {
  enabled: boolean;
  animationStyle: AnimationStyle;
  physicsEnabled: boolean;
  // Configuration properties will be expanded in later phases
}