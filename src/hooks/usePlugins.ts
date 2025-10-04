import { useMemo } from 'react';
import { allPlugins } from '@/plugins';
import useSettingsStore from '@/store/settingsStore';
import { TabPlugin } from '@/types/plugins';

export const usePlugins = () => {
  const { twitchChatPluginEnabled, automationPluginEnabled, streamingAssetsPluginEnabled, createPluginEnabled } = useSettingsStore();

  const filteredPlugins = useMemo(() => {
    console.log('usePlugins filtering:', {
      twitchChatPluginEnabled,
      automationPluginEnabled,
      allPluginsCount: allPlugins.length
    });

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

  const tabOrder = useSettingsStore.getState().tabOrder as string[] | undefined;

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
  }, [twitchChatPluginEnabled, automationPluginEnabled, streamingAssetsPluginEnabled, createPluginEnabled, useSettingsStore((s) => s.tabOrder)]);

  console.log('usePlugins returning:', filteredPlugins.map(p => p.id));
  return filteredPlugins;
};
