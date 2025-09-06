import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';
import type { AudioConfig } from '@/types/universalWidget';

interface AudioMeterWidgetProps extends UniversalWidgetConfig {
  config: AudioConfig;
  id: string;
  className?: string;
}

const AudioMeterWidget: React.FC<AudioMeterWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [levels, setLevels] = useState<number[]>([]);
  const [peakLevels, setPeakLevels] = useState<number[]>([]);
  const sourceName = config.targetName || '';

  // Initialize levels array based on channels
  const numChannels = config.audioConfig?.channels?.length || 1;
  useEffect(() => {
    setLevels(new Array(numChannels).fill(0));
    setPeakLevels(new Array(numChannels).fill(0));
  }, [numChannels]);

  // Subscribe to audio levels event
  useEffect(() => {
    const handleAudioLevels = (data) => {
      if (data.inputName === sourceName) {
        const levelsData = data.inputAudioLevels || [];
        const peakData = data.inputAudioPeak || [];
        setLevels(levelsData);
        setPeakLevels(peakData);
        updateWidgetState(id, { value: levelsData, metadata: { peak: peakData } });
      }
    };

    obsClient.on('InputAudioLevels', handleAudioLevels);

    // Request audio monitoring if needed
    if (obsClient.isConnected()) {
      obsClient.call('GetInputAudioLevels', { inputName: sourceName });
    }

    return () => {
      obsClient.off('InputAudioLevels', handleAudioLevels);
    };
  }, [sourceName, id]);

  // Render meter bars
  const renderMeter = (level: number, index: number) => {
    const barHeight = Math.max(0, (level / -18) * 100); // Normalize to 0-100%, -18dB max
    return (
      <div key={index} className="w-2 bg-gray-700 rounded mr-1">
        <div
          className={`h-full bg-gradient-to-t from-red-500 via-yellow-500 to-green-500 rounded transition-all duration-100 ease-linear`}
          style={{ height: `${barHeight}%` }}
        />
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Audio Meter: {sourceName}</h3>
      <div className="flex justify-center mb-2">
        {levels.map((level, index) => renderMeter(level, index))}
      </div>
      <div className="text-xs text-gray-300 text-center">
        {levels.map((level, index) => (
          <span key={index} className="mx-1">
            Ch {index + 1}: {level.toFixed(1)} dB
          </span>
        ))}
      </div>
    </div>
  );
};

export default AudioMeterWidget;