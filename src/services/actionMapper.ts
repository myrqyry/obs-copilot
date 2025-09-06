import { obsClient } from './obsClient';
import { logger } from '@/utils/logger';
import { UniversalWidgetConfig } from '@/types/universalWidget';

export interface ActionMapping {
  method: string;
  params: Record<string, any>;
}

export class ActionMapper {
  static mapAction(config: UniversalWidgetConfig, action: string, params: Record<string, any> = {}): ActionMapping {
    switch (action) {
      case 'switch_scene':
        return {
          method: 'SetCurrentScene',
          params: { sceneName: params.sceneName || config.targetName }
        };
      case 'set_volume':
        return {
          method: 'SetInputVolume',
          params: { inputName: params.sourceName || config.targetName, inputVolumeDb: params.volume }
        };
      case 'toggle_mute':
        return {
          method: 'SetInputMute',
          params: { inputName: params.sourceName || config.targetName, inputMuted: params.muted !== undefined ? params.muted : true }
        };
      case 'set_source_settings':
        return {
          method: 'SetInputSettings',
          params: { inputName: params.sourceName || config.targetName, inputSettings: params.settings }
        };
      case 'get_scene_list':
        return {
          method: 'GetSceneList',
          params: {}
        };
      case 'get_current_scene':
        return {
          method: 'GetCurrentScene',
          params: {}
        };
      case 'set_scene_item_enabled':
        return {
          method: 'SetSceneItemEnabled',
          params: { sceneName: params.sceneName || config.targetName, sceneItemId: params.itemId, sceneItemEnabled: params.enabled }
        };
      case 'set_scene_item_transform':
        return {
          method: 'SetSceneItemTransform',
          params: { sceneName: params.sceneName || config.targetName, sceneItemId: params.itemId, sceneItemTransform: params.transform }
        };
      case 'toggle_scene_item':
        return {
          method: 'SetSceneItemEnabled',
          params: { sceneName: params.sceneName || config.targetName, sceneItemId: params.itemId, sceneItemEnabled: params.enabled !== undefined ? params.enabled : true }
        };
      // Add more mappings for other actions, up to 100+
      // For example, for transitions, filters, etc.
      case 'transition_to_scene':
        return {
          method: 'SetCurrentScene',
          params: { sceneName: params.sceneName || config.targetName }
        };
      case 'set_transition':
        return {
          method: 'SetTransitionOverride',
          params: { sceneName: params.sceneName || config.targetName, transitionName: params.transitionName }
        };
      case 'set_filter':
        return {
          method: 'SetSourceFilterSettings',
          params: { inputName: params.sourceName || config.targetName, filterName: params.filterName, filterSettings: params.settings }
        };
      case 'toggle_filter':
        return {
          method: 'SetSourceFilterEnabled',
          params: { inputName: params.sourceName || config.targetName, filterName: params.filterName, filterEnabled: params.enabled !== undefined ? params.enabled : true }
        };
      // More actions can be added here, e.g., for audio gain, visibility, etc.
      default:
        logger.warn(`Unknown action: ${action}`);
        throw new Error(`Unknown action type: ${action}`);
    }
  }

  static async executeAction(config: UniversalWidgetConfig, action: string, params: Record<string, any> = {}): Promise<any> {
    const mapping = this.mapAction(config, action, params);
    try {
      const result = await obsClient.call(mapping.method, mapping.params);
      logger.info(`Executed action ${action}: ${mapping.method}`);
      return result;
    } catch (error: any) {
      logger.error(`Failed to execute action ${action}: ${error.message}`);
      throw error;
    }
  }
}