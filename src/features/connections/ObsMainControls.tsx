import React, { useState, useEffect } from 'react';
import { CatppuccinAccentColorName, OBSVideoSettings, OBSScene, OBSSource, catppuccinAccentColorsHexMap } from '@/types';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { AddToContextButton } from '@/components/common/AddToContextButton';
import { LockToggle } from '@/components/common/LockToggle';
import { TextInput } from '@/components/common/TextInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import useConnectionsStore from '@/store/connectionsStore';
import { useLockStore } from '@/store/lockStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useChatStore } from '@/store/chatStore';
import { COMMON_RESOLUTIONS, COMMON_FPS } from '@/constants';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { handleAppError } from '@/lib/errorUtils'; // Import error utilities
// No need to import logger here, handleAppError uses it internally

export const ObsMainControls: React.FC = () => {
  const { obsServiceInstance: obsService, onRefreshData } = useConnectionsStore();
  const { actions: { addSystemMessageToChat, setGlobalErrorMessage: setErrorMessage } } = useChatStore();
  const accentColorName = useSettingsStore((state: { theme: { accent: CatppuccinAccentColorName } }) => state.theme.accent);
  // Collapsible state for each section
  const [openStream, setOpenStream] = useState(true);
  const [openScenes, setOpenScenes] = useState(true);
  const [openSources, setOpenSources] = useState(true);
  const [openVideo, setOpenVideo] = useState(true);
  const [openStats, setOpenStats] = useState(false);
  // Use Zustand for OBS state
  const {
    scenes,
    currentProgramScene,
    sources,
    streamStatus,
    recordStatus,
    videoSettings: initialVideoSettings,
    obsStats,
  } = useConnectionsStore();
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
        (res: { width: number; height: number; label: string }) => res.width === initialVideoSettings.baseWidth && res.height === initialVideoSettings.baseHeight
      );
      setSelectedBaseResolution(baseResMatch ? baseResMatch.label : 'Custom');
      if (!baseResMatch) {
        setCustomBaseResolution(`${initialVideoSettings.baseWidth}x${initialVideoSettings.baseHeight}`);
      }

      // Check for matching output resolution
      const outputResMatch = COMMON_RESOLUTIONS.find(
        (res: { width: number; height: number; label: string }) => res.width === initialVideoSettings.outputWidth && res.height === initialVideoSettings.outputHeight
      );
      setSelectedOutputResolution(outputResMatch ? outputResMatch.label : 'Custom');
      if (!outputResMatch) {
        setCustomOutputResolution(`${initialVideoSettings.outputWidth}x${initialVideoSettings.outputHeight}`);
      }

      // Check for matching FPS
      const fpsMatch = COMMON_FPS.find(
        (fps: { numerator: number; denominator: number; label: string }) => fps.numerator === initialVideoSettings.fpsNumerator && fps.denominator === initialVideoSettings.fpsDenominator
      );
      setSelectedFPS(fpsMatch ? fpsMatch.label : 'Custom');
      if (!fpsMatch) {
        setCustomFPS(`${initialVideoSettings.fpsNumerator}/${initialVideoSettings.fpsDenominator}`);
      }
    }
  }, [initialVideoSettings]);

  const handleAction = async (action: () => Promise<unknown>) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!obsService) {
        throw new Error('OBS Service is not connected.');
      }
      await action();
      await onRefreshData();
    } catch (error: unknown) {
      setErrorMessage(handleAppError('OBS Action', error));
    } finally {
      setIsLoading(false);
    }
  };

  // Resolution and FPS dropdown handlers
  const handleBaseResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    setSelectedBaseResolution(selectedLabel);

    if (selectedLabel !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find((res: { label: string; width: number; height: number }) => res.label === selectedLabel);
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
      const resolution = COMMON_RESOLUTIONS.find((res: { label: string; width: number; height: number }) => res.label === selectedLabel);
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
      const fps = COMMON_FPS.find((fps: { label: string; numerator: number; denominator: number }) => fps.label === selectedLabel);
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
    if (!editableSettings || !obsService) return;
    setIsVideoSettingsLoading(true);
    setErrorMessage(null);
    try {
      await obsService.setVideoSettings(editableSettings);
      await onRefreshData();
    } catch (error: unknown) {
      setErrorMessage(handleAppError('Failed to save video settings', error));
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
  const { isLocked } = useLockStore();
  const STREAM_RECORD_LOCK = 'streamRecord';
  const VIDEO_SETTINGS_LOCK = 'videoSettings';

  if (isLoading && !scenes.length && !currentProgramScene) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }


  // Get accent color hex from Zustand
  const accentColor = catppuccinAccentColorsHexMap[accentColorName || 'sky'] || '#89b4fa';

  return (
    <div className="space-y-2 max-w-4xl mx-auto p-0 sm:p-1">
      {/* Stream & Record Section */}
      <CollapsibleCard
        isOpen={openStream}
        onToggle={() => setOpenStream(!openStream)}
        title="Stream & Record"
        emoji="📡"
        accentColor={accentColor}
        className="relative group"
      >
        <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey={STREAM_RECORD_LOCK} />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center mb-1">
          <Button
            onClick={toggleStream}
            disabled={isLocked(STREAM_RECORD_LOCK)}
            className={`w-full sm:flex-1 ${streamStatus?.outputActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {streamStatus?.outputActive ? 'Stop Streaming' : 'Start Streaming'}
          </Button>
          <Button
            onClick={toggleRecord}
            disabled={isLocked(STREAM_RECORD_LOCK)}
            className={`flex-1 ${recordStatus?.outputActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {recordStatus?.outputActive ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>
        <div className="text-xs text-foreground">
          Stream: {streamStatus?.outputActive ? '🟢 Live' : '🔴 Stopped'} | Record: {recordStatus?.outputActive ? '🟢 Recording' : '🔴 Stopped'}
        </div>
      </CollapsibleCard>

      {/* Scenes Section */}
      <CollapsibleCard
        isOpen={openScenes}
        onToggle={() => setOpenScenes(!openScenes)}
        title="Scenes"
        emoji="🎬"
        accentColor={accentColor}
        className="relative group"
      >
        <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey="scenes" />
        </div>
        <ul className="space-y-1 sm:space-y-1.5">
          {scenes.map((scene: OBSScene) => (
            <li key={scene.sceneName} className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-1">
              <span className={`truncate text-sm py-1 xs:py-0 ${scene.sceneName === currentProgramScene ? 'font-bold text-accent' : ''}`}>{scene.sceneName}</span>
              <div className="flex items-center gap-1 self-end xs:self-center">
                <Button
                  onClick={() => handleSetCurrentScene(scene.sceneName)}
                  disabled={isLocked('scenes') || scene.sceneName === currentProgramScene}
                  variant="secondary"
                  size="sm"
                >
                  {scene.sceneName === currentProgramScene ? 'Active' : 'Switch'}
                </Button>
                <AddToContextButton
                  contextText={`OBS Scene: '${scene.sceneName}'${scene.sceneName === currentProgramScene ? ' (currently active)' : ''}`}
                  onAddToContext={addSystemMessageToChat}
                  disabled={isLocked('scenes')}
                  title={`Add scene '${scene.sceneName}' to chat context`}
                />
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      {/* Sources Section */}
      <CollapsibleCard
        isOpen={openSources}
        onToggle={() => setOpenSources(!openSources)}
        title="Sources"
        emoji="🖼️"
        accentColor={accentColor}
        className="relative group"
      >
        <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey="sources" />
        </div>
        <ul className="space-y-1 sm:space-y-1.5">
          {sources.map((source: OBSSource) => (
            <li key={source.sceneItemId} className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-1">
              <span className="truncate text-sm py-1 xs:py-0">{source.sourceName}</span>
              <div className="flex items-center gap-1 self-end xs:self-center">
                <Button
                  onClick={() => {
                    if (currentProgramScene) toggleSourceVisibility(currentProgramScene, source.sceneItemId, source.sceneItemEnabled);
                  }}
                  disabled={isLocked('sources') || !currentProgramScene}
                  variant={source.sceneItemEnabled ? 'default' : 'secondary'}
                  size="sm"
                >
                  {source.sceneItemEnabled ? 'Hide' : 'Show'}
                </Button>
                <AddToContextButton
                  contextText={`OBS Source: '${source.sourceName}' is ${source.sceneItemEnabled ? 'visible' : 'hidden'} in scene '${currentProgramScene || ''}'`}
                  onAddToContext={addSystemMessageToChat}
                  disabled={isLocked('sources') || !currentProgramScene}
                  title={`Add source '${source.sourceName}' to chat context`}
                />
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleCard>

      {/* Video Settings Section */}
      <CollapsibleCard
        isOpen={openVideo}
        onToggle={() => setOpenVideo(!openVideo)}
        title="Video Settings"
        emoji="🎥"
        accentColor={accentColor}
        className="relative group"
      >
        <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey={VIDEO_SETTINGS_LOCK} />
        </div>
        <div className="flex flex-col gap-2 sm:gap-1">
          {/* Base Resolution */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1">
            <label htmlFor="base-resolution-select" className="w-full xs:w-36 text-xs shrink-0">Base (Canvas) Resolution</label>
            <div className="flex-grow grid grid-cols-2 gap-1">
              <select
                id="base-resolution-select"
                className="input input-sm text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                value={selectedBaseResolution}
                onChange={handleBaseResolutionChange}
                disabled={isLocked(VIDEO_SETTINGS_LOCK)}
              >
                {COMMON_RESOLUTIONS.map((res: any) => (
                  <option key={res.label} value={res.label}>{res.label}</option>
                ))}
                <option value="Custom">Custom</option>
              </select>
              {selectedBaseResolution === 'Custom' && (
                <TextInput
                  value={customBaseResolution}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomResolutionChange(e.target.value, 'base')}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                  placeholder="e.g. 1920x1080"
                  className="input input-sm text-xs w-full"
                  size="sm"
                />
              )}
            </div>
          </div>
          {/* Output Resolution */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1">
            <label htmlFor="output-resolution-select" className="w-full xs:w-36 text-xs shrink-0">Output (Scaled) Resolution</label>
            <div className="flex-grow grid grid-cols-2 gap-1">
              <select
                id="output-resolution-select"
                className="input input-sm text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                value={selectedOutputResolution}
                onChange={handleOutputResolutionChange}
                disabled={isLocked(VIDEO_SETTINGS_LOCK)}
              >
                {COMMON_RESOLUTIONS.map((res: any) => (
                  <option key={res.label} value={res.label}>{res.label}</option>
                ))}
                <option value="Custom">Custom</option>
              </select>
              {selectedOutputResolution === 'Custom' && (
                <TextInput
                  value={customOutputResolution}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomResolutionChange(e.target.value, 'output')}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                  placeholder="e.g. 1280x720"
                  className="input input-sm text-xs w-full"
                  size="sm"
                />
              )}
            </div>
          </div>
          {/* Frame Rate */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1">
            <label htmlFor="fps-select" className="w-full xs:w-36 text-xs shrink-0">Frame Rate</label>
            <div className="flex-grow grid grid-cols-2 gap-1">
              <select
                id="fps-select"
                className="input input-sm text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                value={selectedFPS}
                onChange={handleFPSChange}
                disabled={isLocked(VIDEO_SETTINGS_LOCK)}
            >
              {COMMON_FPS.map((fps: any) => (
                <option key={fps.label} value={fps.label}>{fps.label}</option>
              ))}
              <option value="Custom">Custom</option>
            </select>
            {selectedFPS === 'Custom' && (
              <TextInput
                value={customFPS}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomFPSChange(e.target.value)}
                disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                placeholder="e.g. 30/1"
                className="input input-sm text-xs w-full"
                size="sm"
              />
            )}
            </div>
          </div>
          <div className="flex justify-start items-center gap-1 mt-2 sm:mt-1">
            <Button
              onClick={handleSaveVideoSettings}
              disabled={isLocked(VIDEO_SETTINGS_LOCK) || isVideoSettingsLoading || !editableSettings}
              variant="default"
              size="sm"
              className="w-full xs:w-auto"
            >
              {isVideoSettingsLoading ? <LoadingSpinner size={4} /> : 'Save Settings'}
            </Button>
          </div>
        </div>
      </CollapsibleCard>

      {/* Stats Section */}
      <CollapsibleCard
        isOpen={openStats}
        onToggle={() => setOpenStats(!openStats)}
        title="OBS Statistics"
        emoji="📊"
        accentColor={accentColor}
        className="relative group"
      >
        <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey="stats" />
        </div>
        {obsStats ? (
          <div className="text-xs space-y-0.5 sm:space-y-1">
            <div>CPU Usage: {obsStats.cpuUsage?.toFixed(1)}%</div>
            <div>Memory Usage: {(obsStats.memoryUsage / 1024 / 1024).toFixed(1)} MB</div>
            <div>FPS: {obsStats.fps?.toFixed(1)}</div>
            <div>Dropped Frames: {obsStats.droppedFrames || 0}</div>
            <div>Stream Time: {obsStats.streamTimecode || '00:00:00'}</div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No stats available</div>
        )}
      </CollapsibleCard>
    </div>
  );
};
