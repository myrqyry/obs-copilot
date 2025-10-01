import { TabPlugin } from '@/types/plugins';
import TwitchChat from './TwitchChat';
import React from 'react';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

export const twitchChatPlugin: TabPlugin = {
  id: 'twitch-chat',
  name: 'Twitch Chat',
  icon: (props: any) => React.createElement(ChatBubbleIcon, props),
  component: TwitchChat,
};
