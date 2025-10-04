import { useMemo } from 'react';
import { allPlugins } from '@/plugins';
import useSettingsStore from '@/store/settingsStore';
import useTwitchStore from '@/store/twitchStore';
import { TabPlugin } from '@/types/plugins';

export const usePlugins = () => {
  // Use specific selectors for performance
  const automationPluginEnabled = useSettingsStore(state => state.automationPluginEnabled);
  const streamingAssetsPluginEnabled = useSettingsStore(state => state.streamingAssetsPluginEnabled);
  const createPluginEnabled = useSettingsStore(state => state.createPluginEnabled);
  const tabOrder = useSettingsStore(state => state.tabOrder);
  const twitchChatPluginEnabled = useTwitchStore(state => state.twitchChatPluginEnabled);

  const filteredPlugins = useMemo(() => {
    let plugins = allPlugins;
    
    if (!twitchChatPluginEnabled) {
      plugins = plugins.filter((plugin) => plugin.id !== 'twitch-chat');
    }
    
    if (!automationPluginEnabled) {
      plugins = plugins.filter((plugin) => plugin.id !== 'automation');
    }
    
    if (!streamingAssetsPluginEnabled) {
      plugins = plugins.filter((plugin) => plugin.id !== 'streaming-assets');
    }

    if (!createPluginEnabled) {
      plugins = plugins.filter((plugin) => plugin.id !== 'create');
    }

    if (!tabOrder || tabOrder.length === 0) return plugins;

    const byOrder: Record<string, TabPlugin> = {};
    plugins.forEach(p => byOrder[p.id] = p);

    const ordered: TabPlugin[] = [];
    tabOrder.forEach(id => {
      if (byOrder[id]) {
        ordered.push(byOrder[id]);
        delete byOrder[id];
      }
    });

    // append any remaining plugins not present in tabOrder
    Object.keys(byOrder).forEach(k => ordered.push(byOrder[k]));

    return ordered;
  }, [twitchChatPluginEnabled, automationPluginEnabled, streamingAssetsPluginEnabled, createPluginEnabled, tabOrder]);

  return filteredPlugins;
};