
import { obsClient } from './obsClient';
import { logger } from '@/shared/utils/logger';
import { debounce } from '@/shared/lib/utils';
import { useWidgetsStore } from '@/app/store/widgetsStore';
import type {
  ObsEventPayload,
  CurrentSceneChangedEvent,
  InputMuteStateChangedEvent,
  InputVolumeChangedEvent,
  ScenesChangedEvent,
} from '@/shared/types/obsEvents';

export class EventSubscriptionManager {
  private widgetSubscriptions = new Map<string, Set<string>>(); // widgetId -> set of events
  private eventCallbacks = new Map<string, Map<string, (data: ObsEventPayload, widgetId?: string) => void>>(); // event -> widgetId -> callback
  private debouncedVolumeHandler: (data: InputVolumeChangedEvent) => void;

  constructor() {
    this.debouncedVolumeHandler = debounce((data: InputVolumeChangedEvent) => {
      this.handleWidgetEvent('InputVolumeChanged', data as ObsEventPayload);
    }, 150); // Debounce volume updates to avoid flooding state

    // Initialize event listeners
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Subscribe to scene change event
    obsClient.on('CurrentSceneChanged', (data: CurrentSceneChangedEvent) => {
      logger.info(`Scene changed to: ${data.sceneName}`);
      this.handleWidgetEvent('CurrentSceneChanged', data as ObsEventPayload);
    });

    // Subscribe to input mute changed
    obsClient.on('InputMuteStateChanged', (data: InputMuteStateChangedEvent) => {
      logger.info(`Input ${data.inputName} mute changed to: ${data.inputMuted}`);
      this.handleWidgetEvent('InputMuteStateChanged', data as ObsEventPayload);
    });

    // Subscribe to input volume changed
    obsClient.on('InputVolumeChanged', (data: InputVolumeChangedEvent) => {
      // This event fires very rapidly; use the debounced handler.
      this.debouncedVolumeHandler(data);
    });

    // Add more event subscriptions as needed
    // For example, SceneItemAdded, SceneItemRemoved, TransitionCreated, etc.

    // Subscribe to scene list changed
    obsClient.on('ScenesChanged', (data: ScenesChangedEvent) => {
      logger.info('Scenes list changed');
      this.handleWidgetEvent('ScenesChanged', data as ObsEventPayload);
    });
  }

  private handleWidgetEvent(event: string, data: ObsEventPayload) {
    // Find widgets subscribed to this event and update their state
    for (const [widgetId, events] of this.widgetSubscriptions.entries()) {
      if (events.has(event)) {
        const callback = this.eventCallbacks.get(event)?.get(widgetId);
        if (callback) {
          // data is already typed as ObsEventPayload here
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
      const callback = (_data: ObsEventPayload, wid?: string) => {
        if (wid === widgetId) {
          // Update widget state via store
          useWidgetsStore.getState().updateWidgetState(widgetId, { value: _data, lastUpdated: Date.now() });
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