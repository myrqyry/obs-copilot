import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WidgetRendererProps } from './registry';

export const SwitchRenderer: React.FC<WidgetRendererProps> = ({ config, value, onChange, isLoading }) => {
  const boolValue = value === true || value === 'true';
  
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium cursor-pointer" htmlFor={`switch-${config.id}`}>
        {config.name}
      </Label>
      <Switch
        id={`switch-${config.id}`}
        checked={boolValue}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={isLoading}
        aria-label={`Switch ${config.name}`}
      />
    </div>
  );
};
