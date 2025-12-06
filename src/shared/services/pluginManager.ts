import { OBSCopilotPlugin, PluginContext, PluginCommand, PluginEvent } from '@/types/plugins';
import useConnectionsStore from '@/store/connections';
import { geminiService } from './geminiService';
import { logger } from '@/utils/logger';

class PluginManager {
  private plugins: Map<string, OBSCopilotPlugin> = new Map();
  private commands: Map<string, PluginCommand> = new Map();

  public async loadPlugin(plugin: OBSCopilotPlugin) {
    if (this.plugins.has(plugin.id)) {
      logger.warn(`Plugin "${plugin.name}" is already loaded.`);
      return;
    }

    try {
      const context = this.createPluginContext();
      await plugin.initialize(context);
      this.plugins.set(plugin.id, plugin);

      if (plugin.getCommands) {
        plugin.getCommands().forEach(command => this.registerPluginCommand(command));
      }

      logger.info(`Plugin "${plugin.name}" (v${plugin.version}) loaded successfully.`);
    } catch (error) {
      logger.error(`Failed to load plugin "${plugin.name}":`, error);
    }
  }

  public async unloadPlugin(pluginId: string) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      logger.warn(`Attempted to unload a plugin that is not loaded: ${pluginId}`);
      return;
    }

    try {
      await plugin.cleanup();
      // Unregister commands associated with this plugin
      if (plugin.getCommands) {
        plugin.getCommands().forEach(command => this.commands.delete(command.id));
      }
      this.plugins.delete(pluginId);
      logger.info(`Plugin "${plugin.name}" unloaded successfully.`);
    } catch (error) {
      logger.error(`Failed to unload plugin "${plugin.name}":`, error);
    }
  }

  public getLoadedPlugins(): OBSCopilotPlugin[] {
    return Array.from(this.plugins.values());
  }

  private createPluginContext(): PluginContext {
    return {
      obsClient: useConnectionsStore.getState().obs,
      streamerBot: useConnectionsStore.getState().streamerBotServiceInstance,
      geminiService,
      registerCommand: this.registerPluginCommand.bind(this),
      emitEvent: this.emitPluginEvent.bind(this),
    };
  }

  private registerPluginCommand(command: PluginCommand) {
    if (this.commands.has(command.id)) {
      logger.warn(`Command "${command.id}" is already registered. It will be overwritten.`);
    }
    this.commands.set(command.id, command);
  }

  public emitPluginEvent<T>(event: PluginEvent<T>) {
    logger.debug(`Emitting event: ${event.name}`, event.payload);
    this.plugins.forEach(plugin => {
      if (plugin.onEvent) {
        plugin.onEvent(event).catch(error => {
          logger.error(`Error in plugin "${plugin.name}" while handling event "${event.name}":`, error);
        });
      }
    });
  }
}

export const pluginManager = new PluginManager();