import React from 'react';
import { ObsClientImpl } from '@/shared/services/obsClient';
import { StreamerBotService } from '@/shared/services/streamerBotService';
import { AIService } from './ai';

export interface TabPlugin {
  id: string;
  name: string;
  icon: React.FC<any>;
  component: React.FC<any>;
}

/**
 * The context object provided to each plugin during initialization.
 * It provides access to core application services.
 */
export interface PluginContext {
  obsClient: ObsClientImpl | null;
  streamerBot: StreamerBotService | null;
  geminiService: AIService;
  registerCommand: (command: PluginCommand) => void;
  emitEvent: <T>(event: PluginEvent<T>) => void;
}

/**
 * Defines a command that a plugin can register with the application.
 */
export interface PluginCommand {
  /** A unique identifier for the command (e.g., 'my-plugin.do-something') */
  id: string;
  /** A user-friendly name for the command */
  name: string;
  /** The function to execute when the command is called */
  execute: (args?: any) => void;
}

/**
 * Defines a generic event that plugins can emit or listen for.
 */
export interface PluginEvent<T> {
  /** The name of the event (e.g., 'my-plugin.data-updated') */
  name: string;
  /** The payload associated with the event */
  payload: T;
}

/**
 * A comprehensive interface for a feature plugin, allowing for deep
 * integration with the application's lifecycle and services.
 */
export interface OBSCopilotPlugin {
  /** A unique identifier for the plugin */
  id: string;
  /** The display name of the plugin */
  name: string;
  /** The plugin's version number */
  version: string;
  /** An optional icon for the plugin's UI components */
  icon?: React.FC<any>;
  /** The main React component for the plugin's UI, if it has one */
  component?: React.FC<any>;

  /**
   * Called when the plugin is loaded by the PluginManager.
   * Use this to set up event listeners, register commands, etc.
   * @param context Provides access to core services.
   */
  initialize(context: PluginContext): Promise<void>;

  /**
   * Called when the plugin is being unloaded.
   * Use this to clean up resources, like event listeners.
   */
  cleanup(): Promise<void>;

  /**
   * Returns a list of commands that the plugin provides.
   */
  getCommands?(): PluginCommand[];

  /**
   * A handler for listening to events from other plugins or the core system.
   * @param event The event object containing the name and payload.
   */
  onEvent?<T>(event: PluginEvent<T>): Promise<void>;
}
