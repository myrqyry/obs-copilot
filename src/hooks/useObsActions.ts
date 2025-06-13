import { useCallback } from 'react';
import type { OBSWebSocketService } from '../services/obsService';
import type { ObsAction } from '../types/obsActions';
import type { OBSData } from '../types';

interface UseObsActionsProps {
    obsService: OBSWebSocketService;
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
    setErrorMessage
}: UseObsActionsProps) => {
    const handleObsAction = useCallback(async (action: ObsAction) => {
        let actionAttemptMessage = `**OBS Action: \`${action.type}\`**\n\n⚙️ Attempting: ${action.type}...`;
        let actionFeedback = "";
        let additionalSystemMessage = "";

        try {
            switch (action.type) {
                case 'createInput':
                    const createAction = action;
                    let sceneToAddTo = createAction.sceneName;
                    if (sceneToAddTo && !obsData.scenes.find((s: any) => s.sceneName === sceneToAddTo)) {
                        sceneToAddTo = obsData.currentProgramScene || undefined;
                    }
                    await obsService.createInput(
                        createAction.inputName,
                        createAction.inputKind,
                        createAction.inputSettings,
                        sceneToAddTo,
                        createAction.sceneItemEnabled
                    );
                    actionFeedback += `\n✅ Successfully created input "${createAction.inputName}" of kind "${createAction.inputKind}".`;
                    break;

                case 'setInputSettings':
                    const setSettingsAction = action;
                    await obsService.setInputSettings(
                        setSettingsAction.inputName,
                        setSettingsAction.inputSettings,
                        setSettingsAction.overlay
                    );
                    actionFeedback = `\n✅ Successfully updated settings for input "${setSettingsAction.inputName}".`;
                    break;

                case 'setSceneItemEnabled':
                    const targetAction = action;
                    const sceneItemId = await obsService.getSceneItemId(targetAction.sceneName, targetAction.sourceName);
                    if (sceneItemId === null) {
                        throw new Error(`Source "${targetAction.sourceName}" not found in scene "${targetAction.sceneName}"`);
                    }
                    const enabledValue = typeof targetAction.sceneItemEnabled === 'boolean'
                        ? targetAction.sceneItemEnabled
                        : !!targetAction.enabled;
                    await obsService.setSceneItemEnabled(targetAction.sceneName, sceneItemId, enabledValue);
                    actionFeedback = `\n✅ Successfully ${enabledValue ? 'enabled' : 'disabled'} "${targetAction.sourceName}" in scene "${targetAction.sceneName}".`;
                    break;

                case 'getInputSettings':
                    const getSettingsAction = action;
                    const settingsResponse = await obsService.getInputSettings(getSettingsAction.inputName);
                    actionFeedback = `\n✅ Fetched settings for input "${getSettingsAction.inputName}".`;
                    additionalSystemMessage = `ℹ️ Properties for input "${getSettingsAction.inputName}" (Kind: "${settingsResponse.inputKind}"):\n\`\`\`json\n${JSON.stringify(settingsResponse.inputSettings, null, 2)}\n\`\`\``;
                    break;

                case 'getSceneItemList':
                    const getListAction = action;
                    const listResponse = await obsService.getSceneItemList(getListAction.sceneName);
                    const itemsFormatted = listResponse.sceneItems.map(item => ({
                        name: item.sourceName,
                        id: item.sceneItemId,
                        enabled: item.sceneItemEnabled,
                        kind: item.inputKind || 'N/A'
                    }));
                    actionFeedback = `\n✅ Fetched items for scene "${getListAction.sceneName}".`;
                    additionalSystemMessage = `ℹ️ Items in scene "${getListAction.sceneName}":\n\`\`\`json\n${JSON.stringify(itemsFormatted, null, 2)}\n\`\`\``;
                    break;

                case 'setCurrentProgramScene':
                    const setSceneAction = action;
                    await obsService.setCurrentProgramScene(setSceneAction.sceneName);
                    actionFeedback = `\n✅ Successfully switched to scene "${setSceneAction.sceneName}".`;
                    break;

                case 'setVideoSettings':
                    const setVideoAction = action;
                    await obsService.setVideoSettings(setVideoAction.videoSettings);
                    actionFeedback = `\n✅ Successfully updated video settings.`;
                    break;

                case 'createScene':
                    const createSceneAction = action;
                    await obsService.createScene(createSceneAction.sceneName);
                    actionFeedback = `\n✅ Successfully created scene "${createSceneAction.sceneName}".`;
                    break;

                case 'removeInput':
                    const removeInputAction = action;
                    await obsService.removeInput(removeInputAction.inputName);
                    actionFeedback = `\n✅ Successfully removed input "${removeInputAction.inputName}".`;
                    break;

                case 'setSceneItemTransform':
                    const transformAction = action;
                    const sceneItemIdTransform = await obsService.getSceneItemId(
                        transformAction.sceneName,
                        transformAction.sourceName
                    );
                    if (sceneItemIdTransform === null) {
                        throw new Error(`Source "${transformAction.sourceName}" not found in scene "${transformAction.sceneName}"`);
                    }
                    await obsService.setSceneItemTransform(
                        transformAction.sceneName,
                        sceneItemIdTransform,
                        transformAction.transform
                    );
                    actionFeedback = `\n✅ Successfully updated transform for "${transformAction.sourceName}" in scene "${transformAction.sceneName}".`;
                    break;

                case 'createSourceFilter':
                    const filterAction = action;
                    await obsService.createSourceFilter(
                        filterAction.sourceName,
                        filterAction.filterName,
                        filterAction.filterKind,
                        filterAction.filterSettings
                    );
                    actionFeedback = `\n✅ Successfully created filter "${filterAction.filterName}" on source "${filterAction.sourceName}".`;
                    break;

                case 'setInputVolume':
                    const volumeAction = action;
                    await obsService.setInputVolume(volumeAction.inputName, volumeAction.inputVolumeMul, volumeAction.inputVolumeDb);
                    actionFeedback = `\n✅ Successfully set volume for input "${volumeAction.inputName}".`;
                    break;

                case 'setInputMute':
                    const muteAction = action;
                    await obsService.setInputMute(muteAction.inputName, muteAction.inputMuted);
                    actionFeedback = `\n✅ Successfully ${muteAction.inputMuted ? 'muted' : 'unmuted'} input "${muteAction.inputName}".`;
                    break;

                case 'startVirtualCam':
                    await obsService.startVirtualCam();
                    actionFeedback = `\n✅ Successfully started virtual camera.`;
                    break;

                case 'stopVirtualCam':
                    await obsService.stopVirtualCam();
                    actionFeedback = `\n✅ Successfully stopped virtual camera.`;
                    break;

                case 'saveScreenshot':
                    actionFeedback = `\n❌ Screenshot functionality is not available: saveScreenshot is not implemented in OBSWebSocketService.`;
                    break;

                case 'startReplayBuffer':
                    await obsService.startReplayBuffer();
                    actionFeedback = `\n✅ Successfully started replay buffer.`;
                    break;

                case 'saveReplayBuffer':
                    await obsService.saveReplayBuffer();
                    actionFeedback = `\n✅ Successfully saved replay buffer.`;
                    break;

                case 'triggerStudioModeTransition':
                    await obsService.triggerStudioModeTransition();
                    actionFeedback = `\n✅ Successfully triggered studio mode transition.`;
                    break;

                case 'setInputAudioMonitorType':
                    const monitorAction = action;
                    await obsService.setInputAudioMonitorType(monitorAction.inputName, monitorAction.monitorType);
                    actionFeedback = `\n✅ Audio monitoring for "${monitorAction.inputName}" set to "${monitorAction.monitorType}".`;
                    break;

                case 'setSceneItemBlendMode':
                    const blendAction = action;
                    const sceneItemIdBlend = await obsService.getSceneItemId(blendAction.sceneName, blendAction.sourceName);
                    if (sceneItemIdBlend === null) {
                        throw new Error(`Source "${blendAction.sourceName}" not found in scene "${blendAction.sceneName}"`);
                    }
                    await obsService.setSceneItemBlendMode(blendAction.sceneName, sceneItemIdBlend, blendAction.blendMode);
                    actionFeedback = `\n✅ Blend mode for "${blendAction.sourceName}" set to "${blendAction.blendMode}".`;
                    break;

                case 'refreshBrowserSource':
                    await obsService.refreshBrowserSource(action.inputName);
                    actionFeedback = `\n✅ Refreshed browser source "${action.inputName}".`;
                    break;

                case "toggleStream":
                    await obsService.toggleStream();
                    actionFeedback = "\n✅ Stream toggled!";
                    break;

                case "toggleRecord":
                    await obsService.toggleRecord();
                    actionFeedback = "\n✅ Record toggled!";
                    break;

                case "toggleStudioMode":
                    await obsService.toggleStudioMode();
                    actionFeedback = "\n✅ Studio mode toggled!";
                    break;

                case "setStudioModeEnabled":
                    await obsService.setStudioModeEnabled(action.enabled);
                    actionFeedback = `\n✅ Studio mode ${action.enabled ? "enabled" : "disabled"}!`;
                    break;

                case "triggerHotkeyByName":
                    await obsService.triggerHotkeyByName(action.hotkeyName);
                    actionFeedback = `\n✅ Hotkey "${action.hotkeyName}" triggered!`;
                    break;

                case "triggerHotkeyByKeySequence":
                    const hotkeyAction = action;
                    await obsService.triggerHotkeyByKeySequence(hotkeyAction.keyId, hotkeyAction.keyModifiers);
                    actionFeedback = `\n✅ Hotkey sequence triggered!`;
                    break;

                case 'getOutputStatus': {
                    const getOutputStatusAction = action;
                    const status = await obsService.getOutputStatus(getOutputStatusAction.outputName);
                    actionFeedback = `\n✅ Output status for "${getOutputStatusAction.outputName}" fetched.`;
                    additionalSystemMessage = `\u2139\uFE0F Status for output "${getOutputStatusAction.outputName}":\n\u0060\u0060\u0060json\n${JSON.stringify(status, null, 2)}\n\u0060\u0060\u0060`;
                    break;
                }
                case 'getSourceFilterList': {
                    const { sourceName } = action;
                    const response = await obsService.getSourceFilterList(sourceName);
                    actionFeedback = `\n✅ Fetched filter list for source "${sourceName}".`;
                    additionalSystemMessage = `\u2139\uFE0F Filters for source "${sourceName}":\n\u0060\u0060\u0060json\n${JSON.stringify(response.filters, null, 2)}\n\u0060\u0060\u0060`;
                    break;
                }
                case 'getSourceFilterSettings': {
                    const { sourceName, filterName } = action;
                    const response = await obsService.getSourceFilterSettings(sourceName, filterName);
                    actionFeedback = `\n✅ Fetched filter settings for "${filterName}" on source "${sourceName}".`;
                    additionalSystemMessage = `\u2139\uFE0F Filter settings for "${filterName}" on source "${sourceName}":\n\u0060\u0060\u0060json\n${JSON.stringify(response, null, 2)}\n\u0060\u0060\u0060`;
                    break;
                }
                case 'getSourceFilterDefaultSettings': {
                    const { filterKind } = action;
                    const response = await obsService.getSourceFilterDefaultSettings(filterKind);
                    actionFeedback = `\n✅ Fetched default settings for filter kind "${filterKind}".`;
                    additionalSystemMessage = `\u2139\uFE0F Default settings for filter kind "${filterKind}":\n\u0060\u0060\u0060json\n${JSON.stringify(response.defaultFilterSettings, null, 2)}\n\u0060\u0060\u0060`;
                    break;
                }
                case 'setSourceFilterIndex': {
                    const { sourceName, filterName, filterIndex } = action;
                    await obsService.setSourceFilterIndex(sourceName, filterName, filterIndex);
                    actionFeedback = `\n✅ Set filter index for "${filterName}" on source "${sourceName}" to ${filterIndex}.`;
                    break;
                }
                case 'setSourceFilterName': {
                    const { sourceName, filterName, newFilterName } = action;
                    await obsService.setSourceFilterName(sourceName, filterName, newFilterName);
                    actionFeedback = `\n✅ Renamed filter "${filterName}" to "${newFilterName}" on source "${sourceName}".`;
                    break;
                }
                case 'duplicateSourceFilter': {
                    const { sourceName, filterName, newFilterName } = action;
                    await obsService.duplicateSourceFilter(sourceName, filterName, newFilterName);
                    actionFeedback = `\n✅ Duplicated filter "${filterName}" as "${newFilterName}" on source "${sourceName}".`;
                    break;
                }
                case 'removeSourceFilter': {
                    const { sourceName, filterName } = action;
                    await obsService.removeSourceFilter(sourceName, filterName);
                    actionFeedback = `\n✅ Removed filter "${filterName}" from source "${sourceName}".`;
                    break;
                }
                // Add more cases for other actions...
                default:
                    const unknownActionType = (action as any).type;
                    actionFeedback = `\n❌ Unsupported OBS action type: ${unknownActionType}`;
                    throw new Error(`Unsupported OBS action type: ${unknownActionType}`);
            }

            actionAttemptMessage += `${actionFeedback}`;
            if (additionalSystemMessage) {
                actionAttemptMessage += `\n\n---\n${additionalSystemMessage}`;
            }
            onAddMessage({ role: 'system', text: actionAttemptMessage });
            await onRefreshData();
        } catch (err: any) {
            console.error(`OBS Action "${action.type}" failed:`, err);
            const failureFeedback = `\n❗ Failed to execute OBS action "${action.type}": ${(err as Error).message || 'Unknown error'}`;
            actionAttemptMessage += `${failureFeedback}`;
            onAddMessage({ role: 'system', text: actionAttemptMessage });
            setErrorMessage(`OBS Action "${action.type}" failed: ${(err as Error).message}`);
        }
    }, [obsService, obsData, onRefreshData, onAddMessage, setErrorMessage]);

    return { handleObsAction };
};
