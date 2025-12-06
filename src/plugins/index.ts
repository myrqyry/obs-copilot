// src/plugins/index.ts - Update plugin registration
import {
  PluginManager,
  PluginDefinition,
} from '@/plugins/core/PluginManager';
import { PluginErrorBoundary } from '@/shared/components/common/PluginErrorBoundary';
import { obsClient } from '@/shared/services/obsClient';
import { geminiService } from '@/shared/services/geminiService';

// Import plugin components
import React from 'react';

const ConnectionsTab = React.lazy(() => import('@/plugins/core/ConnectionsTab'));
const GeminiTab = React.lazy(() => import('@/plugins/core/GeminiTab'));
const TwitchChat = React.lazy(() => import('@/plugins/twitch-chat/TwitchChat'));
const AutomationTab = React.lazy(() => import('@/plugins/automation/AutomationTab'));

// Create plugin manager instance
export const pluginManager = new PluginManager({
  obs: obsClient,
  gemini: geminiService,
});

// Define plugins with full lifecycle
const plugins: PluginDefinition[] = [
  {
    id: 'connections',
    name: 'Connections',
    version: '1.0.0',
    description: 'Manage OBS and backend connections',
    component: ConnectionsTab,
    async onInit(context) {
      console.log('[Connections Plugin] Initializing...');
      // Pre-load connection status
    },
    async onActivate() {
      console.log('[Connections Plugin] Activated');
    },
    async onDeactivate() {
      console.log('[Connections Plugin] Deactivated');
    },
  },
  {
    id: 'gemini-chat',
    name: 'Gemini Chat',
    version: '1.0.0',
    description: 'AI-powered chat assistant',
    component: GeminiTab,
    dependencies: ['connections'], // Requires connections to be registered first
    async onInit(context) {
      console.log('[Gemini Chat Plugin] Initializing...');
      if (!context.gemini.isConfigured()) {
        console.warn('Gemini API key not configured - plugin functionality will be limited');
        // Don't throw - allow plugin to load but show warning
      }
    },
    async onActivate() {
      console.log('[Gemini Chat Plugin] Activated');
      // Start listening for chat events
    },
    async onDeactivate() {
      console.log('[Gemini Chat Plugin] Deactivated');
      // Clean up event listeners
    },
    async onDestroy() {
      console.log('[Gemini Chat Plugin] Destroyed');
      // Cancel pending requests
    },
  },
  {
    id: 'twitch-chat',
    name: 'Twitch Chat',
    version: '1.0.0',
    description: 'Twitch chat integration with emote support',
    component: TwitchChat,
    async onInit(context) {
      console.log('[Twitch Chat Plugin] Initializing...');
      // Pre-load emote data
    },
    async onActivate() {
      console.log('[Twitch Chat Plugin] Activated');
    },
    async onDeactivate() {
      console.log('[Twitch Chat Plugin] Deactivated');
      // Disconnect from Twitch if connected
    },
  },
  {
    id: 'automation',
    name: 'Automation',
    version: '1.0.0',
    description: 'Create automated workflows',
    component: AutomationTab,
    dependencies: ['connections'],
    async onInit(context) {
      console.log('[Automation Plugin] Initializing...');
    },
    async onActivate() {
      console.log('[Automation Plugin] Activated');
      // Resume automation rules
    },
    async onDeactivate() {
      console.log('[Automation Plugin] Deactivated');
      // Pause automation rules
    },
  },
];

// Register all plugins
export async function initializePlugins() {
  for (const plugin of plugins) {
    try {
      await pluginManager.register(plugin);
    } catch (error) {
      console.error(`Failed to register plugin "${plugin.name}":`, error);
    }
  }
  // Notify the system that all plugins are loaded
  pluginManager.emit('plugins:loaded');
}
