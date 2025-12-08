import React from 'react';
import { ObsWidgetConfig } from '@/shared/types/obs';
import { Button } from '@/shared/components/ui/Button';
import { ObsSliderWidget } from '@/features/obs-control/ObsSliderWidget';
import { ObsKnobWidget } from '@/features/obs-control/ObsKnobWidget';
import { executeObsWidgetAction } from '@/shared/services/actionMapper';

const ObsWidget: React.FC<ObsWidgetConfig> = (config) => {
  if (config.type === 'control') {
    if (!config.control) {
      return <div className="text-warning">Control not fully loaded</div>;
    }
    switch (config.control.kind) {
      case 'slider':
        return <ObsSliderWidget config={config} />;
      case 'knob':
        return <ObsKnobWidget config={config} />;
      default:
        return <div className="text-error">Unsupported control type: {config.control.kind}</div>;
    }
  }

  const handleClick = async () => {
    await executeObsWidgetAction(config);
  };

  return (
    <Button onClick={handleClick} className="w-full h-full">
      {config.label}
    </Button>
  );
};

export default ObsWidget;
