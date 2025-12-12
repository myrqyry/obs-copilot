import { useWidgetsStore } from '@/app/store/widgetsStore';
import { obsClient } from './obsClient';
import { EventSubscriptionManager } from './eventSubscriptionManager';
import { logger } from '@/shared/utils/logger';

export class StateSynchronizer {
  private eventManager = new EventSubscriptionManager();

  async syncAllState() {
    try {
      // Sync scenes
      const sceneResponse = await obsClient.call('GetSceneList');
      useWidgetsStore.setState({ availableScenes: sceneResponse.scenes || [] });

      // Sync current scene
      const currentSceneResponse = await obsClient.call('GetCurrentScene');
      useWidgetsStore.setState({ currentScene: currentSceneResponse.currentScene });

      // Sync inputs
      const inputListResponse = await obsClient.call('GetInputList');
      const inputs = inputListResponse.inputs || [];
      const mutedInputs = {};
      const volumeLevels = {};
      for (const input of inputs) {
        const muteResponse = await obsClient.call('GetInputMute', { inputName: input.inputName });
        mutedInputs[input.inputName] = muteResponse.inputMuted;

        const volumeResponse = await obsClient.call('GetInputVolume', { inputName: input.inputName });
        volumeLevels[input.inputName] = volumeResponse.inputVolumeDb;
      }
      useWidgetsStore.setState({ mutedInputs, volumeLevels });

      logger.info('State synchronized with OBS');
    } catch (error: any) {
      logger.error(`Failed to sync state with OBS: ${error.message}`);
    }
  }

  startPeriodicSync(intervalMs = 5000) {
    // Initial sync
    this.syncAllState();

    // Periodic sync
    setInterval(() => {
      this.syncAllState();
    }, intervalMs);

    logger.info(`Started periodic state sync every ${intervalMs}ms`);
  }

  stopPeriodicSync() {
    // Clear interval if needed
    logger.info('Stopped periodic state sync');
  }

  // Sync specific widget state
  async syncWidgetState(widgetId: string) {
    const widget = useWidgetsStore.getState().widgets[widgetId];
    if (widget && widget.config) {
      try {
        // Sync based on widget type
        if (widget.config.targetType === 'scene') {
          const currentScene = await obsClient.call('GetCurrentScene');
          useWidgetsStore.updateWidgetState(widgetId, { currentValue: currentScene.currentScene });
        } else if (widget.config.targetType === 'input') {
          const mute = await obsClient.call('GetInputMute', { inputName: widget.config.targetName });
          useWidgetsStore.updateWidgetState(widgetId, { currentValue: mute.inputMuted });
        }
        // Add more types
      } catch (error: any) {
        logger.error(`Failed to sync widget ${widgetId}: ${error.message}`);
      }
    }
  }
}

export const stateSynchronizer = new StateSynchronizer();