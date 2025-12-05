// src/hooks/usePlugins.ts
import { useState, useEffect } from 'react';
import { pluginManager } from '@/plugins';
import { Plugin } from '@/types/plugin';
import { PluginDefinition } from '@/plugins/core/PluginManager';

const mapPluginDefinitionToPlugin = (plugin: PluginDefinition): Plugin => ({
  id: plugin.id,
  name: plugin.name,
  icon: plugin.icon,
  component: plugin.component as React.ComponentType<any>, // Cast to any to satisfy the type
  enabled: true, // Assuming all registered plugins are enabled
  order: 0, // Assuming a default order
  version: plugin.version,
  description: plugin.description,
});


export function usePlugins(): Plugin[] {
  const [plugins, setPlugins] = useState<Plugin[]>(
    pluginManager.getAllPlugins().map(mapPluginDefinitionToPlugin)
  );

  useEffect(() => {
    const handlePluginsLoaded = () => {
      console.log('HOOK: usePlugins handling plugins:loaded event');
      const allPlugins = pluginManager.getAllPlugins();
      console.log(`HOOK: Found ${allPlugins.length} plugins.`);
      setPlugins(allPlugins.map(mapPluginDefinitionToPlugin));
    };

    console.log('HOOK: usePlugins effect setup');
    // Listen for the final "loaded" event
    pluginManager.on('plugins:loaded', handlePluginsLoaded);

    // Initial check in case plugins are already loaded
    handlePluginsLoaded();

    return () => {
      console.log('HOOK: usePlugins effect cleanup');
      pluginManager.off('plugins:loaded', handlePluginsLoaded);
    };
  }, []);

  return plugins;
}
