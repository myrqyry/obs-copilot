import { AnimationStyle } from '../core/types';

// --- Configuration Interfaces ---

/**
 * Defines the physics properties for emotes in a theme.
 */
export interface PhysicsConfig {
  restitution: number; // Bounciness (0-1)
  friction: number; // Friction against other objects (0-1)
  frictionAir: number; // Air resistance (0-1)
  gravity: number; // Vertical gravity force
}

/**
 * Defines the particle effect properties for a theme.
 */
export interface ParticleConfig {
  explosionEnabled: boolean;
  explosionCount: number;
  explosionPower: number;
  explosionLifespan: number; // in seconds

  trailEnabled: boolean;
  trailColor: string; // hex code
  trailLifespan: number; // in seconds
}

// --- Main Theme Interface ---

/**
 * Represents a complete theme for the Emote Wall, controlling all visual
 * and behavioral aspects.
 */
export interface EmoteWallTheme {
  id: string;
  name: string;
  description: string;

  // Visual environment settings
  environment: {
    background: string; // CSS background value
  };

  // Emote behavior
  emotes: {
    animationStyle: AnimationStyle;
    duration: number; // How long emotes stay on screen (in ms)
  };

  // Physics settings
  physics: {
    enabled: boolean;
    config: PhysicsConfig;
  };

  // Particle effects settings
  particles: ParticleConfig;
}

// --- Default Theme Definitions ---

export const DefaultThemes: Record<string, EmoteWallTheme> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'The standard, out-of-the-box experience.',
    environment: {
      background: 'transparent',
    },
    emotes: {
      animationStyle: 'bounce',
      duration: 15000,
    },
    physics: {
      enabled: true,
      config: {
        restitution: 0.6,
        friction: 0.1,
        frictionAir: 0.02,
        gravity: 0.5,
      },
    },
    particles: {
      explosionEnabled: true,
      explosionCount: 30,
      explosionPower: 150,
      explosionLifespan: 1.5,
      trailEnabled: true,
      trailColor: '#ffffff',
      trailLifespan: 0.4,
    },
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Dreams',
    description: 'Space-themed with floating emotes and star particles.',
    environment: {
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    },
    emotes: {
      animationStyle: 'physics',
      duration: 20000,
    },
    physics: {
      enabled: true,
      config: {
        restitution: 0.8,
        friction: 0.05,
        frictionAir: 0.05, // More "floaty"
        gravity: 0.1, // Low gravity
      },
    },
    particles: {
      explosionEnabled: true,
      explosionCount: 50,
      explosionPower: 100,
      explosionLifespan: 2.5,
      trailEnabled: true,
      trailColor: '#a8a2d1',
      trailLifespan: 0.8,
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Nights',
    description: 'Futuristic cyberpunk aesthetic with glitchy effects.',
    environment: {
      background: `
        linear-gradient(135deg, rgba(22, 22, 22, 0.8) 0%, rgba(50, 29, 84, 0.8) 100%),
        url('https://www.transparenttextures.com/patterns/carbon-fibre.png')
      `,
    },
    emotes: {
      animationStyle: 'slide',
      duration: 10000,
    },
    physics: {
      enabled: false,
      config: {
        // Default values, not used when physics is disabled
        restitution: 0.5,
        friction: 0.5,
        frictionAir: 0.1,
        gravity: 1,
      },
    },
    particles: {
      explosionEnabled: true,
      explosionCount: 20,
      explosionPower: 250,
      explosionLifespan: 1,
      trailEnabled: true,
      trailColor: '#00f2ff',
      trailLifespan: 0.3,
    },
  },
};