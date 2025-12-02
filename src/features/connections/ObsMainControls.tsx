import React, { useState, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { CatppuccinAccentColorName, OBSVideoSettings, OBSScene, OBSSource, catppuccinAccentColorsHexMap } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddToContextButton } from '@/components/common/AddToContextButton';
import { LockToggle } from '@/components/common/LockToggle';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import useConnectionsStore from '@/store/connections';
import { obsClient, ObsClientImpl as ObsClient } from '@/services/obsClient';
import { useLockStore } from '@/store/lockStore';
import useConfigStore from '@/store/configStore';
import { useChatStore } from '@/store/chatStore';
import { COMMON_RESOLUTIONS, COMMON_FPS } from '@/constants';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { handleAppError } from '@/lib/errorUtils'; // Import error utilities
// No need to import logger here, handleAppError uses it internally

export const ObsMainControls: React.FC = () => {
  const obsClient = useConnectionsStore((state) => state.obs);
  const onRefreshData = async () => {
    if (!obsClient) return;
    const { scenes } = await obsClient.call('GetSceneList');
    const { currentProgramSceneName } = await obsClient.call('GetCurrentProgramScene');
    const { sceneItems } = await obsClient.call('GetSceneItemList', { sceneName: currentProgramSceneName });
    const streamStatus = await obsClient.call('GetStreamStatus');
    const recordStatus = await obsClient.call('GetRecordStatus');
    const videoSettings = await obsClient.call('GetVideoSettings');
    useConnectionsStore.setState({
      scenes: scenes.map((s: any) => ({ sceneName: s.sceneName, sceneIndex: s.sceneIndex })),
      currentProgramScene: currentProgramSceneName,
      sources: sceneItems.map((item: any) => ({
        sourceName: item.sourceName,
        typeName: item.inputKind,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: item.sceneItemEnabled,
      })),
      streamStatus: streamStatus,
      recordStatus: recordStatus,
      videoSettings: videoSettings,
    });
  };
  const { actions: { addSystemMessageToChat, setGlobalErrorMessage: setErrorMessage } } = useChatStore();
  const accentColorName = useConfigStore((state: { theme: { accent: CatppuccinAccentColorName } }) => state.theme.accent);
  // Collapsible state for each section
  const [openStream, setOpenStream] = useState(true);
  const [openScenes, setOpenScenes] = useState(true);
  const [openSources, setOpenSources] = useState(true);
  const [openVideo, setOpenVideo] = useState(true);
  const [openStats, setOpenStats] = useState(false);
  // Use individual selectors to avoid shallow equality issues
  const scenes = useConnectionsStore((state) => state.scenes);
  const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);
  const sources = useConnectionsStore((state) => state.sources);
  const streamStatus = useConnectionsStore((state) => state.streamStatus);
  const recordStatus = useConnectionsStore((state) => state.recordStatus);
  const initialVideoSettings = useConnectionsStore((state) => state.videoSettings);
  const editableSettings = useConnectionsStore((state) => state.editableSettings);
  const storeSetEditableSettings = useConnectionsStore((state) => state.setEditableSettings);
  const [isLoading, setIsLoading] = React.useState(false);

  const [isVideoSettingsLoading, setIsVideoSettingsLoading] = useState(false);

  // Resolution and FPS dropdown states
  const [selectedBaseResolution, setSelectedBaseResolution] = useState<string>('Custom');
  const [selectedOutputResolution, setSelectedOutputResolution] = useState<string>('Custom');
  const [selectedFPS, setSelectedFPS] = useState<string>('Custom');
  const [customBaseResolution, setCustomBaseResolution] = useState('');
  const [customOutputResolution, setCustomOutputResolution] = useState('');
  const [customFPS, setCustomFPS] = useState('');

  useEffect(() => {
    storeSetEditableSettings(initialVideoSettings);

    // Initialize dropdown selections based on current settings
    if (editableSettings) {
      // Check for matching base resolution
      const baseResMatch = COMMON_RESOLUTIONS.find(
        (res: { width: number; height: number; label: string }) => res.width === editableSettings.baseWidth && res.height === editableSettings.baseHeight
      );
      setSelectedBaseResolution(baseResMatch ? baseResMatch.label : 'Custom');
      if (!baseResMatch) {
        setCustomBaseResolution(`${editableSettings.baseWidth}x${editableSettings.baseHeight}`);
      }

      // Check for matching output resolution
      const outputResMatch = COMMON_RESOLUTIONS.find(
        (res: { width: number; height: number; label: string }) => res.width === editableSettings.outputWidth && res.height === editableSettings.outputHeight
      );
      setSelectedOutputResolution(outputResMatch ? outputResMatch.label : 'Custom');
      if (!outputResMatch) {
        setCustomOutputResolution(`${editableSettings.outputWidth}x${editableSettings.outputHeight}`);
      }

      // Check for matching FPS
      const fpsMatch = COMMON_FPS.find(
        (fps: { numerator: number; denominator: number; label: string }) => fps.numerator === editableSettings.fpsNumerator && fps.denominator === editableSettings.fpsDenominator
      );
      setSelectedFPS(fpsMatch ? fpsMatch.label : 'Custom');
      if (!fpsMatch) {
        setCustomFPS(`${editableSettings.fpsNumerator}/${editableSettings.fpsDenominator}`);
      }
    }
  }, [editableSettings, storeSetEditableSettings]);

  const handleAction = async (action: () => Promise<unknown>) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!obsClient) {
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
  const handleBaseResolutionChange = (value: string) => {
    setSelectedBaseResolution(value);

    if (value !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find((res: { label: string; width: number; height: number }) => res.label === value);
      if (resolution) {
        storeSetEditableSettings({
          ...editableSettings,
          baseWidth: resolution.width,
          baseHeight: resolution.height,
        });
      }
    }
  };

  const handleOutputResolutionChange = (value: string) => {
    setSelectedOutputResolution(value);

    if (value !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find((res: { label: string; width: number; height: number }) => res.label === value);
      if (resolution) {
        storeSetEditableSettings({
          ...editableSettings,
          outputWidth: resolution.width,
          outputHeight: resolution.height,
        });
      }
    }
  };

  const handleFPSChange = (value: string) => {
    setSelectedFPS(value);

    if (value !== 'Custom' && editableSettings) {
      const fps = COMMON_FPS.find((fps: { label: string; numerator: number; denominator: number }) => fps.label === value);
      if (fps) {
        storeSetEditableSettings({
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
        storeSetEditableSettings({
          ...editableSettings,
          baseWidth: width,
          baseHeight: height,
        });
      } else {
        storeSetEditableSettings({
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

      storeSetEditableSettings({
        ...editableSettings,
        fpsNumerator: numerator,
        fpsDenominator: denominator,
      });
    }
  };

  const handleSaveVideoSettings = async () => {
    if (!editableSettings || !obsClient) return;
    setIsVideoSettingsLoading(true);
    setErrorMessage(null);
    try {
      await obsClient.call('SetVideoSettings', editableSettings);
      await onRefreshData();
    } catch (error: unknown) {
      setErrorMessage(handleAppError('Failed to save video settings', error));
    } finally {
      setIsVideoSettingsLoading(false);
    }
  };

  const handleSetCurrentScene = (sceneName: string) => {
    if (!obsClient) return;
    handleAction(() => obsClient.call('SetCurrentProgramScene', { sceneName }));
  };

  const toggleSourceVisibility = (sceneName: string, sceneItemId: number, enabled: boolean) => {
    if (!obsClient || !sceneName) return;
    handleAction(() => obsClient.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: !enabled }));
  };

  const toggleStream = () => {
    if (!obsClient) return;
    if (streamStatus?.outputActive) {
      handleAction(() => obsClient.call('StopStream'));
    } else {
      handleAction(() => obsClient.call('StartStream'));
    }
  };

  const toggleRecord = () => {
    if (!obsClient) return;
    if (recordStatus?.outputActive) {
      handleAction(() => obsClient.call('StopRecord'));
    } else {
      handleAction(() => obsClient.call('StartRecord'));
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
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Stream & Record Section */}
      <CollapsibleCard
        title="Stream & Record"
        emoji="📡"
        className="relative group"
        isOpen={openStream}
        onToggle={() => setOpenStream(!openStream)}
      >
        <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey={STREAM_RECORD_LOCK} />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center mb-1">
          <Button
            onClick={toggleStream}
            disabled={isLocked(STREAM_RECORD_LOCK)}
            variant={streamStatus?.outputActive ? "destructive" : "default"}
            className="w-full sm:flex-1"
            size="sm"
          >
            {streamStatus?.outputActive ? 'Stop Streaming' : 'Start Streaming'}
          </Button>
          <Button
            onClick={toggleRecord}
            disabled={isLocked(STREAM_RECORD_LOCK)}
            variant={recordStatus?.outputActive ? "destructive" : "accent"}
            className="flex-1"
            size="sm"
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
            title="Scenes"
            emoji="🎬"
            className="relative group"
            isOpen={openScenes}
            onToggle={() => setOpenScenes(!openScenes)}
          >
            <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
              <LockToggle lockKey="scenes" />
            </div>
            <ul className="space-y-1.5">
              {scenes.map((scene: OBSScene) => (
                <li key={scene.sceneName} className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className={`truncate text-sm ${scene.sceneName === currentProgramScene ? 'font-bold text-accent' : ''}`}>{scene.sceneName}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleSetCurrentScene(scene.sceneName)}
                      disabled={isLocked('scenes') || scene.sceneName === currentProgramScene}
                      variant="outline"
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
            title="Sources"
            emoji="🖼️"
            className="relative group"
            isOpen={openSources}
            onToggle={() => setOpenSources(!openSources)}
          >
            <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
              <LockToggle lockKey="sources" />
            </div>
            <ul className="space-y-1.5">
              {sources.map((source: OBSSource) => (
                <li key={source.sceneItemId} className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="truncate text-sm">{source.sourceName}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => {
                        if (currentProgramScene) toggleSourceVisibility(currentProgramScene, source.sceneItemId, source.sceneItemEnabled);
                      }}
                      disabled={isLocked('sources') || !currentProgramScene}
                      variant={source.sceneItemEnabled ? 'default' : 'outline'}
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
            title="Video Settings"
            emoji="🎥"
            className="relative group"
            isOpen={openVideo}
            onToggle={() => setOpenVideo(!openVideo)}
          >
            <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
              <LockToggle lockKey={VIDEO_SETTINGS_LOCK} />
            </div>
            <div className="space-y-3">
              {/* Base Resolution */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-full sm:w-40 text-sm font-medium shrink-0">Base (Canvas) Resolution</label>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={selectedBaseResolution} onValueChange={handleBaseResolutionChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_RESOLUTIONS.map((res) => (
                        <SelectItem key={res.label} value={res.label}>
                          {res.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedBaseResolution === 'Custom' && (
                    <Input
                      value={customBaseResolution}
                      onChange={(e) => handleCustomResolutionChange(e.target.value, 'base')}
                      disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                      placeholder="e.g. 1920x1080"
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
    
              {/* Output Resolution */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-full sm:w-40 text-sm font-medium shrink-0">Output (Scaled) Resolution</label>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={selectedOutputResolution} onValueChange={handleOutputResolutionChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_RESOLUTIONS.map((res) => (
                        <SelectItem key={res.label} value={res.label}>
                          {res.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedOutputResolution === 'Custom' && (
                    <Input
                      value={customOutputResolution}
                      onChange={(e) => handleCustomResolutionChange(e.target.value, 'output')}
                      disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                      placeholder="e.g. 1280x720"
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
    
              {/* Frame Rate */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-full sm:w-40 text-sm font-medium shrink-0">Frame Rate</label>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={selectedFPS} onValueChange={handleFPSChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select FPS" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_FPS.map((fps) => (
                        <SelectItem key={fps.label} value={fps.label}>
                          {fps.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedFPS === 'Custom' && (
                    <Input
                      value={customFPS}
                      onChange={(e) => handleCustomFPSChange(e.target.value)}
                      disabled={isLocked(VIDEO_SETTINGS_LOCK)}
                      placeholder="e.g. 30/1"
                      className="text-sm"
                    />
                  )}
                </div>
              </div>
    
              <div className="flex justify-start pt-2 border-t">
                <Button
                  onClick={handleSaveVideoSettings}
                  disabled={isLocked(VIDEO_SETTINGS_LOCK) || isVideoSettingsLoading || !editableSettings}
                  size="sm"
                >
                  {isVideoSettingsLoading ? <LoadingSpinner size={4} /> : 'Save Settings'}
                </Button>
              </div>
            </div>
          </CollapsibleCard>
    
          {/* Stats Section */}
          <CollapsibleCard
            title="OBS Statistics"
            emoji="📊"
            className="relative group"
            isOpen={openStats}
            onToggle={() => setOpenStats(!openStats)}
          >
            <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
              <LockToggle lockKey="stats" />
            </div>
            {streamStatus ? (
              <div className="text-sm space-y-1">
                <div>Status: {streamStatus.outputActive ? '🟢 Live' : '🔴 Stopped'}</div>
                <div>Stream Time: {Math.floor((streamStatus.outputDuration || 0) / 60000)}:{Math.floor(((streamStatus.outputDuration || 0) % 60000) / 1000).toString().padStart(2, '0')}</div>
                <div>Bytes Sent: {(streamStatus.outputBytes || 0).toLocaleString()}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No stats available</div>
            )}
          </CollapsibleCard>
        </div>
      );

    }

    export default ObsMainControls;
