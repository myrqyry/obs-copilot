import { useMemo } from 'react';
import { allPlugins } from '@/plugins';
import useConfigStore from '@/store/configStore';
import { Plugin } from '@/types/plugin';
import { useHealthStatus } from './useHealthStatus';

export const usePlugins = (): Plugin[] => {
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

    // Map to Plugin type
    let mappedPlugins: Plugin[] = plugins.map(p => ({
        ...p,
        enabled: true, // They are already filtered by enabled status
        order: 0 // Default order
    }));

    if (!tabOrder || tabOrder.length === 0) return mappedPlugins;

    const byOrder: Record<string, Plugin> = {};
    mappedPlugins.forEach(p => byOrder[p.id] = p);

    const ordered: Plugin[] = [];
    tabOrder.forEach(id => {
      const plugin = byOrder[id];
      if (plugin) {
        ordered.push(plugin);
        delete byOrder[id];
      }
    });

    Object.keys(byOrder).forEach(k => {
        const p = byOrder[k];
        if (p) ordered.push(p);
    });

    return ordered;
  }, [reports, tabOrder, pluginSettings]);

  return filteredPlugins;
};
