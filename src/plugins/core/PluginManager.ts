import { EventEmitter } from 'eventemitter3';
import { z } from 'zod';

// Faked service types for demonstration purposes
type OBSService = { triggerHotkey: (name: string) => void };
type GeminiService = {};
type StoreAPI = {};

export interface PluginContext {
  obs: OBSService;
  gemini: GeminiService;
  store: StoreAPI;
  events: EventEmitter;
}

export interface PluginLifecycle {
  onInit?: (context: PluginContext) => Promise<void> | void;
  onActivate?: () => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  onDestroy?: () => Promise<void> | void;
}

export interface PluginDefinition extends PluginLifecycle {
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: React.ComponentType;
  component: React.ComponentType<{ context: PluginContext }>;
  dependencies?: string[];
  settings?: {
    schema: z.ZodSchema;
    defaultValues: Record<string, unknown>;
  };
}

export class PluginManager {
  private plugins = new Map<string, PluginDefinition>();
  private activePlugin: string | null = null;
  private context: PluginContext;
  private events = new EventEmitter();

  constructor(context: Omit<PluginContext, 'events'>) {
    this.context = { ...context, events: this.events };
  }

  async register(plugin: PluginDefinition): Promise<void> {
    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin ${plugin.id} depends on ${dep}, which is not registered`
          );
        }
      }
    }

    // Initialize plugin
    try {
      await plugin.onInit?.(this.context);
      this.plugins.set(plugin.id, plugin);
      this.events.emit('plugin:registered', plugin.id);
    } catch (error) {
      console.error(`Failed to initialize plugin ${plugin.id}:`, error);
      throw error;
    }
  }

  async activate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Deactivate current plugin
    if (this.activePlugin && this.activePlugin !== pluginId) {
      await this.deactivate(this.activePlugin);
    }

    // Activate new plugin
    try {
      await plugin.onActivate?.();
      this.activePlugin = pluginId;
      this.events.emit('plugin:activated', pluginId);
    } catch (error) {
      console.error(`Failed to activate plugin ${pluginId}:`, error);
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
      this.events.emit('plugin:deactivated', pluginId);
    } catch (error) {
      console.error(`Failed to deactivate plugin ${pluginId}:`, error);
    }
  }

  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    await this.deactivate(pluginId);

    try {
      await plugin.onDestroy?.();
      this.plugins.delete(pluginId);
      this.events.emit('plugin:unregistered', pluginId);
    } catch (error) {
      console.error(`Failed to destroy plugin ${pluginId}:`, error);
    }
  }

  getPlugin(pluginId: string): PluginDefinition | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugin(): PluginDefinition | undefined {
    return this.activePlugin ? this.plugins.get(this.activePlugin) : undefined;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }
}
