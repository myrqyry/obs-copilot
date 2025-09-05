import { TabPlugin } from '@/types/plugins';
import TwitchChat from './TwitchChat';
import React from 'react';

const createEmojiIcon = (emoji: string) => () => React.createElement('span', { className: 'text-2xl' }, emoji);

export const twitchChatPlugin: TabPlugin = {
  id: 'twitch-chat',
  name: 'Twitch Chat',
  icon: createEmojiIcon('💬'),
  component: TwitchChat,
};
