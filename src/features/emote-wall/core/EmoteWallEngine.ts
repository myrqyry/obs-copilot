import OBSWebSocket from 'obs-websocket-js';
import { nanoid } from 'nanoid';
import { ChatEngine } from '@/features/chat/core/ChatEngine';
import { ChatMessage } from '@/features/chat/core/types';
import { EmoteEngine } from '@/features/chat/core/EmoteEngine';
import { AnimationEngine } from '../effects/AnimationEngine';
import { PhysicsEngine } from '../effects/PhysicsEngine';
import { ParticleSystem } from '../effects/ParticleSystem';
import { EmoteRenderer } from './EmoteRenderer';
import { EmoteInstance, EmoteWallConfig } from './types';
import { EmoteWallTheme } from '../presets/StylePresets';

export class EmoteWallEngine {
  private scene: HTMLElement;
  private activeEmotes: Map<string, EmoteInstance> = new Map();
  private config: EmoteWallConfig | null = null;
  private currentTheme: EmoteWallTheme | null = null;

  // Engines
  private animationEngine: AnimationEngine;
  private physicsEngine: PhysicsEngine;
  private particleSystem: ParticleSystem;
  private emoteRenderer: EmoteRenderer;
  private emoteParser: EmoteEngine;

  constructor(container: HTMLElement) {
    this.scene = container;
    this.animationEngine = new AnimationEngine();
    this.physicsEngine = new PhysicsEngine(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    this.emoteRenderer = new EmoteRenderer(this.scene);
    this.emoteParser = new EmoteEngine();

    this.particleSystem.start();
  }

  public setConfig(config: EmoteWallConfig) {
    this.config = config;
    if (config.theme.id !== this.currentTheme?.id) {
      this.applyTheme(config.theme);
    }
  }

  private applyTheme(theme: EmoteWallTheme) {
    this.currentTheme = theme;
    // Apply background
    this.scene.style.background = theme.environment.background;
    // Update physics properties
    this.physicsEngine.updateWorldProperties(theme.physics.config);
  }

  public connectToChat(chatEngine: ChatEngine) {
    chatEngine.addEventListener('message', (event) => {
      const customEvent = event as CustomEvent<ChatMessage>;
      this.processMessage(customEvent.detail);
    });
  }

  public connectToOBS(obsConnection: OBSWebSocket) {
    obsConnection.on('CurrentProgramSceneChanged', (data) => {
      this.adaptToScene(data.sceneName);
    });
  }

  private async processMessage(message: ChatMessage) {
    if (!this.config?.enabled || !this.currentTheme) return;

    const theme = this.currentTheme;
    const parsed = await this.emoteParser.parseMessage(message.raw, message.tags?.['room-id']);
    const emotes = parsed.emotes;

    if (emotes.length === 0) return;

    emotes.forEach((emoteData) => {
      const emoteId = `ew-${nanoid()}`;
      const element = this.emoteRenderer.renderEmote(emoteData.url, emoteId);

      const x = Math.random() * (this.scene.offsetWidth - element.offsetWidth);
      const y = Math.random() * (this.scene.offsetHeight - element.offsetHeight);
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;

      // Trigger particle explosion on creation
      if (theme.particles.explosionEnabled) {
        const imgElement = element.querySelector('img');
        if (imgElement) {
          this.particleSystem.createEmoteExplosion({ x, y }, imgElement, {
            count: theme.particles.explosionCount,
            power: theme.particles.explosionPower,
            lifespan: theme.particles.explosionLifespan,
          });
        }
      }

      // Add trail effect if enabled
      if (theme.particles.trailEnabled) {
        this.particleSystem.createTrailEffect(element, {
            color: theme.particles.trailColor,
            lifespan: theme.particles.trailLifespan,
        });
      }

      const onAnimationComplete = () => {
        if (theme.physics.enabled) {
          this.physicsEngine.addEmotePhysics(element, theme.physics.config);
        }
      };

      if (theme.emotes.animationStyle === 'physics' && theme.physics.enabled) {
        onAnimationComplete();
      } else {
        const animation = this.animationEngine.createEmoteEntrance(element, theme.emotes.animationStyle);
        animation.then(onAnimationComplete);
      }

      // Schedule removal from DOM and physics simulation
      setTimeout(() => {
        element.remove();
        this.activeEmotes.delete(emoteId);
        if (theme.physics.enabled) {
          this.physicsEngine.removeEmote(emoteId);
        }
        if (theme.particles.trailEnabled) {
          this.particleSystem.removeTrailEffect(emoteId);
        }
      }, theme.emotes.duration);

      this.activeEmotes.set(emoteId, { id: emoteId, element });
    });
  }

  private adaptToScene(sceneName: string) {
    console.log('Adapting Emote Wall to scene:', sceneName);
  }
}