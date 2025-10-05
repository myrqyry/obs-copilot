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
  emoteDuration: number;
  effects: {
    explosions: boolean;
    trails: boolean;
    // Future effects can be added here
  };
}