import React, { useState, useEffect } from 'react';
import useConnectionsStore from '@/app/store/connections';
import { useLockStore } from '@/app/store/lockStore';
import { useChatStore } from '@/app/store/chatStore';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { CollapsibleCard } from '@/shared/components/common/CollapsibleCard';
import { LockToggle } from '@/shared/components/common/LockToggle';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { COMMON_RESOLUTIONS, COMMON_FPS } from '@/shared/constants';
import { handleAppError } from '@/shared/lib/errorUtils';

export const VideoSettingsCard: React.FC = () => {
  const [openVideo, setOpenVideo] = useState(true);
  const [isVideoSettingsLoading, setIsVideoSettingsLoading] = useState(false);

  const obsClient = useConnectionsStore((state) => state.obs);
  const initialVideoSettings = useConnectionsStore((state) => state.videoSettings);
  const editableSettings = useConnectionsStore((state) => state.editableSettings);
  const storeSetEditableSettings = useConnectionsStore((state) => state.setEditableSettings);

  const { actions: { setGlobalErrorMessage: setErrorMessage } } = useChatStore();
  const { isLocked } = useLockStore();
  const VIDEO_SETTINGS_LOCK = 'videoSettings';

  const [selectedBaseResolution, setSelectedBaseResolution] = useState<string>('Custom');
  const [selectedOutputResolution, setSelectedOutputResolution] = useState<string>('Custom');
  const [selectedFPS, setSelectedFPS] = useState<string>('Custom');
  const [customBaseResolution, setCustomBaseResolution] = useState('');
  const [customOutputResolution, setCustomOutputResolution] = useState('');
  const [customFPS, setCustomFPS] = useState('');

  useEffect(() => {
    if (initialVideoSettings) {
        storeSetEditableSettings(initialVideoSettings);
    }
  }, [initialVideoSettings, storeSetEditableSettings]);


  useEffect(() => {
    if (editableSettings) {
      const baseResMatch = COMMON_RESOLUTIONS.find(
        (res) => res.width === editableSettings.baseWidth && res.height === editableSettings.baseHeight
      );
      setSelectedBaseResolution(baseResMatch ? baseResMatch.label : 'Custom');
      if (!baseResMatch) {
        setCustomBaseResolution(`${editableSettings.baseWidth}x${editableSettings.baseHeight}`);
      }

      const outputResMatch = COMMON_RESOLUTIONS.find(
        (res) => res.width === editableSettings.outputWidth && res.height === editableSettings.outputHeight
      );
      setSelectedOutputResolution(outputResMatch ? outputResMatch.label : 'Custom');
      if (!outputResMatch) {
        setCustomOutputResolution(`${editableSettings.outputWidth}x${editableSettings.outputHeight}`);
      }

      const fpsMatch = COMMON_FPS.find(
        (fps) => fps.numerator === editableSettings.fpsNumerator && fps.denominator === editableSettings.fpsDenominator
      );
      setSelectedFPS(fpsMatch ? fpsMatch.label : 'Custom');
      if (!fpsMatch) {
        setCustomFPS(`${editableSettings.fpsNumerator}/${editableSettings.fpsDenominator}`);
      }
    }
  }, [editableSettings]);

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

  const handleBaseResolutionChange = (value: string) => {
    setSelectedBaseResolution(value);
    if (value !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find((res) => res.label === value);
      if (resolution) {
        storeSetEditableSettings({ ...editableSettings, baseWidth: resolution.width, baseHeight: resolution.height });
      }
    }
  };

  const handleOutputResolutionChange = (value: string) => {
    setSelectedOutputResolution(value);
    if (value !== 'Custom' && editableSettings) {
      const resolution = COMMON_RESOLUTIONS.find((res) => res.label === value);
      if (resolution) {
        storeSetEditableSettings({ ...editableSettings, outputWidth: resolution.width, outputHeight: resolution.height });
      }
    }
  };

  const handleFPSChange = (value: string) => {
    setSelectedFPS(value);
    if (value !== 'Custom' && editableSettings) {
      const fps = COMMON_FPS.find((fps) => fps.label === value);
      if (fps) {
        storeSetEditableSettings({ ...editableSettings, fpsNumerator: fps.numerator, fpsDenominator: fps.denominator });
      }
    }
  };

  const handleCustomResolutionChange = (value: string, type: 'base' | 'output') => {
    if (type === 'base') setCustomBaseResolution(value);
    else setCustomOutputResolution(value);

    const match = value.match(/^(\d+)x(\d+)$/);
    if (match && editableSettings) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (type === 'base') storeSetEditableSettings({ ...editableSettings, baseWidth: width, baseHeight: height });
      else storeSetEditableSettings({ ...editableSettings, outputWidth: width, outputHeight: height });
    }
  };

  const handleCustomFPSChange = (value: string) => {
    setCustomFPS(value);
    const match = value.match(/^(\d+)\/(\d+)$/) || value.match(/^(\d+)$/);
    if (match && editableSettings) {
      const numerator = parseInt(match[1], 10);
      const denominator = match[2] ? parseInt(match[2], 10) : 1;
      storeSetEditableSettings({ ...editableSettings, fpsNumerator: numerator, fpsDenominator: denominator });
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

  return (
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="w-full sm:w-40 text-sm font-medium shrink-0">Base (Canvas) Resolution</label>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={selectedBaseResolution} onValueChange={handleBaseResolutionChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Select resolution" /></SelectTrigger>
              <SelectContent>
                {COMMON_RESOLUTIONS.map((res) => (<SelectItem key={res.label} value={res.label}>{res.label}</SelectItem>))}
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="w-full sm:w-40 text-sm font-medium shrink-0">Output (Scaled) Resolution</label>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={selectedOutputResolution} onValueChange={handleOutputResolutionChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Select resolution" /></SelectTrigger>
              <SelectContent>
                {COMMON_RESOLUTIONS.map((res) => (<SelectItem key={res.label} value={res.label}>{res.label}</SelectItem>))}
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="w-full sm:w-40 text-sm font-medium shrink-0">Frame Rate</label>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={selectedFPS} onValueChange={handleFPSChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Select FPS" /></SelectTrigger>
              <SelectContent>
                {COMMON_FPS.map((fps) => (<SelectItem key={fps.label} value={fps.label}>{fps.label}</SelectItem>))}
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
  );
};

export default VideoSettingsCard;