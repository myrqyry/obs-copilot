import { useMemo } from 'react';
import { allPlugins } from '@/plugins';
import useSettingsStore from '@/store/settingsStore';

export const usePlugins = () => {
  const { twitchChatPluginEnabled } = useSettingsStore();

  const filteredPlugins = useMemo(() => {
    if (twitchChatPluginEnabled) {
      return allPlugins;
    }
    return allPlugins.filter((plugin) => plugin.id !== 'twitch-chat');
  }, [twitchChatPluginEnabled]);

  return filteredPlugins;
};
