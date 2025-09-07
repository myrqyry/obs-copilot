import React from 'react';
import { UniversalKnob } from './controls/UniversalKnob';
import { UniversalWidgetConfig } from '@/types/universalWidget';

interface KnobWidgetProps {
  config: UniversalWidgetConfig;
}

const KnobWidget: React.FC<KnobWidgetProps> = ({ config }) => {
  return <UniversalKnob config={config} />;
};

export default KnobWidget;