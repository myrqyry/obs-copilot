import React from 'react';
import { UniversalSlider } from './controls/UniversalSlider';
import { UniversalWidgetConfig } from '@/types/universalWidget';

interface SliderWidgetProps {
  config: UniversalWidgetConfig;
}

const SliderWidget: React.FC<SliderWidgetProps> = ({ config }) => {
  return <UniversalSlider config={config} />;
};

export default SliderWidget;