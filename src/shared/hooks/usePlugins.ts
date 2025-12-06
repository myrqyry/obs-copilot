// src/hooks/usePlugins.tsx
import { useState, useEffect } from 'react';
import { pluginManager, initializePlugins } from '@/plugins';

export function usePlugins() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPlugins() {
      try {
        await initializePlugins();
        if (mounted) {
          setPlugins(pluginManager.getAllPlugins().map((plugin) => ({
            id: plugin.id,
            name: plugin.name,
            icon: plugin.icon,
            component: plugin.component,
          })));
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize plugins:', err);
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    }

    loadPlugins();

    // Listen for plugin changes
    const handlePluginChange = () => {
      if (mounted) {
        setPlugins(pluginManager.getAllPlugins().map((plugin) => ({
          id: plugin.id,
          name: plugin.name,
          icon: plugin.icon,
          component: plugin.component,
        })));
      }
    };

    pluginManager.on('plugin:registered', handlePluginChange);
    pluginManager.on('plugin:unregistered', handlePluginChange);

    return () => {
      mounted = false;
      pluginManager.off('plugin:registered', handlePluginChange);
      pluginManager.off('plugin:unregistered', handlePluginChange);
    };
  }, []);

  return { plugins, isLoading, error };
}
