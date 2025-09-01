import { useCallback } from 'react';
import type { ObsClientImpl } from '@/services/obsClient';
import type { ObsAction } from '@/types/obsActions';
import type { OBSData, OBSScene } from '@/types';
import { logger } from '../utils/logger'; // Import logger

interface UseObsActionsProps {
  obsService: ObsClientImpl;
  obsData: OBSData;
  onRefreshData: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export const useObsActions = ({
  obsService,
  obsData,
  onRefreshData,
  setErrorMessage,
}: UseObsActionsProps) => {
  const handleObsAction = useCallback(
    async (action: ObsAction): Promise<ActionResult> => {
      try {
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

            await obsService.call('CreateInput', params);
            successMessage = `Successfully created input "${inputName}" of kind "${inputKind}".`;
            break;
          }

          case 'setInputSettings': {
            const { inputName, inputSettings, overlay } = action;
            await obsService.call('SetInputSettings', { inputName, inputSettings, overlay });
            successMessage = `Successfully updated settings for input "${inputName}".`;
            break;
          }

          case 'setSceneItemEnabled': {
            const { sceneName, sourceName, sceneItemEnabled } = action;
            const { sceneItems } = await obsService.call<{ sceneItems: { sourceName: string, sceneItemId: number }[] }>('GetSceneItemList', { sceneName });
            const sceneItem = sceneItems.find(item => item.sourceName === sourceName);
            
            if (!sceneItem) {
              throw new Error(`Source "${sourceName}" not found in scene "${sceneName}"`);
            }
            
            const enabledValue = typeof sceneItemEnabled === 'boolean' ? sceneItemEnabled : false;
            await obsService.call('SetSceneItemEnabled', { sceneName, sceneItemId: sceneItem.sceneItemId, sceneItemEnabled: enabledValue });
            successMessage = `Successfully ${enabledValue ? 'enabled' : 'disabled'} "${sourceName}" in scene "${sceneName}".`;
            break;
          }

          default: {
            const unknownActionType = (action as { type: string }).type;
            throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
          }
        }

        await onRefreshData();

        return {
          success: true,
          message: successMessage,
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error(`OBS Action "${action.type}" failed:`, err);
        setErrorMessage(`OBS Action "${action.type}" failed: ${errorMessage}`);

        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
        };
      }
    },
    [obsService, obsData, onRefreshData, setErrorMessage],
  );

  return { handleObsAction };
};
