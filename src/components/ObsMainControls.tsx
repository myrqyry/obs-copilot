

import React, { useState, useEffect } from 'react';
import { CatppuccinAccentColorName, OBSVideoSettings } from '../types';
import { OBSWebSocketService } from '../services/obsService';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useAppStore } from '../store/appStore';
import { COMMON_RESOLUTIONS, COMMON_FPS } from '../constants';

interface ObsMainControlsProps {
  obsService: OBSWebSocketService;
  onRefreshData: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;
  onSendToGeminiContext: (contextText: string) => void;
  accentColorName?: CatppuccinAccentColorName;
}

export const ObsMainControls: React.FC<ObsMainControlsProps> = ({
  obsService,
  onRefreshData,
  setErrorMessage,
  onSendToGeminiContext,
  accentColorName
}) => {
  // Use Zustand for OBS state
  const {
    scenes,
    currentProgramScene,
    sources,
    streamStatus,
    recordStatus,
    videoSettings: initialVideoSettings,
  } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(false);

  // Video settings state
  const [editableSettings, setEditableSettings] = useState<OBSVideoSettings | null>(initialVideoSettings);
  const [isVideoSettingsLoading, setIsVideoSettingsLoading] = useState(false);

  // Resolution and FPS dropdown states
  const [selectedBaseResolution, setSelectedBaseResolution] = useState<string>('Custom');
  const [selectedOutputResolution, setSelectedOutputResolution] = useState<string>('Custom');
  const [selectedFPS, setSelectedFPS] = useState<string>('Custom');
  const [customBaseResolution, setCustomBaseResolution] = useState('');
  const [customOutputResolution, setCustomOutputResolution] = useState('');
  const [customFPS, setCustomFPS] = useState('');

  useEffect(() => {
    setEditableSettings(initialVideoSettings);

    // Initialize dropdown selections based on current settings
    if (initialVideoSettings) {
      // Check for matching base resolution
      const baseResMatch = COMMON_RESOLUTIONS.find(
        res => res.width === initialVideoSettings.baseWidth && res.height === initialVideoSettings.baseHeight
      );
      setSelectedBaseResolution(baseResMatch ? baseResMatch.label : 'Custom');
      if (!baseResMatch) {
        setCustomBaseResolution(`${initialVideoSettings.baseWidth}x${initialVideoSettings.baseHeight}`);
      }

      // Check for matching output resolution
      const outputResMatch = COMMON_RESOLUTIONS.find(
        res => res.width === initialVideoSettings.outputWidth && res.height === initialVideoSettings.outputHeight
      );
      setSelectedOutputResolution(outputResMatch ? outputResMatch.label : 'Custom');
      if (!outputResMatch) {
        setCustomOutputResolution(`${initialVideoSettings.outputWidth}x${initialVideoSettings.outputHeight}`);
      }

      // Check for matching FPS
      const fpsMatch = COMMON_FPS.find(
        fps => fps.numerator === initialVideoSettings.fpsNumerator && fps.denominator === initialVideoSettings.fpsDenominator
      );
      setSelectedFPS(fpsMatch ? fpsMatch.label : 'Custom');
      if (!fpsMatch) {
        setCustomFPS(`${initialVideoSettings.fpsNumerator}/${initialVideoSettings.fpsDenominator}`);
      }
    }
  }, [initialVideoSettings]);

  const handleAction = async (action: () => Promise<any>) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await action();
      await onRefreshData();
    } catch (error: any) {
      console.error("OBS Action Error:", error);
      setErrorMessage(`Action failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Resolution and FPS dropdown handlers
  const handleBaseResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    setSelectedBaseResolution(selectedLabel);

    if (selectedLabel !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find(res => res.label === selectedLabel);
      if (resolution) {
        setEditableSettings({
          ...editableSettings,
          baseWidth: resolution.width,
          baseHeight: resolution.height,
        });
      }
    }
  };

  const handleOutputResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    setSelectedOutputResolution(selectedLabel);

    if (selectedLabel !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find(res => res.label === selectedLabel);
      if (resolution) {
        setEditableSettings({
          ...editableSettings,
          outputWidth: resolution.width,
          outputHeight: resolution.height,
        });
      }
    }
  };

  const handleFPSChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    setSelectedFPS(selectedLabel);

    if (selectedLabel !== 'Custom' && editableSettings) {
      const fps = COMMON_FPS.find(fps => fps.label === selectedLabel);
      if (fps) {
        setEditableSettings({
          ...editableSettings,
          fpsNumerator: fps.numerator,
          fpsDenominator: fps.denominator,
        });
      }
    }
  };

  const handleCustomResolutionChange = (value: string, type: 'base' | 'output') => {
    if (type === 'base') {
      setCustomBaseResolution(value);
    } else {
      setCustomOutputResolution(value);
    }

    // Parse WxH format
    const match = value.match(/^(\d+)x(\d+)$/);
    if (match && editableSettings) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);

      if (type === 'base') {
        setEditableSettings({
          ...editableSettings,
          baseWidth: width,
          baseHeight: height,
        });
      } else {
        setEditableSettings({
          ...editableSettings,
          outputWidth: width,
          outputHeight: height,
        });
      }
    }
  };

  const handleCustomFPSChange = (value: string) => {
    setCustomFPS(value);

    // Parse numerator/denominator format
    const match = value.match(/^(\d+)\/(\d+)$/) || value.match(/^(\d+)$/);
    if (match && editableSettings) {
      const numerator = parseInt(match[1], 10);
      const denominator = match[2] ? parseInt(match[2], 10) : 1;

      setEditableSettings({
        ...editableSettings,
        fpsNumerator: numerator,
        fpsDenominator: denominator,
      });
    }
  };

  const handleSaveVideoSettings = async () => {
    if (!editableSettings) return;
    setIsVideoSettingsLoading(true);
    setErrorMessage(null);
    try {
      await obsService.setVideoSettings(editableSettings);
      await onRefreshData();
    } catch (error: any) {
      console.error("Failed to save video settings:", error);
      setErrorMessage(`Failed to save video settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsVideoSettingsLoading(false);
    }
  };

  const handleSetCurrentScene = (sceneName: string) => {
    handleAction(() => obsService.setCurrentProgramScene(sceneName));
  };

  const toggleSourceVisibility = (sceneName: string, sceneItemId: number, enabled: boolean) => {
    handleAction(() => obsService.setSceneItemEnabled(sceneName, sceneItemId, !enabled));
  };

  const toggleStream = () => {
    if (streamStatus?.outputActive) {
      handleAction(() => obsService.stopStream());
    } else {
      handleAction(() => obsService.startStream());
    }
  };

  const toggleRecord = () => {
    if (recordStatus?.outputActive) {
      handleAction(() => obsService.stopRecord());
    } else {
      handleAction(() => obsService.startRecord());
    }
  };

  if (isLoading && !scenes.length && !currentProgramScene) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  return (
    <div className="space-y-3 p-1">
      <div className="bg-[var(--ctp-surface0)] p-2 rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--dynamic-accent)' }}>📡 Stream & Record Controls</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            onClick={toggleStream}
            variant={streamStatus?.outputActive ? 'danger' : 'success'}
            isLoading={isLoading}
            className="w-full"
            title={streamStatus?.outputActive ? `Streaming for ${streamStatus.outputTimecode}` : 'Start Streaming'}
            accentColorName={accentColorName}
            size="sm"
          >
            {streamStatus?.outputActive ? 'Stop Streaming' : 'Start Streaming'}
            {streamStatus?.outputActive && <span className="ml-1.5 text-xs opacity-80">({streamStatus.outputTimecode})</span>}
          </Button>
          <Button
            onClick={toggleRecord}
            variant={recordStatus?.outputActive ? 'danger' : 'success'}
            isLoading={isLoading}
            className="w-full"
            title={recordStatus?.outputActive ? `Recording for ${recordStatus.outputTimecode}` : 'Start Recording'}
            accentColorName={accentColorName}
            size="sm"
          >
            {recordStatus?.outputActive ? 'Stop Recording' : 'Start Recording'}
            {recordStatus?.outputActive && <span className="ml-1.5 text-xs opacity-80">({recordStatus.outputTimecode})</span>}
          </Button>
        </div>
      </div>

      <div className="bg-[var(--ctp-surface0)] p-2 rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--dynamic-accent)' }}>🎬 Scene Management</h3>
        {scenes.length === 0 && !isLoading && <p className="text-[var(--ctp-subtext0)] text-xs">No scenes found.</p>}
        <ul className="space-y-1 max-h-48 overflow-y-auto pr-1"> {/* Reduced max-h */}
          {scenes.map((scene: import("../types").OBSScene) => (
            <li key={scene.sceneName}
              className="flex justify-between items-center space-x-1 p-1 rounded-md hover:bg-[var(--ctp-surface1)] transition-all duration-150 ease-in-out">
              <Button
                onClick={() => handleSetCurrentScene(scene.sceneName)}
                variant={scene.sceneName === currentProgramScene ? 'primary' : 'secondary'}
                size="sm"
                className="flex-grow text-left justify-start"
                disabled={isLoading}
                title={`Switch to scene: ${scene.sceneName}`}
                accentColorName={accentColorName}
              >
                {scene.sceneName === currentProgramScene ? `🌟 ${scene.sceneName}` : scene.sceneName}
              </Button>
              <Button
                onClick={() => onSendToGeminiContext(`Regarding scene '${scene.sceneName}': `)}
                variant="secondary"
                size="sm"
                className="p-1 bg-[var(--ctp-surface2)] hover:bg-[var(--ctp-overlay0)] text-xs"
                title={`Send '${scene.sceneName}' context to Gemini Chat`}
                aria-label={`Send scene ${scene.sceneName} context to chat`}
                accentColorName={accentColorName}
              >
                💬
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {currentProgramScene && (
        <div className="bg-[var(--ctp-surface0)] p-2 rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--dynamic-accent)' }}>🖼️ Sources in '{currentProgramScene}'</h3>
          {sources.length === 0 && !isLoading && <p className="text-[var(--ctp-subtext0)] text-xs">No sources in this scene.</p>}
          <ul className="space-y-1 max-h-48 overflow-y-auto pr-1"> {/* Reduced max-h */}
            {sources.map((source: import("../types").OBSSource) => (
              <li key={source.sceneItemId} className="flex items-center justify-between p-1.5 bg-[var(--ctp-surface1)] rounded-md hover:bg-[var(--ctp-surface2)] transition-colors duration-150 ease-in-out">
                <div className="flex items-center space-x-1 overflow-hidden mr-1">
                  <span className={`truncate text-xs ${source.sceneItemEnabled ? 'text-[var(--ctp-text)]' : 'text-[var(--ctp-overlay0)] line-through italic'}`}>
                    {source.sceneItemEnabled ? '👁️' : '🙈'} {source.sourceName}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => toggleSourceVisibility(currentProgramScene, source.sceneItemId, source.sceneItemEnabled)}
                    variant={source.sceneItemEnabled ? 'secondary' : 'primary'}
                    size="sm"
                    isLoading={isLoading}
                    title={source.sceneItemEnabled ? `Hide ${source.sourceName}` : `Show ${source.sourceName}`}
                    accentColorName={accentColorName}
                  >
                    {source.sceneItemEnabled ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    onClick={() => onSendToGeminiContext(`Regarding source '${source.sourceName}' in scene '${currentProgramScene}': `)}
                    variant="secondary"
                    size="sm"
                    className="p-1 bg-[var(--ctp-surface2)] hover:bg-[var(--ctp-overlay0)] text-xs"
                    title={`Send '${source.sourceName}' context to Gemini Chat`}
                    aria-label={`Send source ${source.sourceName} context to chat`}
                    accentColorName={accentColorName}
                  >
                    💬
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Video Settings Section */}
      <div className="bg-[var(--ctp-surface0)] p-2 rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--dynamic-accent)' }}>🎞️ Video Settings</h3>

        {!editableSettings && !isVideoSettingsLoading ? (
          <p className="text-[var(--ctp-subtext0)] text-center p-4">🎥 Video settings not available or not loaded yet.</p>
        ) : !editableSettings && isVideoSettingsLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner size={8} />
            <span className="ml-2 text-[var(--ctp-subtext0)]">Loading video settings...</span>
          </div>
        ) : editableSettings ? (
          <>
            <div className="space-y-3">
              {/* Base (Canvas) Resolution */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--ctp-lavender)]">📺 Base (Canvas) Resolution</label>
                <select
                  value={selectedBaseResolution}
                  onChange={handleBaseResolutionChange}
                  disabled={isVideoSettingsLoading}
                  className="w-full px-3 py-2 text-sm bg-[var(--ctp-surface1)] border border-[var(--ctp-surface2)] rounded-md text-[var(--ctp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)] focus:border-transparent"
                >
                  {COMMON_RESOLUTIONS.map((res) => (
                    <option key={res.label} value={res.label}>
                      {res.label}
                    </option>
                  ))}
                </select>
                {selectedBaseResolution === 'Custom' && (
                  <TextInput
                    label="Custom Base Resolution (WxH)"
                    id="customBaseResolution"
                    name="customBaseResolution"
                    type="text"
                    value={customBaseResolution}
                    onChange={(e) => handleCustomResolutionChange(e.target.value, 'base')}
                    disabled={isVideoSettingsLoading}
                    accentColorName={accentColorName}
                    className="text-xs mt-2"
                    placeholder="e.g., 1920x1080"
                  />
                )}
              </div>

              {/* Output (Scaled) Resolution */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--ctp-lavender)]">📤 Output (Scaled) Resolution</label>
                <select
                  value={selectedOutputResolution}
                  onChange={handleOutputResolutionChange}
                  disabled={isVideoSettingsLoading}
                  className="w-full px-3 py-2 text-sm bg-[var(--ctp-surface1)] border border-[var(--ctp-surface2)] rounded-md text-[var(--ctp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)] focus:border-transparent"
                >
                  {COMMON_RESOLUTIONS.map((res) => (
                    <option key={res.label} value={res.label}>
                      {res.label}
                    </option>
                  ))}
                </select>
                {selectedOutputResolution === 'Custom' && (
                  <TextInput
                    label="Custom Output Resolution (WxH)"
                    id="customOutputResolution"
                    name="customOutputResolution"
                    type="text"
                    value={customOutputResolution}
                    onChange={(e) => handleCustomResolutionChange(e.target.value, 'output')}
                    disabled={isVideoSettingsLoading}
                    accentColorName={accentColorName}
                    className="text-xs mt-2"
                    placeholder="e.g., 1280x720"
                  />
                )}
              </div>

              {/* FPS */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--ctp-lavender)]">🎬 Frame Rate (FPS)</label>
                <select
                  value={selectedFPS}
                  onChange={handleFPSChange}
                  disabled={isVideoSettingsLoading}
                  className="w-full px-3 py-2 text-sm bg-[var(--ctp-surface1)] border border-[var(--ctp-surface2)] rounded-md text-[var(--ctp-text)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)] focus:border-transparent"
                >
                  {COMMON_FPS.map((fps) => (
                    <option key={fps.label} value={fps.label}>
                      {fps.label}
                    </option>
                  ))}
                </select>
                {selectedFPS === 'Custom' && (
                  <TextInput
                    label="Custom FPS (numerator/denominator or just number)"
                    id="customFPS"
                    name="customFPS"
                    type="text"
                    value={customFPS}
                    onChange={(e) => handleCustomFPSChange(e.target.value)}
                    disabled={isVideoSettingsLoading}
                    accentColorName={accentColorName}
                    className="text-xs mt-2"
                    placeholder="e.g., 60 or 30000/1001"
                  />
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={handleSaveVideoSettings}
                isLoading={isVideoSettingsLoading}
                disabled={isVideoSettingsLoading}
                variant="primary"
                size="sm"
                title="Save current video settings to OBS"
                accentColorName={accentColorName}
              >
                Save Video Settings 💾
              </Button>
            </div>
            <p className="text-xs text-[var(--ctp-subtext0)] mt-1.5">
              Note: Modifying settings can impact OBS performance. Ensure values are valid. Some settings may require an OBS restart to take full effect (not handled by this UI).
            </p>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size={10} />
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end"> {/* Reduced mt */}
        <Button
          onClick={onRefreshData}
          variant="secondary"
          isLoading={isLoading}
          size="sm"
          title="Refresh all OBS data"
          accentColorName={accentColorName}
        >
          Refresh Data 🔄
        </Button>
      </div>
    </div>
  );
};
