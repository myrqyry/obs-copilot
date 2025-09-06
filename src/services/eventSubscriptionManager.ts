
import { obsClient } from './obsClient';
import { useWidgetStore } from '../store/widgetsStore';
import { logger } from '@/utils/logger';

class EventSubscriptionManager {
  private subscriptions = new Set<string>();
  private callbacks = new Map<string, (data: any) => void>();

  constructor() {
    // Initialize event listeners
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // Subscribe to scene change event
    obsClient.on('CurrentSceneChanged', (data: any) => {
      logger.info(`Scene changed to: ${data.sceneName}`);
      useWidgetStore.setState({ currentScene: data.sceneName });
    });

    // Subscribe to input mute changed
    obsClient.on('InputMuteStateChanged', (data: any) => {
      logger.info(`Input ${data.inputName} mute changed to: ${data.inputMuted}`);
      useWidgetStore.setState({ mutedInputs: { ...useWidgetStore.getState().mutedInputs, [data.inputName]: data.inputMuted } });
    });

    // Subscribe to input volume changed
    obsClient.on('InputVolumeChanged', (data: any) => {
      logger.info(`Input ${data.inputName} volume changed to: ${data.inputVolumeDb}`);
      useWidgetStore.setState({ volumeLevels: { ...useWidgetStore.getState().volumeLevels, [data.inputName]: data.inputVolumeDb } });
    });

    // Add more event subscriptions as needed
    // For example, SceneItemAdded, SceneItemRemoved, TransitionCreated, etc.

    // Subscribe to scene list changed
    obsClient.on('ScenesChanged', (data: any) => {
      logger.info('Scenes list changed');
      // Update store with new scene list if needed
      // useWidgetStore.setState({ availableScenes: data.scenes });
    });
  }

  subscribe(event: string, callback: (data: any) => void) {
    const eventKey = `subscription_${event}_${Date.now()}`;
    this.subscriptions.add(eventKey);
    this.callbacks.set(eventKey, callback);
    obsClient.on(event, callback);
    logger.info(`Subscribed to event: ${event}`);
  }

  unsubscribe(event: string, callback: (data: any) => void) {
    // Implementation to unsubscribe specific callback if needed
    logger.info(`Unsubscribed from