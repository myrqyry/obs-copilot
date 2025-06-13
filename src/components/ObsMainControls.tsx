

import React from 'react';
import { CatppuccinAccentColorName } from '../types';
import { OBSWebSocketService } from '../services/obsService';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useAppStore } from '../store/appStore';

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
  } = useAppStore();
  const [isLoading, setIsLoading] = React.useState(false);

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
