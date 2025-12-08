import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { WidgetRendererProps } from './registry';

export const SliderRenderer: React.FC<WidgetRendererProps> = ({ 
  config, 
  value, 
  onChange, 
  isLoading 
}) => {
  const numValue = Number(value) || 0;
  const { min = 0, max = 100, step = 1, unit = '' } = config.valueMapping || {};

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{config.name}</Label>
        {config.visualConfig?.showValue !== false && (
          <span className="text-xs text-muted-foreground font-mono">
            {numValue}{unit}
          </span>
        )}
      </div>
      <Slider
        value={[numValue]}
        onValueChange={(val) => onChange(val[0])}
        min={min}
        max={max}
        step={step}
        disabled={isLoading}
        className="w-full"
        aria-label={`Slider ${config.name}`}
      />
    </div>
  );
};
