import Tooltip from './ui/Tooltip';
import React, { useState, useEffect } from 'react';
import { Button } from './common/Button';
import AddToContextButton from './common/AddToContextButton';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useAppStore } from '../store/appStore';
import { useLockStore } from '../store/lockStore';
import { COMMON_RESOLUTIONS, COMMON_FPS } from '../constants';
import { CollapsibleCard } from './common/CollapsibleCard';
import { catppuccinAccentColorsHexMap } from '../types';
export const ObsMainControls = ({ obsService, onRefreshData, setErrorMessage, accentColorName }) => {
    // Collapsible state for each section
    const [openStream, setOpenStream] = useState(true);
    const [openScenes, setOpenScenes] = useState(true);
    const [openSources, setOpenSources] = useState(true);
    const [openVideo, setOpenVideo] = useState(true);
    const [openStats, setOpenStats] = useState(false);
    // Use Zustand for OBS state
    const { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings: initialVideoSettings, obsStats, } = useAppStore();
    const [isLoading, setIsLoading] = React.useState(false);
    // Video settings state
    const [editableSettings, setEditableSettings] = useState(initialVideoSettings);
    const [isVideoSettingsLoading, setIsVideoSettingsLoading] = useState(false);
    // Resolution and FPS dropdown states
    const [selectedBaseResolution, setSelectedBaseResolution] = useState('Custom');
    const [selectedOutputResolution, setSelectedOutputResolution] = useState('Custom');
    const [selectedFPS, setSelectedFPS] = useState('Custom');
    const [customBaseResolution, setCustomBaseResolution] = useState('');
    const [customOutputResolution, setCustomOutputResolution] = useState('');
    const [customFPS, setCustomFPS] = useState('');
    useEffect(() => {
        setEditableSettings(initialVideoSettings);
        // Initialize dropdown selections based on current settings
        if (initialVideoSettings) {
            // Check for matching base resolution
            const baseResMatch = COMMON_RESOLUTIONS.find(res => res.width === initialVideoSettings.baseWidth && res.height === initialVideoSettings.baseHeight);
            setSelectedBaseResolution(baseResMatch ? baseResMatch.label : 'Custom');
            if (!baseResMatch) {
                setCustomBaseResolution(`${initialVideoSettings.baseWidth}x${initialVideoSettings.baseHeight}`);
            }
            // Check for matching output resolution
            const outputResMatch = COMMON_RESOLUTIONS.find(res => res.width === initialVideoSettings.outputWidth && res.height === initialVideoSettings.outputHeight);
            setSelectedOutputResolution(outputResMatch ? outputResMatch.label : 'Custom');
            if (!outputResMatch) {
                setCustomOutputResolution(`${initialVideoSettings.outputWidth}x${initialVideoSettings.outputHeight}`);
            }
            // Check for matching FPS
            const fpsMatch = COMMON_FPS.find(fps => fps.numerator === initialVideoSettings.fpsNumerator && fps.denominator === initialVideoSettings.fpsDenominator);
            setSelectedFPS(fpsMatch ? fpsMatch.label : 'Custom');
            if (!fpsMatch) {
                setCustomFPS(`${initialVideoSettings.fpsNumerator}/${initialVideoSettings.fpsDenominator}`);
            }
        }
    }, [initialVideoSettings]);
    const handleAction = async (action) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            await action();
            await onRefreshData();
        }
        catch (error) {
            console.error("OBS Action Error:", error);
            setErrorMessage(`Action failed: ${error.message || 'Unknown error'}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Resolution and FPS dropdown handlers
    const handleBaseResolutionChange = (e) => {
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
    const handleOutputResolutionChange = (e) => {
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
    const handleFPSChange = (e) => {
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
    const handleCustomResolutionChange = (value, type) => {
        if (type === 'base') {
            setCustomBaseResolution(value);
        }
        else {
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
            }
            else {
                setEditableSettings({
                    ...editableSettings,
                    outputWidth: width,
                    outputHeight: height,
                });
            }
        }
    };
    const handleCustomFPSChange = (value) => {
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
        if (!editableSettings)
            return;
        setIsVideoSettingsLoading(true);
        setErrorMessage(null);
        try {
            await obsService.setVideoSettings(editableSettings);
            await onRefreshData();
        }
        catch (error) {
            console.error("Failed to save video settings:", error);
            setErrorMessage(`Failed to save video settings: ${error.message || 'Unknown error'}`);
        }
        finally {
            setIsVideoSettingsLoading(false);
        }
    };
    const handleSetCurrentScene = (sceneName) => {
        handleAction(() => obsService.setCurrentProgramScene(sceneName));
    };
    const toggleSourceVisibility = (sceneName, sceneItemId, enabled) => {
        handleAction(() => obsService.setSceneItemEnabled(sceneName, sceneItemId, !enabled));
    };
    const toggleStream = () => {
        if (streamStatus?.outputActive) {
            handleAction(() => obsService.stopStream());
        }
        else {
            handleAction(() => obsService.startStream());
        }
    };
    const toggleRecord = () => {
        if (recordStatus?.outputActive) {
            handleAction(() => obsService.stopRecord());
        }
        else {
            handleAction(() => obsService.startRecord());
        }
    };
    // Locks
    const { isLocked, setLock } = useLockStore();
    const STREAM_RECORD_LOCK = 'streamRecord';
    const VIDEO_SETTINGS_LOCK = 'videoSettings';
    if (isLoading && !scenes.length && !currentProgramScene) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12}/></div>;
    }
    // Lock toggle component with tooltip
    const LockToggle = ({ lockKey }) => (<Tooltip content={`${isLocked(lockKey) ? 'Unlock' : 'Lock'} controls`}>
      <button onClick={() => setLock(lockKey, !isLocked(lockKey))} className={`w-3 h-3 p-1 rounded transition-colors duration-200 ${isLocked(lockKey)
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-500 hover:bg-gray-600 text-white'}`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          {isLocked(lockKey) ? (<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>) : (<path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>)}
        </svg>
      </button>
    </Tooltip>);
    // Gemini-controlled lock toggle component
    const GeminiLockToggle = ({ lockKey }) => {
        const geminiLockKey = `${lockKey}_gemini`;
        const isGeminiLocked = isLocked(geminiLockKey);
        return (<Tooltip content={`${isGeminiLocked ? 'Allow' : 'Prevent'} Gemini control`}>
        <button onClick={() => setLock(geminiLockKey, !isGeminiLocked)} className={`w-3 h-3 p-1 rounded transition-colors duration-200 ${isGeminiLocked
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-gray-500 hover:bg-gray-600 text-white'}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            {isGeminiLocked ? (<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>) : (<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>)}
          </svg>
        </button>
      </Tooltip>);
    };
    // Get accent color hex from Zustand
    const accentColor = catppuccinAccentColorsHexMap[accentColorName || 'sky'] || '#89b4fa';
    return (<div className="space-y-2 max-w-4xl mx-auto p-0">
      {/* Stream & Record Section */}
      <CollapsibleCard isOpen={openStream} onToggle={() => setOpenStream(!openStream)} title="Stream & Record" emoji="📡" accentColor={accentColor} className="relative group">
        <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey={STREAM_RECORD_LOCK}/>
          <GeminiLockToggle lockKey={STREAM_RECORD_LOCK}/>
        </div>
        <div className="flex gap-2 items-center mb-1">
          <Button onClick={toggleStream} disabled={isLocked(STREAM_RECORD_LOCK)} className={`flex-1 ${streamStatus?.outputActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
            {streamStatus?.outputActive ? 'Stop Streaming' : 'Start Streaming'}
          </Button>
          <Button onClick={toggleRecord} disabled={isLocked(STREAM_RECORD_LOCK)} className={`flex-1 ${recordStatus?.outputActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {recordStatus?.outputActive ? 'Stop Recording' : 'Start Recording'}
          </Button>
        </div>
        <div className="text-xs text-foreground">
          Stream: {streamStatus?.outputActive ? '🟢 Live' : '🔴 Stopped'} | Record: {recordStatus?.outputActive ? '🟢 Recording' : '🔴 Stopped'}
        </div>
      </CollapsibleCard>

      {/* Scenes Section */}
      <CollapsibleCard isOpen={openScenes} onToggle={() => setOpenScenes(!openScenes)} title="Scenes" emoji="🎬" accentColor={accentColor} className="relative group">
        <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey="scenes"/>
          <GeminiLockToggle lockKey="scenes"/>
        </div>
        <ul className="space-y-1">
          {scenes.map((scene) => (<li key={scene.sceneName} className="flex items-center justify-between gap-1">
              <span className={`truncate text-sm ${scene.sceneName === currentProgramScene ? 'font-bold text-accent' : ''}`}>{scene.sceneName}</span>
              <div className="flex items-center gap-1">
                <Button onClick={() => handleSetCurrentScene(scene.sceneName)} disabled={isLocked('scenes') || scene.sceneName === currentProgramScene} variant="secondary" accentColorName={accentColorName} size="sm">
                  {scene.sceneName === currentProgramScene ? 'Active' : 'Switch'}
                </Button>
                <AddToContextButton contextText={`OBS Scene: '${scene.sceneName}'${scene.sceneName === currentProgramScene ? ' (currently active)' : ''}`} disabled={isLocked('scenes')} title={`Add scene '${scene.sceneName}' to chat context`}/>
              </div>
            </li>))}
        </ul>
      </CollapsibleCard>

      {/* Sources Section */}
      <CollapsibleCard isOpen={openSources} onToggle={() => setOpenSources(!openSources)} title="Sources" emoji="🖼️" accentColor={accentColor} className="relative group">
        <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey="sources"/>
          <GeminiLockToggle lockKey="sources"/>
        </div>
        <ul className="space-y-1">
          {sources.map((source) => (<li key={source.sceneItemId} className="flex items-center justify-between gap-1">
              <span className="truncate text-sm">{source.sourceName}</span>
              <div className="flex items-center gap-1">
                <Button onClick={() => {
                if (currentProgramScene)
                    toggleSourceVisibility(currentProgramScene, source.sceneItemId, source.sceneItemEnabled);
            }} disabled={isLocked('sources') || !currentProgramScene} variant={source.sceneItemEnabled ? 'primary' : 'secondary'} accentColorName={accentColorName} size="sm">
                  {source.sceneItemEnabled ? 'Hide' : 'Show'}
                </Button>
                <AddToContextButton contextText={`OBS Source: '${source.sourceName}' is ${source.sceneItemEnabled ? 'visible' : 'hidden'} in scene '${currentProgramScene || ''}'`} disabled={isLocked('sources') || !currentProgramScene} title={`Add source '${source.sourceName}' to chat context`}/>
              </div>
            </li>))}
        </ul>
      </CollapsibleCard>

      {/* Video Settings Section */}
      <CollapsibleCard isOpen={openVideo} onToggle={() => setOpenVideo(!openVideo)} title="Video Settings" emoji="🎥" accentColor={accentColor} className="relative group">
        <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey={VIDEO_SETTINGS_LOCK}/>
          <GeminiLockToggle lockKey={VIDEO_SETTINGS_LOCK}/>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <label className="w-36 text-xs">Base (Canvas) Resolution</label>
            <select className="input input-sm w-28 text-xs" value={selectedBaseResolution} onChange={handleBaseResolutionChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
              {COMMON_RESOLUTIONS.map(res => (<option key={res.label} value={res.label}>{res.label}</option>))}
              <option value="Custom">Custom</option>
            </select>
            {selectedBaseResolution === 'Custom' && (<TextInput value={customBaseResolution} onChange={e => handleCustomResolutionChange(e.target.value, 'base')} disabled={isLocked(VIDEO_SETTINGS_LOCK)} placeholder="e.g. 1920x1080" className="input input-sm w-28 ml-1 text-xs" size="sm"/>)}
          </div>
          <div className="flex items-center gap-1">
            <label className="w-36 text-xs">Output (Scaled) Resolution</label>
            <select className="input input-sm w-28 text-xs" value={selectedOutputResolution} onChange={handleOutputResolutionChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
              {COMMON_RESOLUTIONS.map(res => (<option key={res.label} value={res.label}>{res.label}</option>))}
              <option value="Custom">Custom</option>
            </select>
            {selectedOutputResolution === 'Custom' && (<TextInput value={customOutputResolution} onChange={e => handleCustomResolutionChange(e.target.value, 'output')} disabled={isLocked(VIDEO_SETTINGS_LOCK)} placeholder="e.g. 1280x720" className="input input-sm w-28 ml-1 text-xs" size="sm"/>)}
          </div>
          <div className="flex items-center gap-1">
            <label className="w-36 text-xs">Frame Rate</label>
            <select className="input input-sm w-28 text-xs" value={selectedFPS} onChange={handleFPSChange} disabled={isLocked(VIDEO_SETTINGS_LOCK)}>
              {COMMON_FPS.map(fps => (<option key={fps.label} value={fps.label}>{fps.label}</option>))}
              <option value="Custom">Custom</option>
            </select>
            {selectedFPS === 'Custom' && (<TextInput value={customFPS} onChange={e => handleCustomFPSChange(e.target.value)} disabled={isLocked(VIDEO_SETTINGS_LOCK)} placeholder="e.g. 30/1" className="input input-sm w-28 ml-1 text-xs" size="sm"/>)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Button onClick={handleSaveVideoSettings} disabled={isLocked(VIDEO_SETTINGS_LOCK) || isVideoSettingsLoading || !editableSettings} variant="primary" accentColorName={accentColorName} size="sm">
              {isVideoSettingsLoading ? <LoadingSpinner size={4}/> : 'Save Settings'}
            </Button>
          </div>
        </div>
      </CollapsibleCard>

      {/* Stats Section */}
      <CollapsibleCard isOpen={openStats} onToggle={() => setOpenStats(!openStats)} title="OBS Statistics" emoji="📊" accentColor={accentColor} className="relative group">
        <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
          <LockToggle lockKey="stats"/>
          <GeminiLockToggle lockKey="stats"/>
        </div>
        {obsStats ? (<div className="text-xs space-y-1">
            <div>CPU Usage: {obsStats.cpuUsage?.toFixed(1)}%</div>
            <div>Memory Usage: {(obsStats.memoryUsage / 1024 / 1024).toFixed(1)} MB</div>
            <div>FPS: {obsStats.fps?.toFixed(1)}</div>
            <div>Dropped Frames: {obsStats.droppedFrames || 0}</div>
            <div>Stream Time: {obsStats.streamTimecode || '00:00:00'}</div>
          </div>) : (<div className="text-xs text-muted-foreground">No stats available</div>)}
      </CollapsibleCard>
    </div>);
};
