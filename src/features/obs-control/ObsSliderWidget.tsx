import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { ControlConfig } from '@/types/obs';
import { executeObsWidgetAction } from '@/services/actionMapper';

interface ObsSliderWidgetProps {
  config: ControlConfig;
}

export const ObsSliderWidget: React.FC<ObsSliderWidgetProps> = ({ config }) => {
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
      <Slider
        value={value}
        onChange={handleValueChange}
        onChangeEnd={handleValueCommit}
        min={control.min}
        max={control.max}
        step={control.step}
        className="w-full"
      />
    </div>
  );
};
