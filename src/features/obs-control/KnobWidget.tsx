import React, { useState, useEffect, useCallback } from 'react';
import { Knob } from '@/components/ui/Knob';
import { ObsWidgetConfig, ObsControlConfig } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { logger } from '@/utils/logger';
import { debounce } from '@/lib/utils';

interface KnobWidgetProps {
  config: ObsWidgetConfig;
}

const KnobWidget: React.FC<KnobWidgetProps> = ({ config }) => {
  const { obs: obsClient, isConnected: isObsConnected } = useConnectionsStore();
  const controlConfig = config.control as ObsControlConfig;

  const [currentValue, setCurrentValue] = useState(controlConfig.min || 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sendValueToObs = useCallback(
    debounce(async (value: number) => {
      if (!isObsConnected || !obsClient) {
        logger.warn('OBS not connected, cannot send value.');
        setErrorMessage('OBS not connected.');
        return;
      }

      setErrorMessage(null);

      const { sourceName, property, sendMethod } = controlConfig;

      if (!sourceName || !property || !sendMethod) {
        logger.error('Missing control configuration for OBS command.');
        setErrorMessage('Missing control configuration.');
        return;
      }

      try {
        const params: Record<string, any> = { inputName: sourceName };
        if (property === 'volume_db') {
          params.inputVolumeDb = value;
        } else if (property === 'gain') {
          params.inputVolumeDb = value;
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
    const fetchInitialValue = async () => {
      if (!isObsConnected || !obsClient) return;

      const { sourceName, property } = controlConfig;
      if (!sourceName || !property) return;

      try {
        // TODO: Implement proper initial value fetching based on OBS API.
        setCurrentValue(controlConfig.min || 0);
      } catch (error: any) {
        logger.error(`Failed to fetch initial value for ${sourceName}.${property}: ${error.message}`);
        setErrorMessage(`Failed to fetch initial value: ${error.message}`);
      }
    };

    fetchInitialValue();
  }, [isObsConnected, obsClient, controlConfig]);

  const handleKnobChange = (value: number) => {
    setCurrentValue(value);
  };

  const handleKnobChangeEnd = (value: number) => {
    sendValueToObs(value);
  };

  if (!controlConfig) {
    return <div className="text-red-500">Error: Control configuration missing.</div>;
  }

  return (
    <div className={`flex flex-col gap-2 p-2 rounded-md border ${!isObsConnected ? 'opacity-50' : ''}`}>
      <Knob
        id={config.id}
        label={config.label}
        min={controlConfig.min || 0}
        max={controlConfig.max || 100}
        step={controlConfig.step || 1}
        value={currentValue}
        onChange={handleKnobChange}
        onChangeEnd={handleKnobChangeEnd}
        disabled={!isObsConnected}
        className={config.className}
        unit={controlConfig.unit}
      />
      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  );
};

export default KnobWidget;