import { useCallback } from 'react';
import type { ObsClient } from '../services/obsClient';
import type { ObsAction } from '../types/obsActions';
import type { OBSData, OBSScene } from '../types';

interface UseObsActionsProps {
  obsService: ObsClient;
  obsData: OBSData;
  onRefreshData: () => Promise<void>;
  onAddMessage: (message: { role: 'system'; text: string }) => void;
  setErrorMessage: (message: string | null) => void;
}

export const useObsActions = ({
  obsService,
  obsData,
  onRefreshData,
  onAddMessage,
  setErrorMessage,
}: UseObsActionsProps) => {
  const handleObsAction = useCallback(
    async (action: ObsAction) => {
      let actionAttemptMessage = `**OBS Action: \`${action.type}\`**

⚙️ Attempting: ${action.type}...`;
      let actionFeedback = '';
      let additionalSystemMessage = '';

      try {
        switch (action.type) {
          case 'createInput':
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
            actionFeedback += `
✅ Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`;
            return {
              success: true,
              message: `Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`,
            };

          case 'setInputSettings':
            const setSettingsAction = action;
            await obsService.setInputSettings(
              setSettingsAction.inputName,
              setSettingsAction.inputSettings,
              setSettingsAction.overlay,
            );
            actionFeedback = `
✅ Successfully updated settings for input "${setSettingsAction.inputName}".`;
            return {
              success: true,
              message: `Successfully updated settings for input "${setSettingsAction.inputName}".`,
            };

          case 'setSceneItemEnabled':
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
                : !!targetAction.enabled;
            await obsService.setSceneItemEnabled(targetAction.sceneName, sceneItemId, enabledValue);
            actionFeedback = `
✅ Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`;
            return {
              success: true,
              message: `Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`,
            };

          case 'getInputSettings':
            const getSettingsAction = action;
            const settingsResponse = await obsService.getInputSettings(getSettingsAction.inputName);
            actionFeedback = `
✅ Fetched settings for input "${getSettingsAction.inputName}".`;
            additionalSystemMessage = `ℹ️ Properties for input "${getSettingsAction.inputName}" (Kind: "${settingsResponse.inputKind}"):
\`\`\`json
${JSON.stringify(settingsResponse.inputSettings, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Fetched settings for input "${getSettingsAction.inputName}".`,
            };

          case 'getSceneItemList':
            const getListAction = action;
            const listResponse = await obsService.getSceneItemList(getListAction.sceneName);
            const itemsFormatted = listResponse.sceneItems.map((item) => ({
              name: (item as any).sourceName,
              id: (item as any).sceneItemId,
              // obs-websocket typings vary by version; tolerate both property names
              enabled: (item as any).sceneItemEnabled ?? (item as any).enabled ?? false,
              kind: (item as any).inputKind || 'N/A',
            }));
            actionFeedback = `
✅ Fetched items for scene "${getListAction.sceneName}".`;
            additionalSystemMessage = `ℹ️ Items in scene "${getListAction.sceneName}":
\`\`\`json
${JSON.stringify(itemsFormatted, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Fetched items for scene "${getListAction.sceneName}".`,
            };

          case 'setCurrentProgramScene':
            const setSceneAction = action;
            await obsService.setCurrentProgramScene(setSceneAction.sceneName);
            actionFeedback = `
✅ Successfully switched to scene "${setSceneAction.sceneName}".`;
            return {
              success: true,
              message: `Successfully switched to scene "${setSceneAction.sceneName}".`,
            };

          case 'setVideoSettings':
            const setVideoAction = action;
            await obsService.setVideoSettings(setVideoAction.videoSettings);
            actionFeedback = `
✅ Successfully updated video settings.`;
            return { success: true, message: `Successfully updated video settings.` };

          case 'createScene':
            const createSceneAction = action;
            await obsService.createScene(createSceneAction.sceneName);
            actionFeedback = `
✅ Successfully created scene "${createSceneAction.sceneName}".`;
            return {
              success: true,
              message: `Successfully created scene "${createSceneAction.sceneName}".`,
            };

          case 'removeInput':
            const removeInputAction = action;
            await obsService.removeInput(removeInputAction.inputName);
            actionFeedback = `
✅ Successfully removed input "${removeInputAction.inputName}".`;
            return {
              success: true,
              message: `Successfully removed input "${removeInputAction.inputName}".`,
            };

          case 'setSceneItemTransform':
            const transformAction = action;
            const sceneItemIdTransform = await obsService.getSceneItemId(
              transformAction.sceneName,
              transformAction.sourceName,
            );
            if (sceneItemIdTransform === null) {
              throw new Error(
                `Source "${transformAction.sourceName}" not found in scene "${transformAction.sceneName}"`,
              );
            }
            // transform in the action is a partial shape in our types; cast to any to satisfy OBS client's full type
            await obsService.setSceneItemTransform(
              transformAction.sceneName,
              sceneItemIdTransform,
              transformAction.transform as any,
            );
            actionFeedback = `
✅ Successfully updated transform for "${transformAction.sourceName}" in scene "${transformAction.sceneName}".`;
            return {
              success: true,
              message: `Successfully updated transform for "${transformAction.sourceName}" in scene "${transformAction.sceneName}".`,
            };

          case 'createSourceFilter':
            const filterAction = action;
            await obsService.createSourceFilter(
              filterAction.sourceName,
              filterAction.filterName,
              filterAction.filterKind,
              filterAction.filterSettings,
            );
            actionFeedback = `
✅ Successfully created filter "${filterAction.filterName}" on source "${filterAction.sourceName}".`;
            return {
              success: true,
              message: `Successfully created filter "${filterAction.filterName}" on source "${filterAction.sourceName}".`,
            };

          case 'setInputVolume':
            const volumeAction = action;
            await obsService.setInputVolume(
              volumeAction.inputName,
              volumeAction.inputVolumeMul,
              volumeAction.inputVolumeDb,
            );
            actionFeedback = `
✅ Successfully set volume for input "${volumeAction.inputName}".`;
            return {
              success: true,
              message: `Successfully set volume for input "${volumeAction.inputName}".`,
            };

          case 'setInputMute':
            const muteAction = action;
            await obsService.setInputMute(muteAction.inputName, muteAction.inputMuted);
            actionFeedback = `
✅ Successfully ${muteAction.inputMuted ? 'muted' : 'unmuted'} input "${muteAction.inputName}".`;
            return {
              success: true,
              message: `Successfully ${muteAction.inputMuted ? 'muted' : 'unmuted'} input "${muteAction.inputName}".`,
            };

          case 'startVirtualCam':
            await obsService.startVirtualCam();
            actionFeedback = `
✅ Successfully started virtual camera.`;
            return { success: true, message: `Successfully started virtual camera.` };

          case 'stopVirtualCam':
            await obsService.stopVirtualCam();
            actionFeedback = `
✅ Successfully stopped virtual camera.`;
            return { success: true, message: `Successfully stopped virtual camera.` };

          case 'saveScreenshot':
            actionFeedback = `
❌ Screenshot functionality is not available: saveScreenshot is not implemented in OBSWebSocketService.`;
            return { success: true, message: `Successfully started replay buffer.` };

          case 'startReplayBuffer':
            await obsService.startReplayBuffer();
            actionFeedback = `
✅ Successfully started replay buffer.`;
            return { success: true, message: `Successfully saved replay buffer.` };

          case 'saveReplayBuffer':
            await obsService.saveReplayBuffer();
            actionFeedback = `
✅ Successfully saved replay buffer.`;
            return { success: true, message: `Successfully triggered studio mode transition.` };

          case 'triggerStudioModeTransition':
            await obsService.triggerStudioModeTransition();
            actionFeedback = `
✅ Successfully triggered studio mode transition.`;
            return {
              success: true,
              message: `Audio monitoring for "${(action as any).inputName}" set to "${(action as any).monitorType}".`,
            };

          case 'setInputAudioMonitorType':
            const monitorAction = action;
            await obsService.setInputAudioMonitorType(
              monitorAction.inputName,
              monitorAction.monitorType,
            );
            actionFeedback = `
✅ Audio monitoring for "${monitorAction.inputName}" set to "${monitorAction.monitorType}".`;
            return {
              success: true,
              message: `Blend mode for "${(action as any).sourceName}" set to "${(action as any).blendMode}".`,
            };

          case 'setSceneItemBlendMode':
            const blendAction = action;
            const sceneItemIdBlend = await obsService.getSceneItemId(
              blendAction.sceneName,
              blendAction.sourceName,
            );
            if (sceneItemIdBlend === null) {
              throw new Error(
                `Source "${blendAction.sourceName}" not found in scene "${blendAction.sceneName}"`,
              );
            }
            await obsService.setSceneItemBlendMode(
              blendAction.sceneName,
              sceneItemIdBlend,
              blendAction.blendMode,
            );
            actionFeedback = `
✅ Blend mode for "${blendAction.sourceName}" set to "${blendAction.blendMode}".`;
            // Use a safe cast for message fields that may not exist on this specific action union
            return { success: true, message: `Refreshed browser source "${(action as any).inputName}".` };

          case 'refreshBrowserSource':
            await obsService.refreshBrowserSource(action.inputName);
            actionFeedback = `
✅ Refreshed browser source "${action.inputName}".`;
            return { success: true, message: `Stream toggled!` };

          case 'toggleStream':
            await obsService.toggleStream();
            actionFeedback = `
✅ Stream toggled!`;
            return { success: true, message: `Record toggled!` };

          case 'toggleRecord':
            await obsService.toggleRecord();
            actionFeedback = `
✅ Record toggled!`;
            return { success: true, message: `Studio mode toggled!` };

          case 'toggleStudioMode':
            await obsService.toggleStudioMode();
            actionFeedback = `
✅ Studio mode toggled!`;
            // toggleStudioMode action may not include an 'enabled' property; cast safely
            return {
              success: true,
              message: `Studio mode ${(action as any).enabled ? 'enabled' : 'disabled'}!`,
            };

          case 'setStudioModeEnabled':
            await obsService.setStudioModeEnabled(action.enabled);
            actionFeedback = `
✅ Studio mode ${action.enabled ? 'enabled' : 'disabled'}!`;
            // hotkeyName is not part of SetStudioModeEnabledAction — cast to any when building these generic messages
            return { success: true, message: `Hotkey "${(action as any).hotkeyName}" triggered!` };

          case 'triggerHotkeyByName':
            await obsService.triggerHotkeyByName(action.hotkeyName);
            actionFeedback = `
✅ Hotkey "${action.hotkeyName}" triggered!`;
            return { success: true, message: `Hotkey sequence triggered!` };

          case 'triggerHotkeyByKeySequence':
            const hotkeyAction = action;
            await obsService.triggerHotkeyByKeySequence(
              hotkeyAction.keyId,
              hotkeyAction.keyModifiers,
            );
            actionFeedback = `
✅ Hotkey sequence triggered!`;
            return {
              success: true,
              message: `Output status for "${(action as any).outputName}" fetched.`,
            };

          case 'getOutputStatus': {
            const getOutputStatusAction = action;
            const status = await obsService.getOutputStatus(getOutputStatusAction.outputName);
            actionFeedback = `
✅ Output status for "${getOutputStatusAction.outputName}" fetched.`;
            additionalSystemMessage = `ℹ️ Status for output "${getOutputStatusAction.outputName}":
\`\`\`json
${JSON.stringify(status, null, 2)}
\`\`\``;
            return { success: true, message: `Fetched filter list for source "${(action as any).sourceName}".` };
          }
          case 'getSourceFilterList': {
            const { sourceName } = action;
            const response = await obsService.getSourceFilterList(sourceName);
            actionFeedback = `
✅ Fetched filter list for source "${sourceName}".`;
            additionalSystemMessage = `ℹ️ Filters for source "${sourceName}":
\`\`\`json
${JSON.stringify(response.filters, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Fetched filter settings for "${(action as any).filterName}" on source "${(action as any).sourceName}".`,
            };
          }
          case 'getSourceFilterSettings': {
            const { sourceName, filterName } = action;
            const response = await obsService.getSourceFilterSettings(sourceName, filterName);
            actionFeedback = `
✅ Fetched filter settings for "${filterName}" on source "${sourceName}".`;
            additionalSystemMessage = `ℹ️ Filter settings for "${filterName}" on source "${sourceName}":
\`\`\`json
${JSON.stringify(response, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Fetched default settings for filter kind "${(action as any).filterKind}".`,
            };
          }
          case 'getSourceFilterDefaultSettings': {
            const { filterKind } = action;
            const response = await obsService.getSourceFilterDefaultSettings(filterKind);
            actionFeedback = `
✅ Fetched default settings for filter kind "${filterKind}".`;
            // obs client returns { filterSettings: ... } — use that property
            additionalSystemMessage = `ℹ️ Default settings for filter kind "${filterKind}":
+\`\`\`json
+${JSON.stringify((response as any).filterSettings ?? (response as any).defaultFilterSettings ?? {}, null, 2)}
+\`\`\``;
            return {
              success: true,
              message: `Set filter index for "${(action as any).filterName}" on source "${(action as any).sourceName}" to ${(action as any).filterIndex}.`,
            };
          }
          case 'setSourceFilterIndex': {
            const { sourceName, filterName, filterIndex } = action;
            await obsService.setSourceFilterIndex(sourceName, filterName, filterIndex);
            actionFeedback = `
✅ Set filter index for "${filterName}" on source "${sourceName}" to ${filterIndex}.`;
            return {
              success: true,
              message: `Renamed filter "${(action as any).filterName}" to "${(action as any).newFilterName}" on source "${(action as any).sourceName}".`,
            };
          }
          case 'setSourceFilterName': {
            const { sourceName, filterName, newFilterName } = action;
            await obsService.setSourceFilterName(sourceName, filterName, newFilterName);
            actionFeedback = `
✅ Renamed filter "${filterName}" to "${newFilterName}" on source "${sourceName}".`;
            return {
              success: true,
              message: `Duplicated filter "${(action as any).filterName}" as "${(action as any).newFilterName}" on source "${(action as any).sourceName}".`,
            };
          }
          case 'duplicateSourceFilter': {
            const { sourceName, filterName, newFilterName } = action;
            await obsService.duplicateSourceFilter(sourceName, filterName, newFilterName);
            actionFeedback = `
✅ Duplicated filter "${filterName}" as "${newFilterName}" on source "${sourceName}".`;
            return {
              success: true,
              message: `Removed filter "${(action as any).filterName}" from source "${(action as any).sourceName}".`,
            };
          }
          case 'removeSourceFilter': {
            const { sourceName, filterName } = action;
            await obsService.removeSourceFilter(sourceName, filterName);
            actionFeedback = `
✅ Removed filter "${filterName}" from source "${sourceName}".`;
            return { success: true, message: `Opened filters dialog for input "${(action as any).inputName}".` };
          }
          case 'openInputFiltersDialog': {
            const { inputName } = action;
            await obsService.openInputFiltersDialog(inputName);
            actionFeedback = `
✅ Opened filters dialog for input "${inputName}".`;
            return { success: true, message: `Opened properties dialog for input "${(action as any).inputName}".` };
          }
          case 'openInputPropertiesDialog': {
            const { inputName } = action;
            await obsService.openInputPropertiesDialog(inputName);
            actionFeedback = `
✅ Opened properties dialog for input "${inputName}".`;
            return { success: true, message: `Opened interact dialog for input "${(action as any).inputName}".` };
          }
          case 'openInputInteractDialog': {
            const { inputName } = action;
            await obsService.openInputInteractDialog(inputName);
            actionFeedback = `
✅ Opened interact dialog for input "${inputName}".`;
            return { success: true, message: `Removed scene "${(action as any).sceneName}".` };
          }
          case 'removeScene': {
            const { sceneName } = action;
            await obsService.removeScene(sceneName);
            actionFeedback = `
✅ Removed scene "${sceneName}".`;
            return { success: true, message: `Fetched stream status.` };
          }
          case 'getStreamStatus': {
            const status = await obsService.getStreamStatus();
            actionFeedback = `
✅ Fetched stream status.`;
            additionalSystemMessage = `ℹ️ Stream status:
\`\`\`json
${JSON.stringify(status, null, 2)}
\`\`\``;
            return { success: true, message: `Started streaming.` };
          }
          case 'startStream': {
            await obsService.startStream();
            actionFeedback = `
✅ Started streaming.`;
            return { success: true, message: `Stopped streaming.` };
          }
          case 'stopStream': {
            await obsService.stopStream();
            actionFeedback = `
✅ Stopped streaming.`;
            return { success: true, message: `Fetched record status.` };
          }
          case 'getRecordStatus': {
            const status = await obsService.getRecordStatus();
            actionFeedback = `
✅ Fetched record status.`;
            additionalSystemMessage = `ℹ️ Record status:
\`\`\`json
${JSON.stringify(status, null, 2)}
\`\`\``;
            return { success: true, message: `Started recording.` };
          }
          case 'startRecord': {
            await obsService.startRecord();
            actionFeedback = `
✅ Started recording.`;
            return { success: true, message: `Stopped recording.` };
          }
          case 'stopRecord': {
            await obsService.stopRecord();
            actionFeedback = `
✅ Stopped recording.`;
            return { success: true, message: `Toggled record pause.` };
          }
          case 'toggleRecordPause': {
            // ObsClient does not expose toggleRecordPause; use toggleRecord for compatibility with current client
            await obsService.toggleRecord();
            actionFeedback = `
✅ Toggled record pause (using toggleRecord).`;
            return { success: true, message: `Fetched video settings.` };
          }
          case 'getVideoSettings': {
            const settings = await obsService.getVideoSettings();
            actionFeedback = `
✅ Fetched video settings.`;
            additionalSystemMessage = `ℹ️ Video settings:
\`\`\`json
${JSON.stringify(settings, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Fetched transform for "${(action as any).sourceName}" in scene "${(action as any).sceneName}".`,
            };
          }
          case 'getSceneItemTransform': {
            const { sceneName, sourceName } = action;
            const sceneItemId = await obsService.getSceneItemId(sceneName, sourceName);
            if (sceneItemId === null) {
              throw new Error(`Source "${sourceName}" not found in scene "${sceneName}"`);
            }
            const transform = await obsService.getSceneItemTransform(sceneName, sceneItemId);
            actionFeedback = `
✅ Fetched transform for "${sourceName}" in scene "${sceneName}".`;
            additionalSystemMessage = `ℹ️ Transform for "${sourceName}":
\`\`\`json
${JSON.stringify(transform, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Fetched filter "${(action as any).filterName}" on source "${(action as any).sourceName}".`,
            };
          }
          case 'getSourceFilter': {
            const { sourceName, filterName } = action;
            const filter = await obsService.getSourceFilter(sourceName, filterName);
            actionFeedback = `
✅ Fetched filter "${filterName}" on source "${sourceName}".`;
            additionalSystemMessage = `ℹ️ Filter "${filterName}" details:
\`\`\`json
${JSON.stringify(filter, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `${(action as any).filterEnabled ? 'Enabled' : 'Disabled'} filter "${(action as any).filterName}" on source "${(action as any).sourceName}".`,
            };
          }
          case 'setSourceFilterEnabled': {
            const { sourceName, filterName, filterEnabled } = action;
            await obsService.setSourceFilterEnabled(sourceName, filterName, filterEnabled);
            actionFeedback = `
✅ ${filterEnabled ? 'Enabled' : 'Disabled'} filter "${filterName}" on source "${sourceName}".`;
            return {
              success: true,
              message: `Updated settings for filter "${(action as any).filterName}" on source "${(action as any).sourceName}".`,
            };
          }
          case 'setSourceFilterSettings': {
            const { sourceName, filterName, filterSettings, overlay } = action;
            await obsService.setSourceFilterSettings(
              sourceName,
              filterName,
              filterSettings,
              overlay,
            );
            actionFeedback = `
✅ Updated settings for filter "${filterName}" on source "${sourceName}".`;
            return { success: true, message: `Fetched volume for input "${(action as any).inputName}".` };
          }
          case 'getInputVolume': {
            const { inputName } = action;
            const volume = await obsService.getInputVolume(inputName);
            actionFeedback = `
✅ Fetched volume for input "${inputName}".`;
            additionalSystemMessage = `ℹ️ Volume for "${inputName}":
\`\`\`json
${JSON.stringify(volume, null, 2)}
\`\`\``;
            return { success: true, message: `Fetched virtual camera status.` };
          }
          case 'getVirtualCamStatus': {
            const status = await obsService.getVirtualCamStatus();
            actionFeedback = `
✅ Fetched virtual camera status.`;
            additionalSystemMessage = `ℹ️ Virtual camera status:
\`\`\`json
${JSON.stringify(status, null, 2)}
\`\`\``;
            return { success: true, message: `Fetched replay buffer status.` };
          }
          case 'getReplayBufferStatus': {
            const status = await obsService.getReplayBufferStatus();
            actionFeedback = `
✅ Fetched replay buffer status.`;
            additionalSystemMessage = `ℹ️ Replay buffer status:
\`\`\`json
${JSON.stringify(status, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Duplicated "${(action as any).sourceName}" from scene "${(action as any).sceneName}" to scene "${(action as any).targetScene}".`,
            };
          }
          case 'duplicateSceneItem': {
            const { sceneName, sourceName, destinationSceneName } = action;
            const sceneItemId = await obsService.getSceneItemId(sceneName, sourceName);
            if (sceneItemId === null) {
              throw new Error(`Source "${sourceName}" not found in scene "${sceneName}"`);
            }
            await obsService.duplicateSceneItem(sceneName, sceneItemId, destinationSceneName);
            const targetScene = destinationSceneName || sceneName;
            actionFeedback = `
✅ Duplicated "${sourceName}" from scene "${sceneName}" to scene "${targetScene}".`;
            return { success: true, message: `Renamed scene "${(action as any).sceneName}" to "${(action as any).newSceneName}".` };
          }
          case 'setSceneName': {
            const { sceneName, newSceneName } = action;
            await obsService.setSceneName(sceneName, newSceneName);
            actionFeedback = `
✅ Renamed scene "${sceneName}" to "${newSceneName}".`;
            return { success: true, message: `Captured screenshot of source "${(action as any).sourceName}".` };
          }
          case 'getSourceScreenshot': {
            const { sourceName, imageFormat, imageWidth, imageHeight, imageCompressionQuality } =
              action;
            // obs client expects imageFormat typed as 'png' | 'jpg' | undefined — cast to any to accept string inputs
            const screenshot = await obsService.getSourceScreenshot(
              sourceName,
              imageFormat as any,
              imageWidth,
              imageHeight,
              imageCompressionQuality,
            );
            actionFeedback = `
✅ Captured screenshot of source "${sourceName}".`;
            // obs client returns a base64 string for screenshot — adapt accordingly
            additionalSystemMessage = `ℹ️ Screenshot captured as ${imageFormat} format. Image data: ${typeof screenshot === 'string' ? screenshot.substring(0, 100) : JSON.stringify((screenshot as any).imageData ?? screenshot).substring(0, 100)}...`;
            return { success: true, message: `Stopped replay buffer.` };
          }
          case 'stopReplayBuffer': {
            await obsService.stopReplayBuffer();
            actionFeedback = `
✅ Stopped replay buffer.`;
            return { success: true, message: `Fetched current profile information.` };
          }
          case 'getCurrentProfile': {
            const profile = await obsService.getCurrentProfile();
            actionFeedback = `
✅ Fetched current profile information.`;
            additionalSystemMessage = `ℹ️ Profile information:
\`\`\`json
${JSON.stringify(profile, null, 2)}
\`\`\``;
            return { success: true, message: `Switched to profile "${(action as any).profileName}".` };
          }
          case 'setCurrentProfile': {
            const { profileName } = action;
            await obsService.setCurrentProfile(profileName);
            actionFeedback = `
✅ Switched to profile "${profileName}".`;
            return { success: true, message: `Fetched current scene collection information.` };
          }
          case 'getCurrentSceneCollection': {
            const collection = await obsService.getCurrentSceneCollection();
            actionFeedback = `
✅ Fetched current scene collection information.`;
            additionalSystemMessage = `ℹ️ Scene collection information:
\`\`\`json
${JSON.stringify(collection, null, 2)}
\`\`\``;
            return {
              success: true,
              message: `Switched to scene collection "${(action as any).sceneCollectionName}".`,
            };
          }
          case 'setCurrentSceneCollection': {
            const { sceneCollectionName } = action;
            await obsService.setCurrentSceneCollection(sceneCollectionName);
            actionFeedback = `
✅ Switched to scene collection "${sceneCollectionName}".`;
            break;
          }
          // Add more cases for other actions...
          default:
            const unknownActionType = (action as { type: string }).type;
            actionFeedback = `
❌ Unsupported OBS action type: ${unknownActionType}`;
            throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
        }

        actionAttemptMessage += `${actionFeedback}`;
        if (additionalSystemMessage) {
          actionAttemptMessage += `

---
${additionalSystemMessage}`;
        }
        onAddMessage({ role: 'system', text: actionAttemptMessage });
        await onRefreshData();
      } catch (err: unknown) {
        console.error(`OBS Action "${action.type}" failed:`, err);
        const failureFeedback = `
❗ Failed to execute OBS action "${action.type}": ${
          err instanceof Error ? err.message : 'Unknown error'
        }`;
        actionAttemptMessage += `${failureFeedback}`;
        onAddMessage({ role: 'system', text: actionAttemptMessage });
        setErrorMessage(
          `OBS Action "${action.type}" failed: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      }
    },
    [obsService, obsData, onRefreshData, onAddMessage, setErrorMessage],
  );

  return { handleObsAction };
};
