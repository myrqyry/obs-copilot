import { useCallback } from 'react';
import { obsClient } from '@/services/obsClient';
import type { ObsAction, GeminiActionResponse } from '@/types/obsActions';
import type { OBSData, OBSScene, SupportedDataPart, StreamingHandlers } from '@/types';
import { logger } from '../utils/logger';
import { commandValidationService } from '@/services/commandValidationService';
import useUiStore from '@/store/uiStore';
import { handleAppError } from '@/lib/errorUtils';

interface UseObsActionsProps {
  obsData: OBSData;
  onRefreshData: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;
  streamingHandlers?: StreamingHandlers;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export const buildObsSystemMessage = (obsData: OBSData): string => {
  const sceneNames = obsData.scenes.map((s: OBSScene) => s.sceneName).join(', ');
  const sourceNames = obsData.sources?.map((s) => s.sourceName).join(', ') || '';
  return `**OBS Context:**\n- Current Scene: ${obsData.currentProgramScene || 'None'}\n- Available Scenes: ${sceneNames}\n- Available Sources: ${sourceNames}`;
};

export const useObsActions = ({
  obsData,
  onRefreshData,
  setErrorMessage,
}: UseObsActionsProps) => {
  const handleObsAction = useCallback(
    async (action: ObsAction): Promise<ActionResult> => {
      return new Promise<ActionResult>((resolve) => {
        const { showConfirmation } = useUiStore.getState();

        showConfirmation({
          title: 'Confirm AI Action',
          description: `Are you sure you want to execute the following OBS action: ${action.type}?`,
          onConfirm: async () => {
            try {
              if (!commandValidationService.validateObsAction(action)) {
                throw new Error('Invalid or disallowed OBS action.');
              }

              let successMessage = '';
              switch (action.type) {
                case 'createInput': {
                  const { inputName, inputKind, inputSettings, sceneItemEnabled } = action;
                  let { sceneName } = action;
                  if (sceneName && !obsData.scenes.find((s: OBSScene) => s.sceneName === sceneName)) {
                    sceneName = obsData.currentProgramScene || undefined;
                  }
                  
                  const params = {
                    inputName,
                    inputKind,
                    inputSettings,
                    sceneName,
                    sceneItemEnabled,
                  };

                  await obsClient.call('CreateInput', params);
                  successMessage = `Successfully created input "${inputName}" of kind "${inputKind}".`;
                  break;
                }

                case 'setInputSettings': {
                  const { inputName, inputSettings, overlay } = action;
                  await obsClient.call('SetInputSettings', { inputName, inputSettings, overlay });
                  successMessage = `Successfully updated settings for input "${inputName}".`;
                  break;
                }

                case 'setSceneItemEnabled': {
                  const { sceneName, sourceName, sceneItemEnabled } = action;
                  const { sceneItems } = await obsClient.call<{ sceneItems: { sourceName: string, sceneItemId: number }[] }>('GetSceneItemList', { sceneName });
                  const sceneItem = sceneItems.find(item => item.sourceName === sourceName);
                  
                  if (!sceneItem) {
                    throw new Error(`Source "${sourceName}" not found in scene "${sceneName}"`);
                  }
                  
                  const enabledValue = typeof sceneItemEnabled === 'boolean' ? sceneItemEnabled : false;
                  await obsClient.call('SetSceneItemEnabled', { sceneName, sceneItemId: sceneItem.sceneItemId, sceneItemEnabled: enabledValue });
                  successMessage = `Successfully ${enabledValue ? 'enabled' : 'disabled'} "${sourceName}" in scene "${sceneName}".`;
                  break;
                }

                default: {
                  const unknownActionType = (action as { type: string }).type;
                  throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
                }
              }

              await onRefreshData();

              resolve({
                success: true,
                message: successMessage,
              });
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              logger.error(`OBS Action "${action.type}" failed:`, err);
              setErrorMessage(`OBS Action "${action.type}" failed: ${errorMessage}`);

              resolve({
                success: false,
                message: errorMessage,
                error: errorMessage,
              });
            }
          },
        });
      });
    },
    [obsData, onRefreshData, setErrorMessage],
  );

  return {
    handleObsAction,
    buildObsSystemMessage: () => buildObsSystemMessage(obsData)
  };
};