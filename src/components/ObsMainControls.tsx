import React, { useState, useEffect } from 'react';
import { CatppuccinAccentColorName, OBSVideoSettings } from '../types';
import { OBSWebSocketService } from '../services/obsService';
import { Button } from './common/Button';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useAppStore } from '../store/appStore';
import { useLockStore } from '../store/lockStore';
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
  // Collapsible state for each section
  const [openStream, setOpenStream] = useState(true);
  const [openScenes, setOpenScenes] = useState(true);
  const [openSources, setOpenSources] = useState(true);
  const [openVideo, setOpenVideo] = useState(true);
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

  // Locks
  const { isLocked, setLock } = useLockStore();
  const STREAM_RECORD_LOCK = 'streamRecord';
  const VIDEO_SETTINGS_LOCK = 'videoSettings';

  if (isLoading && !scenes.length && !currentProgramScene) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  // Lock toggle button
  const LockToggle = ({ lockKey }: { lockKey: string }) => (
    <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
      <input
        type="checkbox"
        checked={isLocked(lockKey)}
        onChange={(e) => {
          e.stopPropagation();
          setLock(lockKey, e.target.checked);
        }}
        className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                   checked:bg-primary checked:border-transparent focus:outline-none 
                   focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                   transition duration-150 group-hover:border-border"
        title={isLocked(lockKey) ? 'Unlock section' : 'Lock section'}
      />
      <span className="group-hover:text-foreground transition-colors duration-200">
        <span className="mr-1">{isLocked(lockKey) ? '🔒' : '🔓'}</span>
        {isLocked(lockKey) ? 'Locked' : 'Lock'}
      </span>
    </label>
  );

  // Add to chat context button (shared)
  const AddToContextButton = ({
    onClick,
    title = 'Add to chat context',
    disabled = false,
    className = ''
  }: { onClick: () => void; title?: string; disabled?: boolean; className?: string }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`ml-2 p-1 rounded-full border border-border bg-card/90 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 shadow-md transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${className}`}
      title={title}
      aria-label={title}
    >
      <PlusCircleIcon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col gap-2 p-2 max-h-full overflow-y-auto">
      {/* Stream & Record Section */}
      <div className="mb-2 border-b border-border last:border-b-0 rounded-lg bg-card shadow">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors rounded-t-lg group"
          onClick={() => setOpenStream((v) => !v)}
          aria-expanded={openStream}
        >
          <span className="text-foreground font-semibold text-base flex items-center gap-2">📡 Stream & Record</span>
          <span className="flex items-center gap-2">
            <LockToggle lockKey={STREAM_RECORD_LOCK} />
            <span className="transition-transform duration-200 group-hover:text-primary">{openStream ? '▲' : '▼'}</span>
          </span>
        </button>
        {openStream && (
          <div className="px-6 pb-4 pt-2 animate-fade-in text-foreground">
            <div className="flex gap-4 items-center mb-2">
              <Button
                onClick={toggleStream}
                disabled={isLocked(STREAM_RECORD_LOCK)}
                variant="primary"
                accentColorName={accentColorName}
                size="sm"
              >
                {streamStatus?.outputActive ? 'Stop Streaming' : 'Start Streaming'}
              </Button>
              <Button
                onClick={toggleRecord}
                disabled={isLocked(STREAM_RECORD_LOCK)}
                variant="primary"
                accentColorName={accentColorName}
                size="sm"
              >
                {recordStatus?.outputActive ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>
            <div className="text-xs text-foreground">
              Stream: {streamStatus?.outputActive ? '🟢 Live' : '🔴 Stopped'} | Record: {recordStatus?.outputActive ? '🟢 Recording' : '🔴 Stopped'}
            </div>
          </div>
        )}
      </div>

      {/* Scenes Section */}
      <div className="mb-2 border-b border-border last:border-b-0 rounded-lg bg-card shadow">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors rounded-t-lg group"
          onClick={() => setOpenScenes((v) => !v)}
          aria-expanded={openScenes}
        >
          <span className="text-foreground font-semibold text-base flex items-center gap-2">🎬 Scenes</span>
          <span className="flex items-center gap-2">
            <LockToggle lockKey="scenes" />
            <span className="transition-transform duration-200 group-hover:text-primary">{openScenes ? '▲' : '▼'}</span>
          </span>
        </button>
        {openScenes && (
          <div className="px-6 pb-4 pt-2 animate-fade-in text-foreground">
            <ul className="space-y-2">
              {scenes.map((scene) => (
                <li key={scene.sceneName} className="flex items-center justify-between gap-2">
                  <span className={`truncate ${scene.sceneName === currentProgramScene ? 'font-bold text-accent' : ''}`}>{scene.sceneName}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleSetCurrentScene(scene.sceneName)}
                      disabled={isLocked('scenes') || scene.sceneName === currentProgramScene}
                      variant="secondary"
                      accentColorName={accentColorName}
                      size="sm"
                    >
                      {scene.sceneName === currentProgramScene ? 'Active' : 'Switch'}
                    </Button>
                    <AddToContextButton
                      onClick={() => onSendToGeminiContext(`OBS Scene: '${scene.sceneName}'${scene.sceneName === currentProgramScene ? ' (currently active)' : ''}`)}
                      disabled={isLocked('scenes')}
                      title={`Add scene '${scene.sceneName}' to chat context`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Sources Section */}
      <div className="mb-2 border-b border-border last:border-b-0 rounded-lg bg-card shadow">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors rounded-t-lg group"
          onClick={() => setOpenSources((v) => !v)}
          aria-expanded={openSources}
        >
          <span className="text-foreground font-semibold text-base flex items-center gap-2">🖼️ Sources</span>
          <span className="flex items-center gap-2">
            <LockToggle lockKey="sources" />
            <span className="transition-transform duration-200 group-hover:text-primary">{openSources ? '▲' : '▼'}</span>
          </span>
        </button>
        {openSources && (
          <div className="px-6 pb-4 pt-2 animate-fade-in text-foreground">
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={source.sceneItemId} className="flex items-center justify-between gap-2">
                  <span className="truncate">{source.sourceName}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => {
                        if (currentProgramScene) toggleSourceVisibility(currentProgramScene, source.sceneItemId, source.sceneItemEnabled);
                      }}
                      disabled={isLocked('sources') || !currentProgramScene}
                      variant={source.sceneItemEnabled ? 'primary' : 'secondary'}
                      accentColorName={accentColorName}
                      size="sm"
                    >
                      {source.sceneItemEnabled ? 'Hide' : 'Show'}
                    </Button>
                    <AddToContextButton
                      onClick={() => onSendToGeminiContext(`OBS Source: '${source.sourceName}' is ${source.sceneItemEnabled ? 'visible' : 'hidden'} in scene '${currentProgramScene || ''}'`)}
                      disabled={isLocked('sources') || !currentProgramScene}
                      title={`Add source '${source.sourceName}' to chat context`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Video Settings Section */}
      <div className="mb-2 border-b border-border last:border-b-0 rounded-lg bg-card shadow">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors rounded-t-lg group"
          onClick={() => setOpenVideo((v) => !v)}
          aria-expanded={openVideo}
        >
          <span className="text-foreground font-semibold text-base flex items-center gap-2">🎥 Video Settings</span>
          <span className="flex items-center gap-2">
            <LockToggle lockKey={VIDEO_SETTINGS_LOCK} />
            <span className="transition-transform duration-200 group-hover:text-primary">{openVideo ? '▲' : '▼'}</span>
          </span>
        </button>
        {openVideo && (
          <div className="px-6 pb-4 pt-2 animate-fade-in text-foreground">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="w-40 text-sm">Base (Canvas) Resolution</label>
                <select
                  className="input input-sm w-32"
                  value={selectedBaseResolution}
                  onChange={handleBaseResolutionChange}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                >
                  {COMMON_RESOLUTIONS.map(res => (
                    <option key={res.label} value={res.label}>{res.label}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
                {selectedBaseResolution === 'Custom' && (
                  <TextInput
                    value={customBaseResolution}
                    onChange={e => handleCustomResolutionChange(e.target.value, 'base')}
                    disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                    placeholder="e.g. 1920x1080"
                    className="input input-sm w-32 ml-2"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="w-40 text-sm">Output (Scaled) Resolution</label>
                <select
                  className="input input-sm w-32"
                  value={selectedOutputResolution}
                  onChange={handleOutputResolutionChange}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                >
                  {COMMON_RESOLUTIONS.map(res => (
                    <option key={res.label} value={res.label}>{res.label}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
                {selectedOutputResolution === 'Custom' && (
                  <TextInput
                    value={customOutputResolution}
                    onChange={e => handleCustomResolutionChange(e.target.value, 'output')}
                    disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                    placeholder="e.g. 1280x720"
                    className="input input-sm w-32 ml-2"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="w-40 text-sm">FPS</label>
                <select
                  className="input input-sm w-32"
                  value={selectedFPS}
                  onChange={handleFPSChange}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                >
                  {COMMON_FPS.map(fps => (
                    <option key={fps.label} value={fps.label}>{fps.label}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
                {selectedFPS === 'Custom' && (
                  <TextInput
                    value={customFPS}
                    onChange={e => handleCustomFPSChange(e.target.value)}
                    disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                    placeholder="e.g. 60 or 30000/1001"
                    className="input input-sm w-32 ml-2"
                  />
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  onClick={handleSaveVideoSettings}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK) || isVideoSettingsLoading}
                  variant="primary"
                  accentColorName={accentColorName}
                  size="sm"
                >
                  {isVideoSettingsLoading ? 'Saving...' : 'Save Video Settings'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
