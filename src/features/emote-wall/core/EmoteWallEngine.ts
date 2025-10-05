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

export class EmoteWallEngine {
  private scene: HTMLElement;
  private activeEmotes: Map<string, EmoteInstance> = new Map();
  private config: EmoteWallConfig | null = null;

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
    this.setupEventListeners();
  }

  public setConfig(config: EmoteWallConfig) {
    this.config = config;
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

  private setupEventListeners() {
    // Placeholder for event listeners
  }

  private async processMessage(message: ChatMessage) {
    if (!this.config?.enabled) return;

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

      const shouldUsePhysics = this.config?.physicsEnabled;
      const animationStyle = this.config?.animationStyle || 'bounce';
      const useEffects = this.config?.effects;

      // Trigger particle explosion on creation
      if (useEffects?.explosions) {
        const imgElement = element.querySelector('img');
        if (imgElement) {
          this.particleSystem.createEmoteExplosion({ x, y }, imgElement);
        }
      }

      // Add trail effect if enabled
      if (useEffects?.trails) {
        this.particleSystem.createTrailEffect(element);
      }

      const onAnimationComplete = () => {
        if (shouldUsePhysics) {
          this.physicsEngine.addEmotePhysics(element);
        }
      };

      if (animationStyle === 'physics' && shouldUsePhysics) {
        onAnimationComplete();
      } else {
        const animation = this.animationEngine.createEmoteEntrance(element, animationStyle);
        animation.then(onAnimationComplete);
      }

      // Schedule removal from DOM and physics simulation
      setTimeout(() => {
        element.remove();
        this.activeEmotes.delete(emoteId);
        if (shouldUsePhysics) {
          this.physicsEngine.removeEmote(emoteId);
        }
        if (useEffects?.trails) {
          this.particleSystem.removeTrailEffect(emoteId);
        }
      }, this.config?.emoteDuration || 10000);

      this.activeEmotes.set(emoteId, { id: emoteId, element });
    });
  }

  private adaptToScene(sceneName: string) {
    console.log('Adapting Emote Wall to scene:', sceneName);
  }
}