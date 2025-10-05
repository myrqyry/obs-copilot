import OBSWebSocket from 'obs-websocket-js';
import { ChatEngine } from '@/features/chat/core/ChatEngine';
import { ChatMessage } from '@/features/chat/core/types';
import { EmoteInstance, EmoteWallConfig } from './types';

export class EmoteWallEngine {
  private scene: HTMLElement;
  private activeEmotes: Map<string, EmoteInstance> = new Map();
  private config: EmoteWallConfig | null = null;

  constructor(container: HTMLElement) {
    this.scene = container;
    this.setupEventListeners();
  }

  public setConfig(config: EmoteWallConfig) {
    this.config = config;
  }

  // Connect to the existing chat system
  public connectToChat(chatEngine: ChatEngine) {
    chatEngine.addEventListener('message', (event) => {
      const customEvent = event as CustomEvent<ChatMessage>;
      this.processMessage(customEvent.detail);
    });
  }

  // Connect to the existing OBS system
  public connectToOBS(obsConnection: OBSWebSocket) {
    // Note: The 'SceneChanged' event is deprecated in obs-websocket-js v5.
    // Use 'CurrentProgramSceneChanged' instead.
    obsConnection.on('CurrentProgramSceneChanged', (data) => {
      this.adaptToScene(data.sceneName);
    });
  }

  private setupEventListeners() {
    // Placeholder for event listeners
  }

  private processMessage(message: ChatMessage) {
    if (!this.config?.enabled) return;
    // Placeholder for message processing logic
    console.log('Processing message for Emote Wall:', message.raw);
  }

  private adaptToScene(sceneName: string) {
    // Placeholder for scene adaptation logic
    console.log('Adapting Emote Wall to scene:', sceneName);
  }
}