import React from 'react';
import { WidgetControlType, UniversalWidgetConfig } from '@/shared/types/universalWidget';
import { ButtonRenderer } from './ButtonRenderer';
import { SliderRenderer } from './SliderRenderer';
import { SwitchRenderer } from './SwitchRenderer';
// import { PickerRenderer } from './PickerRenderer'; // Add as needed

export interface WidgetRendererProps {
  config: UniversalWidgetConfig;
  value: any;
  onChange: (value: any) => void;
  isLoading: boolean;
  options?: string[];
}

const UnknownRenderer: React.FC<WidgetRendererProps> = ({ config }) => (
  <div className="p-4 border border-dashed border-muted-foreground/50 rounded text-center">
    <p className="text-xs text-muted-foreground">Unknown Control Type</p>
    <p className="text-sm font-bold">{config.controlType}</p>
  </div>
);

export const widgetRegistry: Record<string, React.FC<WidgetRendererProps>> = {
  [WidgetControlType.BUTTON]: ButtonRenderer,
  [WidgetControlType.SLIDER]: SliderRenderer,
  [WidgetControlType.SWITCH]: SwitchRenderer,
  // [WidgetControlType.PICKER]: PickerRenderer, // Add as needed
};

export const getWidgetComponent = (type: WidgetControlType | string): React.FC<WidgetRendererProps> => {
  return widgetRegistry[type] || UnknownRenderer;
};
