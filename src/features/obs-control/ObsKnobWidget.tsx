import React, { useState } from 'react';
import { Knob } from '@/components/ui/Knob';
import { ControlConfig } from '@/types/obs';
import { executeObsWidgetAction } from '@/services/actionMapper';

interface ObsKnobWidgetProps {
  config: ControlConfig;
}

export const ObsKnobWidget: React.FC<ObsKnobWidgetProps> = ({ config }) => {
  const { control } = config;
  const [value, setValue] = useState<number>(control.min || 0);

  const handleValueChange = (newValue: number) => {
    setValue(newValue);
  };

  const handleValueCommit = async (newValue: number) => {
    await executeObsWidgetAction(config, newValue);
  };

  return (
    <div className="p-2 border rounded bg-background">
      <Knob
        value={value}
        onChange={handleValueChange}
        onChangeEnd={handleValueCommit}
        min={control.min}
        max={control.max}
        step={control.step}
        unit={control.unit}
        label={config.label}
      />
    </div>
  );
};
