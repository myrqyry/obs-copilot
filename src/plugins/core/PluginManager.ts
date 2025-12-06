// src/plugins/core/PluginManager.ts
import { EventEmitter } from 'eventemitter3';
import type { obsClient } from '@/shared/services/obsClient';
import type { geminiService } from '@/shared/services/geminiService';

export interface PluginContext {
  obs: typeof obsClient;
  gemini: typeof geminiService;
  events: EventEmitter;
  storage: Storage;
}

export interface PluginLifecycle {
  onInit?: (context: PluginContext) => Promise<void> | void;
  onActivate?: () => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  onDestroy?: () => Promise<void> | void;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  icon?: React.ComponentType;
  dependencies?: string[];
}

export interface PluginDefinition extends PluginLifecycle, PluginMetadata {
  component: React.ComponentType<{ context: PluginContext }>;
}

export class PluginManager {
  private plugins = new Map<string, PluginDefinition>();
  private activePlugin: string | null = null;
  private context: PluginContext;
  private events = new EventEmitter();
  private lifecycleState = new Map<
    string,
    'initialized' | 'active' | 'inactive'
  >();

  constructor(context: Omit<PluginContext, 'events' | 'storage'>) {
    this.context = {
      ...context,
      events: this.events,
      storage: window.localStorage,
    };
  }

  async register(plugin: PluginDefinition): Promise<void> {
    // Validate dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin "${plugin.id}" requires "${dep}", which is not registered`,
          );
        }
      }
    }

    // Check for ID conflicts
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with ID "${plugin.id}" is already registered`);
    }

    try {
      // Initialize plugin
      await plugin.onInit?.(this.context);
      this.plugins.set(plugin.id, plugin);
      this.lifecycleState.set(plugin.id, 'initialized');
      this.events.emit('plugin:registered', plugin.id);
      console.log(`✅ Plugin "${plugin.name}" registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize plugin "${plugin.id}":`, error);
      throw error;
    }
  }

  async activate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }

    // Deactivate current plugin if different
    if (this.activePlugin && this.activePlugin !== pluginId) {
      await this.deactivate(this.activePlugin);
    }

    try {
      await plugin.onActivate?.();
      this.activePlugin = pluginId;
      this.lifecycleState.set(pluginId, 'active');
      this.events.emit('plugin:activated', pluginId);
      console.log(`🚀 Plugin "${plugin.name}" activated`);
    } catch (error) {
      console.error(`❌ Failed to activate plugin "${pluginId}":`, error);
      throw error;
    }
  }

  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    try {
      await plugin.onDeactivate?.();
      if (this.activePlugin === pluginId) {
        this.activePlugin = null;
      }
      this.lifecycleState.set(pluginId, 'inactive');
      this.events.emit('plugin:deactivated', pluginId);
      console.log(`⏸️ Plugin "${plugin.name}" deactivated`);
    } catch (error) {
      console.error(`❌ Failed to deactivate plugin "${pluginId}":`, error);
    }
  }

  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    await this.deactivate(pluginId);

    try {
      await plugin.onDestroy?.();
      this.plugins.delete(pluginId);
      this.lifecycleState.delete(pluginId);
      this.events.emit('plugin:unregistered', pluginId);
      console.log(`🗑️ Plugin "${plugin.name}" unregistered`);
    } catch (error) {
      console.error(`❌ Failed to destroy plugin "${pluginId}":`, error);
    }
  }

  getPlugin(pluginId: string): PluginDefinition | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugin(): PluginDefinition | undefined {
    return this.activePlugin
      ? this.plugins.get(this.activePlugin)
      : undefined;
  }

  getPluginState(pluginId: string): string | undefined {
    return this.lifecycleState.get(pluginId);
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }

  emit(event: string, ...args: any[]): void {
    this.events.emit(event, ...args);
  }

  getContext(): PluginContext {
    return this.context;
  }
}
