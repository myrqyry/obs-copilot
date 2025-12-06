import { TabPlugin } from '@/shared/types/plugins';
import React, { lazy } from 'react';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';

const TwitchChat = lazy(() => import('./TwitchChat'));

export const twitchChatPlugin: TabPlugin = {
  id: 'twitch-chat',
  name: 'Twitch Chat',
  icon: (props: any) => React.createElement(ChatBubbleIcon, props),
  component: TwitchChat,
};
