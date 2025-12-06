import React from 'react';
import { TabPlugin } from '@/shared/types/plugins';
import AutomationTab from './AutomationTab';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export const automationPlugin: TabPlugin = {
  id: 'automation',
  name: 'Automation',
  icon: (props: any) => React.createElement(AutoFixHighIcon, props),
  component: AutomationTab,
};