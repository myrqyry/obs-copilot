import { useMemo } from 'react';
import { allPlugins } from '@/plugins';
import useConfigStore from '@/store/configStore';
import { TabPlugin } from '@/types/plugins';
import { useHealthStatus } from './useHealthStatus';

export const usePlugins = () => {
  // REASON: The original implementation had a large dependency array and complex filtering logic.
  // This has been updated to simplify the filtering logic and reduce the dependency array.
  const { reports } = useHealthStatus();
  const { tabOrder, ...pluginSettings } = useConfigStore();

  const filteredPlugins = useMemo(() => {
    const obsHealth = reports.find(r => r.service.startsWith('OBS'))?.status;
    const geminiHealth = reports.find(r => r.service === 'Gemini')?.status;

    const healthFilters: Record<string, boolean> = {
      'obs-studio': obsHealth === 'healthy',
      'obs-controls': obsHealth === 'healthy',
      'streaming-assets': obsHealth === 'healthy',
      'gemini': geminiHealth === 'healthy',
      'create': geminiHealth === 'healthy',
    };

    let plugins = allPlugins.filter(plugin => {
      const isEnabled = (pluginSettings as any)[`${plugin.id}PluginEnabled`];
      const healthCheck = healthFilters[plugin.id];
      return (isEnabled === undefined || isEnabled) && (healthCheck === undefined || healthCheck);
    });

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
  }, [reports, tabOrder, pluginSettings]);

  return filteredPlugins;
};
