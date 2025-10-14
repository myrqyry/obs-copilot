import { useMemo } from 'react';
import { allPlugins } from '@/plugins';
import useConfigStore from '@/store/configStore';
import { TabPlugin } from '@/types/plugins';
import { useHealthStatus } from './useHealthStatus';

export const usePlugins = () => {
  const { twitchChatPluginEnabled, automationPluginEnabled, streamingAssetsPluginEnabled, createPluginEnabled, connectionsPluginEnabled, obsStudioPluginEnabled, geminiPluginEnabled, settingsPluginEnabled, advancedPluginEnabled, emoteWallPluginEnabled } = useConfigStore();
  const { reports } = useHealthStatus();

  const filteredPlugins = useMemo(() => {
    let plugins = allPlugins;

    const obsHealth = reports.find(r => r.service.startsWith('OBS'))?.status;
    const geminiHealth = reports.find(r => r.service === 'Gemini')?.status;

    // Filter based on settings
    if (!twitchChatPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'twitch-chat');
    if (!automationPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'automation');
    if (!streamingAssetsPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'streaming-assets');
    if (!createPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'create');
    if (!connectionsPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'connections');
    if (!obsStudioPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'obs-studio');
    if (!geminiPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'gemini');
    if (!settingsPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'settings');
    if (!advancedPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'advanced');
    if (!emoteWallPluginEnabled) plugins = plugins.filter((plugin) => plugin.id !== 'emote-wall');

    // Filter based on health
    if (obsHealth !== 'healthy') {
      plugins = plugins.filter(p => !['obs-studio', 'obs-controls', 'streaming-assets'].includes(p.id));
    }
    if (geminiHealth !== 'healthy') {
      plugins = plugins.filter(p => !['gemini', 'create'].includes(p.id));
    }

    const tabOrder = useConfigStore.getState().tabOrder as string[] | undefined;

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

    Object.keys(byOrder).forEach(k => ordered.push(byOrder[k]));

    return ordered;
  }, [
    twitchChatPluginEnabled,
    automationPluginEnabled,
    streamingAssetsPluginEnabled,
    createPluginEnabled,
    connectionsPluginEnabled,
    obsStudioPluginEnabled,
    geminiPluginEnabled,
    settingsPluginEnabled,
    advancedPluginEnabled,
    emoteWallPluginEnabled,
    reports,
    useConfigStore.getState().tabOrder,
  ]);

  return filteredPlugins;
};
