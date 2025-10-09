import { TabPlugin } from '@/types/plugins';
import ConnectionsTab from './core/ConnectionsTab';
import NewObsStudioTab from './core/NewObsStudioTab';
import ObsControlsTab from './core/ObsControlsTab'; // New import
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
import DashboardIcon from '@mui/icons-material/Dashboard'; // New icon

const GenerateTab = lazy(() => import('./core/GenerateTab'));

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
    id: 'obs-controls', // New tab
    name: 'OBS Controls',
    icon: (props: any) => React.createElement(DashboardIcon, props),
    component: ObsControlsTab,
  },
  {
    id: 'gemini',
    name: 'Generate',
    icon: (props: any) => React.createElement(AutoAwesomeIcon, props),
    component: GenerateTab,
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
import { emoteWallPlugin } from './emote-wall';

export const allPlugins = [...corePlugins, twitchChatPlugin, automationPlugin, emoteWallPlugin];
