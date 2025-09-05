import { TabPlugin } from '@/types/plugins';
import ConnectionsTab from './core/ConnectionsTab';
import ObsStudioTab from './core/ObsStudioTab';
import GeminiTab from './core/GeminiTab';
import CreateTab from './core/CreateTab';
import StreamingAssetsTab from './core/StreamingAssetsTab';
import SettingsTab from './core/SettingsTab';
import AdvancedPanel from './core/AdvancedPanel';
import React from 'react';

// A simple way to create icon components from emojis
const createEmojiIcon = (emoji: string) => () => React.createElement('span', { className: 'text-2xl' }, emoji);

export const corePlugins: TabPlugin[] = [
  {
    id: 'connections',
    name: 'Connections',
    icon: createEmojiIcon('🔌'),
    component: ConnectionsTab,
  },
  {
    id: 'obs-studio',
    name: 'OBS Studio',
    icon: createEmojiIcon('🎬'),
    component: ObsStudioTab,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: createEmojiIcon('🤖'),
    component: GeminiTab,
  },
  {
    id: 'create',
    name: 'Create',
    icon: createEmojiIcon('✨'),
    component: CreateTab,
  },
  {
    id: 'streaming-assets',
    name: 'Streaming Assets',
    icon: createEmojiIcon('🌈'),
    component: StreamingAssetsTab,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: createEmojiIcon('⚙️'),
    component: SettingsTab,
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: createEmojiIcon('🛠️'),
    component: AdvancedPanel,
  },
];

import { twitchChatPlugin } from './twitch-chat';

export const allPlugins = [...corePlugins, twitchChatPlugin];
