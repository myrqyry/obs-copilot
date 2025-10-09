import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/Button';
import type { AudioConfig } from '@/types/universalWidget'; // Extended for Phase 3

interface AudioVolumeWidgetProps {
  config: UniversalWidgetConfig & { 
    audioConfig?: AudioConfig;
    valueMapping?: Record<string, any>;
    property?: string;
  };
  id: string;
  className?: string;
}

const AudioVolumeWidget: React.FC<AudioVolumeWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [volume, setVolume] = useState<number>(config.valueMapping?.defaultValue || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0); // -100 to 100
  const [isSync, setIsSync] = useState<boolean>(true); // Sync across channels

  const sourceName = config.targetName || '';
  const property = config.property || 'volume';

  // Fetch initial values on mount
  useEffect(() => {
    const fetchInitialValues = async () => {
      if (!obsClient.isConnected()) return;

      try {
        // Fetch initial volume
        const volumeResponse = await obsClient.call('GetInputVolume', { inputName: sourceName });
        setVolume(volumeResponse.inputVolumeDb || 0);

        // Fetch initial mute state
        const muteResponse = await obsClient.call('GetInputMute', { inputName: sourceName });
        setIsMuted(muteResponse.inputMuted || false);

        // Fetch initial balance if supported
        const settingsResponse = await obsClient.call('GetInputSettings', { inputName: sourceName });
        const audioSettings = settingsResponse.inputSettings.audioSettings || {};
        setBalance(audioSettings.balance || 0);

        // Update store
        updateWidgetState(id, { value: volume, metadata: { muted: muteResponse.inputMuted } });
      } catch (error) {
        console.error('Failed to fetch audio state:', error);
        updateWidgetState(id, { error: 'Failed to fetch initial state' });
      }
    };

    fetchInitialValues();
  }, [sourceName, id]);

  // Event listener for OBS updates (e.g., InputVolumeChanged, InputMuteStateChanged)
  useEffect(() => {
    const unsubscribe = obsClient.on('InputVolumeChanged', (data) => {
      if (data.inputName === sourceName) {
        setVolume(data.inputVolumeDb || 0);
        updateWidgetState(id, { value: data.inputVolumeDb });
      }
    });

    obsClient.on('InputMuteStateChanged', (data) => {
      if (data.inputName === sourceName) {
        setIsMuted(data.inputMuted || false);
        updateWidgetState(id, { metadata: { muted: data.inputMuted } });
      }
    });

    // Cleanup
    return unsubscribe;
  }, [sourceName, id]);

  // Handle volume change
  const handleVolumeChange = useCallback(async (newValue: number) => {
    if (!obsClient.isConnected()) return;

    try {
      await obsClient.call('SetInputVolume', { inputName: sourceName, inputVolumeDb: newValue });
      setVolume(newValue);
      updateWidgetState(id, { value: newValue });
    } catch (error) {
      console.error('Failed to set volume:', error);
      updateWidgetState(id, { error: 'Failed to set volume' });
    }
  }, [sourceName, id]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(async () => {
    if (!obsClient.isConnected()) return;

    const newMuteState = !isMuted;
    try {
      await obsClient.call('SetInputMute', { inputName: sourceName, inputMuted: newMuteState });
      setIsMuted(newMuteState);
      updateWidgetState(id, { metadata: { muted: newMuteState } });
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      updateWidgetState(id, { error: 'Failed to toggle mute' });
    }
  }, [isMuted, sourceName, id]);

  // Handle balance change
  const handleBalanceChange = useCallback(async (newBalance: number) => {
    if (!obsClient.isConnected()) return;

    try {
      // OBS balance is -1000 to 1000 (multiply by 10 for dB-like)
      const balanceDb = newBalance * 10;
      const settings = { audioSettings: { balance: balanceDb } };
      await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: settings });
      setBalance(newBalance);
      updateWidgetState(id, { metadata: { balance: newBalance } });
    } catch (error) {
      console.error('Failed to set balance:', error);
      updateWidgetState(id, { error: 'Failed to set balance' });
    }
  }, [sourceName, id]);

  // Sync across channels (simplified; extend for multi-channel if needed)
  const handleSyncToggle = useCallback(async () => {
    setIsSync(!isSync);
    // For sync, apply volume/balance to all channels if multi-channel
    if (config.audioConfig?.channels && !isSync) {
      // Implementation for syncing across channels
      console.log('Syncing audio channels...');
    }
  }, [isSync]);

  return (
    <div className="p-4 bg-card rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-foreground text-lg font-bold mb-2">Audio Volume: {sourceName}</h3>
      
      {/* Volume Slider */}
      <div className="mb-4">
        <Label className="mb-1 block">Volume ({volume.toFixed(1)} dB)</Label>
        <Slider
          min={config.valueMapping?.min || -60}
          max={config.valueMapping?.max || 0}
          step={config.valueMapping?.step || 0.1}
          value={[volume]}
          onValueChange={([newValue]) => setVolume(newValue)}
          onValueCommit={([newValue]) => handleVolumeChange(newValue)}
          className="w-full"
        />
      </div>

      {/* Mute Button */}
      <div className="mb-4">
        <Button
          onClick={handleMuteToggle}
          variant={isMuted ? 'destructive' : 'default'}
          className="w-full"
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
      </div>

      {/* Balance Slider */}
      <div className="mb-4">
        <Label className="mb-1 block">Balance ({balance})</Label>
        <Slider
          min={-100}
          max={100}
          step={1}
          value={[balance]}
          onValueChange={([newValue]) => setBalance(newValue)}
          onValueCommit={([newValue]) => handleBalanceChange(newValue)}
          className="w-full"
        />
      </div>

      {/* Sync Toggle */}
      <div className="mb-4">
        <Label className="mb-1 block">Sync Channels</Label>
        <Switch
          checked={isSync}
          onCheckedChange={handleSyncToggle}
          id="sync-channels"
        />
      </div>
    </div>
  );
};

export default AudioVolumeWidget;