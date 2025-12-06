import React from 'react';
import { UniversalWidgetConfig } from '@/shared/types/universalWidget';

interface BaseWidgetProps {
  config: UniversalWidgetConfig;
  children?: React.ReactNode;
}

// Simple presentational wrapper for OBS control widgets.
// Keeps API minimal so existing imports work.
export const BaseWidget: React.FC<BaseWidgetProps> = ({ config, children }) => {
  const className = 'w-full';
  return (
    <div className={className} data-widget-id={config.id}>
      {children}
    </div>
  );
};

export default BaseWidget;
