import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { ObsWidgetConfig, ObsControlConfig } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { logger } from '@/utils/logger';
import { debounce } from '@/lib/utils'; // Assuming a debounce utility exists or will be created

interface SliderWidgetProps {
  config: ObsWidgetConfig;
}

const SliderWidget: React.FC<SliderWidgetProps> = ({ config }) => {
  const { obs: obsClient, isConnected: isObsConnected } = useConnectionsStore();
  const controlConfig = config.control as ObsControlConfig; // Cast as we know it's a control widget

  const [currentValue, setCurrentValue] = useState(controlConfig.min || 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Debounced function to send value to OBS
  const sendValueToObs = useCallback(
    debounce(async (value: number) => {
      if (!isObsConnected || !obsClient) {
        logger.warn('OBS not connected, cannot send value.');
        setErrorMessage('OBS not connected.');
        return;
      }

      setErrorMessage(null); // Clear previous errors

      const { sourceName, property, sendMethod } = controlConfig;

      if (!sourceName || !property || !sendMethod) {
        logger.error('Missing control configuration for OBS command.');
        setErrorMessage('Missing control configuration.');
        return;
      }

      try {
        const params: Record<string, any> = { inputName: sourceName };
        // Determine the parameter name based on the property
        // This is a simplified mapping, might need more complex logic for various OBS properties
        if (property === 'volume_db') {
          params.inputVolumeDb = value;
        } else if (property === 'gain') {
          params.inputVolumeDb = value; // Assuming gain maps to volume_db for now
        } else {
          params[property] = value;
        }

        await obsClient.call(sendMethod, params);
        logger.info(`Successfully sent ${sendMethod} for ${sourceName} with ${property}: ${value}`);
      } catch (error: any) {
        logger.error(`Failed to send OBS command: ${error.message}`);
        setErrorMessage(`OBS command failed: ${error.message}`);
      }
    }, controlConfig.debounceMs || 300),
    [isObsConnected, obsClient, controlConfig]
  );

  useEffect(() => {
    // Initial fetch of the value from OBS
    const fetchInitialValue = async () => {
      if (!isObsConnected || !obsClient) return;

      const { sourceName, property } = controlConfig;
      if (!sourceName || !property) return;

      try {
        // This part needs to be more sophisticated.
        // OBS doesn't have a generic "GetProperty" call.
        // We'd need to call specific getters based on the property.
        // For volume, it would be GetInputVolume. For other settings, GetInputSettings.
        // For now, we'll assume a dummy initial value or rely on user setting it.
        // TODO: Implement proper initial value fetching based on OBS API.
        // For demonstration, setting to min value.
        setCurrentValue(controlConfig.min || 0);

        // Example for GetInputVolume:
        /*
        const { inputVolumeDb } = await obsClient.call('GetInputVolume', { inputName: sourceName });
        setCurrentValue(inputVolumeDb);
        */

      } catch (error: any) {
        logger.error(`Failed to fetch initial value for ${sourceName}.${property}: ${error.message}`);
        setErrorMessage(`Failed to fetch initial value: ${error.message}`);
      }
    };

    fetchInitialValue();
  }, [isObsConnected, obsClient, controlConfig]);

  const handleSliderChange = (value: number) => {
    setCurrentValue(value);
  };

  const handleSliderChangeEnd = (value: number) => {
    sendValueToObs(value);
  };

  if (!controlConfig) {
    return <div className="text-red-500">Error: Control configuration missing.</div>;
  }

  return (
    <div className={`flex flex-col gap-2 p-2 rounded-md border ${!isObsConnected ? 'opacity-50' : ''}`}>
      <Slider
        id={config.id}
        label={config.label}
        min={controlConfig.min || 0}
        max={controlConfig.max || 100}
        step={controlConfig.step || 1}
        value={currentValue}
        onChange={handleSliderChange}
        onChangeEnd={handleSliderChangeEnd}
        disabled={!isObsConnected || disabled}
        className={config.className}
        unit={controlConfig.unit}
      />
      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  );
};

export default SliderWidget;