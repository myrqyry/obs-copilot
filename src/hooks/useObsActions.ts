import { useCallback } from 'react';
import type { ObsClient } from '@/services/obsClient';
import type { ObsAction } from '@/types/obsActions';
import type { OBSData, OBSScene } from '@/types';

interface UseObsActionsProps {
  obsService: ObsClient;
  obsData: OBSData;
  onRefreshData: () => Promise<void>;
  onAddMessage: (message: { role: 'system'; text: string }) => void;
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
  onAddMessage,
  setErrorMessage,
}: UseObsActionsProps) => {
  const handleObsAction = useCallback(
    async (action: ObsAction): Promise<ActionResult> => {
      let actionAttemptMessage = `**OBS Action: \`${action.type}\`**\n\n⚙️ Attempting: ${action.type}...`;
      let actionFeedback = '';
      let additionalSystemMessage = '';
      let successMessage = '';

      try {
        switch (action.type) {
          case 'createInput': {
            const createAction = action;
            let sceneToAddTo = createAction.sceneName;
            if (sceneToAddTo && !obsData.scenes.find((s: OBSScene) => s.sceneName === sceneToAddTo)) {
              sceneToAddTo = obsData.currentProgramScene || undefined;
            }
            await obsService.createInput(
              createAction.inputName,
              createAction.inputKind,
              createAction.inputSettings,
              sceneToAddTo,
              createAction.sceneItemEnabled,
            );
            actionFeedback = `\n✅ Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`;
            successMessage = `Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`;
            break;
          }

          case 'setInputSettings': {
            const setSettingsAction = action;
            await obsService.setInputSettings(
              setSettingsAction.inputName,
              setSettingsAction.inputSettings,
              setSettingsAction.overlay,
            );
            actionFeedback = `\n✅ Successfully updated settings for input "${setSettingsAction.inputName}".`;
            successMessage = `Successfully updated settings for input "${setSettingsAction.inputName}".`;
            break;
          }

          case 'setSceneItemEnabled': {
            const targetAction = action;
            const sceneItemId = await obsService.getSceneItemId(
              targetAction.sceneName,
              targetAction.sourceName,
            );
            if (sceneItemId === null) {
              throw new Error(
                `Source "${targetAction.sourceName}" not found in scene "${targetAction.sceneName}"`,
              );
            }
            const enabledValue =
              typeof targetAction.sceneItemEnabled === 'boolean'
                ? targetAction.sceneItemEnabled
                : false;
            await obsService.setSceneItemEnabled(targetAction.sceneName, sceneItemId, enabledValue);
            actionFeedback = `\n✅ Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`;
            successMessage = `Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`;
            break;
          }

          default: {
            const unknownActionType = (action as { type: string }).type;
            actionFeedback = `\n❌ Unsupported OBS action type: ${unknownActionType}`;
            throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
          }
        }

        actionAttemptMessage += actionFeedback;
        if (additionalSystemMessage) {
          actionAttemptMessage += `\n\n---\n${additionalSystemMessage}`;
        }
        onAddMessage({ role: 'system', text: actionAttemptMessage });
        await onRefreshData();

        return {
          success: true,
          message: successMessage,
        };
      } catch (err: unknown) {
        console.error(`OBS Action "${action.type}" failed:`, err);
        const failureFeedback = `\n❗ Failed to execute OBS action "${action.type}": ${
          err instanceof Error ? err.message : 'Unknown error'
        }`;
        actionAttemptMessage += failureFeedback;
        onAddMessage({ role: 'system', text: actionAttemptMessage });
        setErrorMessage(
          `OBS Action "${action.type}" failed: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );

        return {
          success: false,
          message: err instanceof Error ? err.message : 'Unknown error',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    },
    [obsService, obsData, onRefreshData, onAddMessage, setErrorMessage],
  );

  return { handleObsAction };
};
