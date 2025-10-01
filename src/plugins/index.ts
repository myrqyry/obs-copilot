import { TabPlugin } from '@/types/plugins';
import ConnectionsTab from './core/ConnectionsTab';
import NewObsStudioTab from './core/NewObsStudioTab';
import CreateTab from './core/CreateTab';
import StreamingAssetsTab from './core/StreamingAssetsTab';
import SettingsTab from './core/SettingsTab';
import AdvancedPanel from './core/AdvancedPanel';
import React, { lazy } from 'react';
import LinkIcon from '@mui/icons-material/Link';
import MovieIcon from '@mui/icons-material/Movie';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';

const GeminiTab = lazy(() => import('./core/GeminiTab'));

export const corePlugins: TabPlugin[] = [
  {
    id: 'connections',
    name: 'Connections',
    icon: (props: any) => React.createElement(LinkIcon, props),
    component: ConnectionsTab,
  },
  {
    id: 'obs-studio',
    name: 'OBS Studio',
    icon: (props: any) => React.createElement(MovieIcon, props),
    component: NewObsStudioTab,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: (props: any) => React.createElement(DeveloperBoardIcon, props),
    component: GeminiTab,
  },
  {
    id: 'create',
    name: 'Create',
    icon: (props: any) => React.createElement(AutoAwesomeIcon, props),
    component: CreateTab,
  },
  {
    id: 'streaming-assets',
    name: 'Streaming Assets',
    icon: (props: any) => React.createElement(ImageIcon, props),
    component: StreamingAssetsTab,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: (props: any) => React.createElement(SettingsIcon, props),
    component: SettingsTab,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: (props: any) => React.createElement(BuildIcon, props),
    component: AdvancedPanel,
  },
];

import { twitchChatPlugin } from './twitch-chat';
import { automationPlugin } from './automation';

export const allPlugins = [...corePlugins, twitchChatPlugin, automationPlugin];
