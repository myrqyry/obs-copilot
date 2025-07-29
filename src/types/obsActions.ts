import type { OBSVideoSettings, GroundingChunk } from '../types';

export interface GeminiActionResponse {
  obsAction?: ObsAction | ObsAction[]; // Support both single actions and arrays
  responseText?: string;
  streamerBotAction?: {
    type: string;
    args?: Record<string, any>;
  };
  sources?: GroundingChunk[];
}

export interface ObsActionBase {
  type: string;
}

export interface CreateInputAction extends ObsActionBase {
  type: 'createInput';
  inputName: string;
  inputKind: string;
  inputSettings?: object;
  sceneName?: string;
  sceneItemEnabled?: boolean;
}

export interface SetInputSettingsAction extends ObsActionBase {
  type: 'setInputSettings';
  inputName: string;
  inputSettings: object;
  overlay?: boolean;
}

export interface SetSceneItemEnabledAction extends ObsActionBase {
  type: 'setSceneItemEnabled';
  sceneName: string;
  sourceName: string;
  sceneItemEnabled: boolean;
  enabled?: boolean;
}

export interface GetInputSettingsAction extends ObsActionBase {
  type: 'getInputSettings';
  inputName: string;
}

export interface GetSceneItemListAction extends ObsActionBase {
  type: 'getSceneItemList';
  sceneName: string;
}

export interface SetCurrentProgramSceneAction extends ObsActionBase {
  type: 'setCurrentProgramScene';
  sceneName: string;
}

export interface SetVideoSettingsAction extends ObsActionBase {
  type: 'setVideoSettings';
  videoSettings: OBSVideoSettings;
}

export interface CreateSceneAction extends ObsActionBase {
  type: 'createScene';
  sceneName: string;
}

export interface RemoveInputAction extends ObsActionBase {
  type: 'removeInput';
  inputName: string;
}

export interface SetSceneItemTransformAction extends ObsActionBase {
  type: 'setSceneItemTransform';
  sceneName: string;
  sourceName: string;
  transform: {
    positionX?: number;
    positionY?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    alignment?: number;
  };
}

export interface CreateSourceFilterAction extends ObsActionBase {
  type: 'createSourceFilter';
  sourceName: string;
  filterName: string;
  filterKind: string;
  filterSettings?: object;
}

export interface SetInputVolumeAction extends ObsActionBase {
  type: 'setInputVolume';
  inputName: string;
  inputVolumeMul?: number;
  inputVolumeDb?: number;
}

export interface SetInputMuteAction extends ObsActionBase {
  type: 'setInputMute';
  inputName: string;
  inputMuted: boolean;
}

export interface StartVirtualCamAction extends ObsActionBase {
  type: 'startVirtualCam';
}

export interface StopVirtualCamAction extends ObsActionBase {
  type: 'stopVirtualCam';
}

export interface SaveScreenshotAction extends ObsActionBase {
  type: 'saveScreenshot';
  imageFormat: string;
  imageFilePath: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface StartReplayBufferAction extends ObsActionBase {
  type: 'startReplayBuffer';
}

export interface SaveReplayBufferAction extends ObsActionBase {
  type: 'saveReplayBuffer';
}

export interface SetSourceFilterIndexAction extends ObsActionBase {
  type: 'setSourceFilterIndex';
  sourceName: string;
  filterName: string;
  filterIndex: number;
}

export interface SetSourceFilterNameAction extends ObsActionBase {
  type: 'setSourceFilterName';
  sourceName: string;
  filterName: string;
  newFilterName: string;
}

export interface DuplicateSourceFilterAction extends ObsActionBase {
  type: 'duplicateSourceFilter';
  sourceName: string;
  filterName: string;
  newFilterName: string;
}

export interface TriggerStudioModeTransitionAction extends ObsActionBase {
  type: 'triggerStudioModeTransition';
}

export interface SetInputAudioMonitorTypeAction extends ObsActionBase {
  type: 'setInputAudioMonitorType';
  inputName: string;
  monitorType:
    | 'OBS_MONITORING_TYPE_NONE'
    | 'OBS_MONITORING_TYPE_MONITOR_ONLY'
    | 'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT';
}

export interface SetSceneItemBlendModeAction extends ObsActionBase {
  type: 'setSceneItemBlendMode';
  sceneName: string;
  sourceName: string;
  blendMode: string;
}

export interface SetSceneNameAction extends ObsActionBase {
  type: 'setSceneName';
  sceneName: string;
  newSceneName: string;
}

export interface RefreshBrowserSourceAction extends ObsActionBase {
  type: 'refreshBrowserSource';
  inputName: string;
}

export interface GetLogFileListAction extends ObsActionBase {
  type: 'getLogFileList';
}

export interface GetLogFileAction extends ObsActionBase {
  type: 'getLogFile';
  logFile: string;
}

export interface SetStudioModeEnabledAction extends ObsActionBase {
  type: 'setStudioModeEnabled';
  enabled: boolean;
}

export interface ToggleStudioModeAction extends ObsActionBase {
  type: 'toggleStudioMode';
}

export interface TriggerHotkeyByNameAction extends ObsActionBase {
  type: 'triggerHotkeyByName';
  hotkeyName: string;
}

export interface TriggerHotkeyByKeySequenceAction extends ObsActionBase {
  type: 'triggerHotkeyByKeySequence';
  keyId: string;
  keyModifiers: { shift: boolean; control: boolean; alt: boolean; command: boolean };
}

export interface ToggleStreamAction extends ObsActionBase {
  type: 'toggleStream';
}

export interface ToggleRecordAction extends ObsActionBase {
  type: 'toggleRecord';
}

export interface GetSourceFilterListAction extends ObsActionBase {
  type: 'getSourceFilterList';
  sourceName: string;
}

export interface GetSourceFilterDefaultSettingsAction extends ObsActionBase {
  type: 'getSourceFilterDefaultSettings';
  filterKind: string;
}

export interface GetSourceFilterSettingsAction extends ObsActionBase {
  type: 'getSourceFilterSettings';
  sourceName: string;
  filterName: string;
}

export interface SetSourceFilterSettingsAction extends ObsActionBase {
  type: 'setSourceFilterSettings';
  sourceName: string;
  filterName: string;
  filterSettings: object;
  overlay?: boolean;
}

export interface SetSourceFilterEnabledAction extends ObsActionBase {
  type: 'setSourceFilterEnabled';
  sourceName: string;
  filterName: string;
  filterEnabled: boolean;
}

export interface RemoveSourceFilterAction extends ObsActionBase {
  type: 'removeSourceFilter';
  sourceName: string;
  filterName: string;
}

export interface GetInputDefaultSettingsAction extends ObsActionBase {
  type: 'getInputDefaultSettings';
  inputKind: string;
}

export interface GetOutputListAction extends ObsActionBase {
  type: 'getOutputList';
}

export interface GetOutputStatusAction extends ObsActionBase {
  type: 'getOutputStatus';
  outputName: string;
}

export interface StartOutputAction extends ObsActionBase {
  type: 'startOutput';
  outputName: string;
}

export interface StopOutputAction extends ObsActionBase {
  type: 'stopOutput';
  outputName: string;
}

export interface GetOutputSettingsAction extends ObsActionBase {
  type: 'getOutputSettings';
  outputName: string;
}

export interface SetOutputSettingsAction extends ObsActionBase {
  type: 'setOutputSettings';
  outputName: string;
  outputSettings: Record<string, any>;
}

export interface GetSceneTransitionListAction extends ObsActionBase {
  type: 'getSceneTransitionList';
}

export interface GetCurrentSceneTransitionAction extends ObsActionBase {
  type: 'getCurrentSceneTransition';
}

export interface SetCurrentSceneTransitionAction extends ObsActionBase {
  type: 'setCurrentSceneTransition';
  transitionName: string;
}

export interface SetSceneTransitionDurationAction extends ObsActionBase {
  type: 'setSceneTransitionDuration';
  transitionDuration: number;
}

export interface GetSceneTransitionCursorAction extends ObsActionBase {
  type: 'getSceneTransitionCursor';
}

export interface GetMediaInputStatusAction extends ObsActionBase {
  type: 'getMediaInputStatus';
  inputName: string;
}

export interface SetMediaInputCursorAction extends ObsActionBase {
  type: 'setMediaInputCursor';
  inputName: string;
  mediaCursor: number;
}

export interface OffsetMediaInputCursorAction extends ObsActionBase {
  type: 'offsetMediaInputCursor';
  inputName: string;
  mediaCursorOffset: number;
}

export interface TriggerMediaInputActionAction extends ObsActionBase {
  type: 'triggerMediaInputAction';
  inputName: string;
  mediaAction: string;
}

export interface GetCurrentPreviewSceneAction extends ObsActionBase {
  type: 'getCurrentPreviewScene';
}

export interface SetCurrentPreviewSceneAction extends ObsActionBase {
  type: 'setCurrentPreviewScene';
  sceneName: string;
}

export interface GetSceneItemLockedAction extends ObsActionBase {
  type: 'getSceneItemLocked';
  sceneName: string;
  sceneItemId: number;
}

export interface SetSceneItemLockedAction extends ObsActionBase {
  type: 'setSceneItemLocked';
  sceneName: string;
  sceneItemId: number;
  sceneItemLocked: boolean;
}

export interface GetSceneItemIndexAction extends ObsActionBase {
  type: 'getSceneItemIndex';
  sceneName: string;
  sceneItemId: number;
}

export interface SetSceneItemIndexAction extends ObsActionBase {
  type: 'setSceneItemIndex';
  sceneName: string;
  sceneItemId: number;
  sceneItemIndex: number;
}

export interface CreateSceneItemAction extends ObsActionBase {
  type: 'createSceneItem';
  sceneName: string;
  sourceName: string;
  sceneItemEnabled?: boolean;
}

export interface RemoveSceneItemAction extends ObsActionBase {
  type: 'removeSceneItem';
  sceneName: string;
  sceneItemId: number;
}

export interface GetStatsAction extends ObsActionBase {
  type: 'getStats';
}

export interface GetVersionAction extends ObsActionBase {
  type: 'getVersion';
}

export interface GetHotkeyListAction extends ObsActionBase {
  type: 'getHotkeyList';
}

export interface GetInputPropertiesListPropertyItemsAction extends ObsActionBase {
  type: 'getInputPropertiesListPropertyItems';
  inputName: string;
  propertyName: string;
}

export interface PressInputPropertiesButtonAction extends ObsActionBase {
  type: 'pressInputPropertiesButton';
  inputName: string;
  propertyName: string;
}

export interface GetInputAudioBalanceAction extends ObsActionBase {
  type: 'getInputAudioBalance';
  inputName: string;
}

export interface SetInputAudioBalanceAction extends ObsActionBase {
  type: 'setInputAudioBalance';
  inputName: string;
  inputAudioBalance: number;
}

export interface GetInputAudioSyncOffsetAction extends ObsActionBase {
  type: 'getInputAudioSyncOffset';
  inputName: string;
}

export interface SetInputAudioSyncOffsetAction extends ObsActionBase {
  type: 'setInputAudioSyncOffset';
  inputName: string;
  inputAudioSyncOffset: number;
}

export interface GetInputAudioTracksAction extends ObsActionBase {
  type: 'getInputAudioTracks';
  inputName: string;
}

export interface SetInputAudioTracksAction extends ObsActionBase {
  type: 'setInputAudioTracks';
  inputName: string;
  inputAudioTracks: Record<string, boolean>;
}

export interface DuplicateSceneAction extends ObsActionBase {
  type: 'duplicateScene';
  sceneName: string;
  duplicateSceneName?: string;
}

export interface GetSourceScreenshotAction extends ObsActionBase {
  type: 'getSourceScreenshot';
  sourceName: string;
  imageFormat: string;
  imageWidth?: number;
  imageHeight?: number;
  imageCompressionQuality?: number;
}

export interface SetCurrentSceneTransitionSettingsAction extends ObsActionBase {
  type: 'setCurrentSceneTransitionSettings';
  transitionSettings: object;
  overlay?: boolean;
}

export interface OpenInputPropertiesDialogAction extends ObsActionBase {
  type: 'openInputPropertiesDialog';
  inputName: string;
}

export interface OpenInputFiltersDialogAction extends ObsActionBase {
  type: 'openInputFiltersDialog';
  inputName: string;
}

export interface OpenInputInteractDialogAction extends ObsActionBase {
  type: 'openInputInteractDialog';
  inputName: string;
}

export interface RemoveSceneAction extends ObsActionBase {
  type: 'removeScene';
  sceneName: string;
}

export interface GetStreamStatusAction extends ObsActionBase {
  type: 'getStreamStatus';
}

export interface StartStreamAction extends ObsActionBase {
  type: 'startStream';
}

export interface StopStreamAction extends ObsActionBase {
  type: 'stopStream';
}

export interface GetRecordStatusAction extends ObsActionBase {
  type: 'getRecordStatus';
}

export interface StartRecordAction extends ObsActionBase {
  type: 'startRecord';
}

export interface StopRecordAction extends ObsActionBase {
  type: 'stopRecord';
}

export interface ToggleRecordPauseAction extends ObsActionBase {
  type: 'toggleRecordPause';
}

export interface GetVideoSettingsAction extends ObsActionBase {
  type: 'getVideoSettings';
}

export interface GetSceneItemTransformAction extends ObsActionBase {
  type: 'getSceneItemTransform';
  sceneName: string;
  sourceName: string;
}

export interface GetSourceFilterAction extends ObsActionBase {
  type: 'getSourceFilter';
  sourceName: string;
  filterName: string;
}

export interface GetInputVolumeAction extends ObsActionBase {
  type: 'getInputVolume';
  inputName: string;
}

export interface GetVirtualCamStatusAction extends ObsActionBase {
  type: 'getVirtualCamStatus';
}

export interface GetReplayBufferStatusAction extends ObsActionBase {
  type: 'getReplayBufferStatus';
}

export interface DuplicateSceneItemAction extends ObsActionBase {
  type: 'duplicateSceneItem';
  sceneName: string;
  sourceName: string;
  destinationSceneName?: string;
}

export interface StopReplayBufferAction extends ObsActionBase {
  type: 'stopReplayBuffer';
}

export interface GetCurrentProfileAction extends ObsActionBase {
  type: 'getCurrentProfile';
}

export interface SetCurrentProfileAction extends ObsActionBase {
  type: 'setCurrentProfile';
  profileName: string;
}

export interface GetCurrentSceneCollectionAction extends ObsActionBase {
  type: 'getCurrentSceneCollection';
}

export interface SetCurrentSceneCollectionAction extends ObsActionBase {
  type: 'setCurrentSceneCollection';
  sceneCollectionName: string;
}

export interface SetStreamInfoAction extends ObsActionBase {
  type: 'setStreamInfo';
  streamTitle?: string;
  streamCategory?: string;
  streamDescription?: string;
}

export type ObsAction =
  | CreateInputAction
  | SetInputSettingsAction
  | SetSceneItemEnabledAction
  | GetInputSettingsAction
  | GetSceneItemListAction
  | SetCurrentProgramSceneAction
  | SetVideoSettingsAction
  | CreateSceneAction
  | RemoveInputAction
  | SetSceneItemTransformAction
  | CreateSourceFilterAction
  | SetInputVolumeAction
  | SetInputMuteAction
  | StartVirtualCamAction
  | StopVirtualCamAction
  | SaveScreenshotAction
  | StartReplayBufferAction
  | SaveReplayBufferAction
  | SetSourceFilterIndexAction
  | SetSourceFilterNameAction
  | DuplicateSourceFilterAction
  | TriggerStudioModeTransitionAction
  | SetInputAudioMonitorTypeAction
  | SetSceneItemBlendModeAction
  | RefreshBrowserSourceAction
  | GetLogFileListAction
  | GetLogFileAction
  | ToggleStudioModeAction
  | SetStudioModeEnabledAction
  | TriggerHotkeyByNameAction
  | TriggerHotkeyByKeySequenceAction
  | GetSourceFilterListAction
  | GetSourceFilterDefaultSettingsAction
  | GetSourceFilterSettingsAction
  | SetSourceFilterSettingsAction
  | SetSourceFilterEnabledAction
  | RemoveSourceFilterAction
  | ToggleStreamAction
  | ToggleRecordAction
  | GetInputDefaultSettingsAction
  | GetOutputListAction
  | GetOutputStatusAction
  | StartOutputAction
  | StopOutputAction
  | GetOutputSettingsAction
  | SetOutputSettingsAction
  | GetSceneTransitionListAction
  | GetCurrentSceneTransitionAction
  | SetCurrentSceneTransitionAction
  | SetSceneTransitionDurationAction
  | GetSceneTransitionCursorAction
  | GetMediaInputStatusAction
  | SetMediaInputCursorAction
  | OffsetMediaInputCursorAction
  | TriggerMediaInputActionAction
  | GetCurrentPreviewSceneAction
  | SetCurrentPreviewSceneAction
  | GetSceneItemLockedAction
  | SetSceneItemLockedAction
  | GetSceneItemIndexAction
  | SetSceneItemIndexAction
  | CreateSceneItemAction
  | RemoveSceneItemAction
  | GetStatsAction
  | GetVersionAction
  | GetHotkeyListAction
  | GetInputPropertiesListPropertyItemsAction
  | PressInputPropertiesButtonAction
  | GetInputAudioBalanceAction
  | SetInputAudioBalanceAction
  | GetInputAudioSyncOffsetAction
  | SetInputAudioSyncOffsetAction
  | GetInputAudioTracksAction
  | SetInputAudioTracksAction
  | DuplicateSceneAction
  | GetSourceScreenshotAction
  | SetCurrentSceneTransitionSettingsAction
  | OpenInputPropertiesDialogAction
  | OpenInputFiltersDialogAction
  | OpenInputInteractDialogAction
  | SetSceneNameAction
  | RemoveSceneAction
  | GetStreamStatusAction
  | StartStreamAction
  | StopStreamAction
  | GetRecordStatusAction
  | StartRecordAction
  | StopRecordAction
  | ToggleRecordPauseAction
  | GetVideoSettingsAction
  | GetSceneItemTransformAction
  | GetSourceFilterAction
  | GetInputVolumeAction
  | GetVirtualCamStatusAction
  | GetReplayBufferStatusAction
  | DuplicateSceneItemAction
  | StopReplayBufferAction
  | GetCurrentProfileAction
  | SetCurrentProfileAction
  | GetCurrentSceneCollectionAction
  | SetCurrentSceneCollectionAction
  | SetStreamInfoAction;
