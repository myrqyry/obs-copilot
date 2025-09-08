import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';
import type { AudioConfig } from '@/types/universalWidget';

interface AudioMixerWidgetProps {
  config: UniversalWidgetConfig & { audioConfig?: AudioConfig };
  id: string;
  className?: string;
}

const AudioMixerWidget: React.FC<AudioMixerWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [channelVolumes, setChannelVolumes] = useState<number[]>([]);
  const [isSync, setIsSync] = useState<boolean>(true);
  const sourceName = config.targetName || '';

  // Initialize channel volumes based on channels
  const numChannels = config.audioConfig?.channels?.length || 2;
  useEffect(() => {
    setChannelVolumes(new Array(numChannels).fill(0));
  }, [numChannels]);

  // Fetch initial channel volumes
  useEffect(() => {
    const fetchInitialVolumes = async () => {
      if (!obsClient.isConnected()) return;

      try {
        const settingsResponse = await obsClient.call('GetInputSettings', { inputName: sourceName });
        const audioSettings = settingsResponse.inputSettings.audioSettings || {};
        const volumes = audioSettings.channelVolumes || new Array(numChannels).fill(0);
        setChannelVolumes(volumes);
        updateWidgetState(id, { value: volumes });
      } catch (error) {
        console.error('Failed to fetch channel volumes:', error);
        updateWidgetState(id, { error: 'Failed to fetch channel volumes' });
      }
    };

    fetchInitialVolumes();
  }, [sourceName, id, numChannels]);

  // Subscribe to audio levels or settings changes
  useEffect(() => {
    const handleAudioLevels = (data: any) => {
      if (data.inputName === sourceName) {
        const volumes = data.inputAudioLevels || [];
        if (volumes.length === numChannels) {
          setChannelVolumes(volumes);
          updateWidgetState(id, { value: volumes });
        }
      }
    };

    obsClient.on('InputAudioLevels', handleAudioLevels);

    return () => {
      obsClient.off('InputAudioLevels', handleAudioLevels);
    };
  }, [sourceName, id, numChannels]);

  // Handle individual channel volume change
  const handleChannelVolumeChange = useCallback(async (index: number, newValue: number) => {
    if (!obsClient.isConnected()) return;

    try {
      const newVolumes = [...channelVolumes];
      newVolumes[index] = newValue;
      setChannelVolumes(newVolumes);

      const settings = {
        audioSettings: {
          channelVolumes: newVolumes
        }
      };
      await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: settings });
      updateWidgetState(id, { value: newVolumes });
    } catch (error) {
      console.error('Failed to set channel volume:', error);
      updateWidgetState(id, { error: 'Failed to set channel volume' });
    }
  }, [channelVolumes, sourceName, id]);

  // Handle sync toggle - set all channels to the same volume
  const handleSyncToggle = useCallback(async () => {
    setIsSync(!isSync);
    if (!isSync) {
      // Sync: set all channels to average or first channel
      const averageVolume = channelVolumes.reduce((a, b) => a + b, 0) / channelVolumes.length;
      const newVolumes = new Array(numChannels).fill(averageVolume);
      setChannelVolumes(newVolumes);
      const settings = {
        audioSettings: {
          channelVolumes: newVolumes
        }
      };
      await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: settings });
      updateWidgetState(id, { value: newVolumes, metadata: { synced: true } });
    }
  }, [isSync, channelVolumes, sourceName, id, numChannels]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Audio Mixer: {sourceName}</h3>
      <label className="text-gray-300 mb-1 block">Sync Channels: {isSync ? 'On' : 'Off'}</label>
      <input
        type="checkbox"
        checked={isSync}
        onChange={handleSyncToggle}
        className="toggle toggle-primary mb-4"
      />
      <div className="space-y-2">
        {channelVolumes.map((volume, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Channel {index + 1}</span>
            <input
              type="range"
              min={config.valueMapping?.min || -60}
              max={config.valueMapping?.max || 0}
              step={config.valueMapping?.step || 0.1}
              value={volume}
              onChange={(e) => handleChannelVolumeChange(index, Number(e.target.value))}
              className="flex-1 mx-2 slider slider-primary"
            />
            <span className="text-white text-sm">{volume.toFixed(1)} dB</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioMixerWidget;