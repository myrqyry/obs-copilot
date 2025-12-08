import React from 'react';
import { Button } from '@/components/ui/Button';
import { WidgetRendererProps } from './registry';

export const ButtonRenderer: React.FC<WidgetRendererProps> = ({ 
  config, 
  onChange, 
  isLoading 
}) => {
  return (
    <Button
      onClick={() => onChange(null)}
      className="w-full bg-primary hover:bg-primary/90"
      disabled={isLoading}
      aria-label={`Button ${config.name}`}
      variant={config.visualConfig?.style === 'outline' ? 'outline' : 'default'}
    >
      {config.visualConfig?.icon && <span className="mr-2">{config.visualConfig.icon}</span>}
      {config.name}
    </Button>
  );
};
