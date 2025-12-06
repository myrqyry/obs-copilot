import React, { lazy } from 'react';
import { TabPlugin } from '@/shared/types/plugins';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

const EmoteWallTab = lazy(() => import('./EmoteWallTab'));

export const emoteWallPlugin: TabPlugin = {
  id: 'emote-wall',
  name: 'Emote Wall',
  icon: (props: any) => React.createElement(EmojiEmotionsIcon, props),
  component: EmoteWallTab,
};