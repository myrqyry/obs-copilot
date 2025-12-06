import React from 'react';

export interface Plugin {
    id: string;
    name: string;
    icon?: React.ComponentType<any>;
    component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
    enabled: boolean;
    order?: number;
}

export interface PluginRegistry {
    plugins: Plugin[];
    registerPlugin: (plugin: Plugin) => void;
    unregisterPlugin: (id: string) => void;
    getPlugin: (id: string) => Plugin | undefined;
    getEnabledPlugins: () => Plugin[];
}
