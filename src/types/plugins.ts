import React from 'react';

export interface TabPlugin {
  id: string;
  name: string;
  icon: React.FC<any>;
  component: React.FC<any>;
}
