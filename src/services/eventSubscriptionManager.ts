
import { obsClient } from './obsClient';
import { useWidgetStore } from '../store/widgetsStore';
import { logger } from '@/utils/logger';

class EventSubscriptionManager {
  private widgetSubscriptions = new Map<string, Set<string>>(); // widgetId -> set of events
  private eventCallbacks = new Map<string, Map<string, (data: unknown, widgetId?: string) => void>>(); // event -> widgetId -> callback

  constructor() {
    // Initialize event listeners
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // Subscribe to scene change event
    obsClient.on('CurrentSceneChanged', (data: unknown) => {
      logger.info(`Scene changed to: ${(data as { sceneName: string }).sceneName}`);
      // Update global store if exists
      // useWidgetStore.setState({ currentScene: (data as { sceneName: string }).sceneName });
      this.handleWidgetEvent('CurrentSceneChanged', data);
    });

    // Subscribe to input mute changed
    obsClient.on('InputMuteStateChanged', (data: unknown) => {
      const inputName = (data as { inputName: string }).inputName;
      const inputMuted = (data as { inputMuted: boolean }).inputMuted;
      logger.info(`Input ${inputName} mute changed to: ${inputMuted}`);
      // useWidgetStore.setState({ mutedInputs: { ...useWidgetStore.getState().mutedInputs, [inputName]: inputMuted } });
      this.handleWidgetEvent('InputMuteStateChanged', data);
    });

    // Subscribe to input volume changed
    obsClient.on('InputVolumeChanged', (data: unknown) => {
      const inputName = (data as { inputName: string }).inputName;
      const inputVolumeDb = (data as { inputVolumeDb: number }).inputVolumeDb;
      logger.info(`Input ${inputName} volume changed to: ${inputVolumeDb}`);
      // useWidgetStore.setState({ volumeLevels: { ...useWidgetStore.getState().volumeLevels, [inputName]: inputVolumeDb } });
      this.handleWidgetEvent('InputVolumeChanged', data);
    });

    // Add more event subscriptions as needed
    // For example, SceneItemAdded, SceneItemRemoved, TransitionCreated, etc.

    // Subscribe to scene list changed
    obsClient.on('ScenesChanged', (data: unknown) => {
      logger.info('Scenes list changed');
      // Update store with new scene list if needed
      // useWidgetStore.setState({ availableScenes: (data as { scenes: string[] }).scenes });
      this.handleWidgetEvent('ScenesChanged', data);
    });
  }

  private handleWidgetEvent(event: string, data: unknown) {
    // Find widgets subscribed to this event and update their state
    for (const [widgetId, events] of this.widgetSubscriptions.entries()) {
      if (events.has(event)) {
        const callback = this.eventCallbacks.get(event)?.get(widgetId);
        if (callback) {
          callback(data, widgetId);
        }
      }
    }
  }

  subscribeToEvents(widgetId: string, events: string[]) {
    events.forEach(event => {
      if (!this.widgetSubscriptions.has(widgetId)) {
        this.widgetSubscriptions.set(widgetId, new Set());
      }
      this.widgetSubscriptions.get(widgetId)!.add(event);

      if (!this.eventCallbacks.has(event)) {
        this.eventCallbacks.set(event, new Map());
      }

      // Create callback that updates widget state
      const callback = (data: unknown, wid?: string) => {
        if (wid === widgetId) {
          // Update widget state via store
          // useWidgetsStore.getState().updateWidgetState(widgetId, { value: data, lastUpdated: Date.now() });
        }
      };

      this.eventCallbacks.get(event)!.set(widgetId, callback);
      // Note: Global events are already subscribed; this is for per-widget fine-tuning if needed
    });
    logger.info(`Subscribed widget ${widgetId} to events: ${Array.from(events)}`);
  }

  unsubscribeFromEvents(widgetId: string, events: string[]) {
    events.forEach(event => {
      const widgetEvents = this.widgetSubscriptions.get(widgetId);
      if (widgetEvents?.has(event)) {
        widgetEvents.delete(event);
        const eventMap = this.eventCallbacks.get(event);
        if (eventMap?.has(widgetId)) {
          eventMap.delete(widgetId);
        }
      }
    });
    if (this.widgetSubscriptions.get(widgetId)?.size === 0) {
      this.widgetSubscriptions.delete(widgetId);
    }
    logger.info(`Unsubscribed widget ${widgetId} from events: ${Array.from(events)}`);
  }

  subscribe(event: string, callback: (data: unknown) => void) {
    const eventKey = `subscription_${event}_${Date.now()}`;
    // Legacy subscribe method
    obsClient.on(event, callback);
    logger.info(`Subscribed to event: ${event}`);
  }

  unsubscribe(event: string, callback: (data: unknown) => void) {
    // Implementation to unsubscribe specific callback if needed
    obsClient.off(event, callback);
    logger.info(`Unsubscribed from ${event}`);
  }
}

export const eventSubscriptionManager = new EventSubscriptionManager();