import { TabPlugin } from '@/types/plugins';
import React, { lazy } from 'react';
import LinkIcon from '@mui/icons-material/Link';
import MovieIcon from '@mui/icons-material/Movie';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ImageIcon from '@mui/icons-material/Image';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FavoriteIcon from '@mui/icons-material/Favorite';

// Lazy load all plugin components
const ConnectionsTab = lazy(() => import('./core/ConnectionsTab'));
const NewObsStudioTab = lazy(() => import('./core/NewObsStudioTab'));
const ObsControlsTab = lazy(() => import('./core/ObsControlsTab'));
const GeminiTab = lazy(() => import('./core/GeminiTab'));
const GenerateTab = lazy(() => import('./core/GenerateTab'));
const StreamingAssetsTab = lazy(() => import('./core/StreamingAssetsTab'));
const SettingsTab = lazy(() => import('./core/SettingsTab'));
const AdvancedPanel = lazy(() => import('./core/AdvancedPanel'));
const HealthDashboard = lazy(() => import('@/components/debug/HealthDashboard'));

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
    id: 'obs-controls',
    name: 'OBS Controls',
    icon: (props: any) => React.createElement(DashboardIcon, props),
    component: ObsControlsTab,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: (props: any) => React.createElement(DeveloperBoardIcon, props),
    component: GeminiTab,
  },
  {
    id: 'create',
    name: 'Generate',
    icon: (props: any) => React.createElement(AutoAwesomeIcon, props),
    component: GenerateTab,
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
  {
    id: 'health',
    name: 'Health',
    icon: (props: any) => React.createElement(FavoriteIcon, props),
    component: HealthDashboard,
  },
];

import { twitchChatPlugin } from './twitch-chat';
import { automationPlugin } from './automation';
import { emoteWallPlugin } from './emote-wall';

export const allPlugins = [...corePlugins, twitchChatPlugin, automationPlugin, emoteWallPlugin];
