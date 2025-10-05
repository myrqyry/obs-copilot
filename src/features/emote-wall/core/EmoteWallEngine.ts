import OBSWebSocket from 'obs-websocket-js';
import { nanoid } from 'nanoid';
import { ChatEngine } from '@/features/chat/core/ChatEngine';
import { ChatMessage } from '@/features/chat/core/types';
import { EmoteEngine } from '@/features/chat/core/EmoteEngine';
import { AnimationEngine } from '../effects/AnimationEngine';
import { EmoteRenderer } from './EmoteRenderer';
import { EmoteInstance, EmoteWallConfig } from './types';

export class EmoteWallEngine {
  private scene: HTMLElement;
  private activeEmotes: Map<string, EmoteInstance> = new Map();
  private config: EmoteWallConfig | null = null;

  // Engines
  private animationEngine: AnimationEngine;
  private emoteRenderer: EmoteRenderer;
  private emoteParser: EmoteEngine;

  constructor(container: HTMLElement) {
    this.scene = container;
    this.animationEngine = new AnimationEngine();
    this.emoteRenderer = new EmoteRenderer(this.scene);
    this.emoteParser = new EmoteEngine();

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

      // Position randomly within the container
      const x = Math.random() * (this.scene.offsetWidth - 64);
      const y = Math.random() * (this.scene.offsetHeight - 64);
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;

      // Animate its entrance
      const animation = this.animationEngine.createEmoteEntrance(element, this.config?.animationStyle || 'bounce');

      // Remove the emote from the DOM after a delay
      animation.then(() => {
        setTimeout(() => {
          element.remove();
          this.activeEmotes.delete(emoteId);
        }, 5000); // Emote disappears after 5 seconds
      });

      this.activeEmotes.set(emoteId, { id: emoteId, element });
    });
  }

  private adaptToScene(sceneName: string) {
    console.log('Adapting Emote Wall to scene:', sceneName);
  }
}