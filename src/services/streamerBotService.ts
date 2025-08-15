// src/services/streamerBotService.ts

import { StreamerbotClient } from '@streamerbot/client';
import { logger } from '../utils/logger';

// Define our own Action interface based on expected structure
interface Action {
  id: string;
  name: string;
  // Add other properties as needed based on actual response structure
}

// Define our own Broadcaster interface
interface Broadcaster {
  id?: string;
  username?: string;
  displayName?: string;
  // Add other properties as needed based on actual response structure
}

export class StreamerBotService {
  private static instance: StreamerBotService;
  public client: StreamerbotClient | null = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): StreamerBotService {
    if (!StreamerBotService.instance) {
      StreamerBotService.instance = new StreamerBotService();
    }
    return StreamerBotService.instance;
  }

  async connect(address: string, port: number, maxRetries: number = 2): Promise<void> {
    // If already connected, return immediately
    if (this.client && this.isConnected()) {
      logger.info('Already connected to Streamer.bot, skipping connection attempt');
      return;
    }

    // If a connection is already in progress, wait for it to complete
    if (this.isConnecting && this.connectionPromise) {
      logger.info('Connection already in progress, waiting for completion...');
      try {
        await this.connectionPromise;
        return; // Connection completed successfully
      } catch (error) {
        // Connection failed, we can try again
        logger.info('Previous connection attempt failed, retrying...');
      }
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      throw new Error('Connection attempt already in progress');
    }

    this.isConnecting = true;

    // Create a promise that we can reference to prevent duplicate connections
    this.connectionPromise = this._performConnectionWithRetry(address, port, maxRetries);

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

private async _performConnectionWithRetry(
  address: string,
  port: number,
  maxRetries: number,
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        // We wait for the delay without logging to the console to reduce spam.
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // This will perform the actual connection attempt.
      await this._performConnection(address, port);
      
      // If the line above doesn't throw an error, the connection was successful.
      return; // Success! Exit the loop.

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // We only log the final error after all retries have failed.
      if (attempt === maxRetries) {
          logger.error(
              `Failed to connect to Streamer.bot after ${maxRetries + 1} attempts.`,
              lastError
          );
      }
    }
  }

  // If the loop finishes without a successful connection, throw the last known error.
  if (lastError) {
      throw new Error(`Could not connect to Streamer.bot after ${maxRetries + 1} attempts. Please ensure it is running and the WebSocket server is enabled.`);
  }
}

  private async _performConnection(address: string, port: number): Promise<void> {
    try {
      logger.info(`Attempting to connect to Streamer.bot at ${address}:${port}`);

      // Clean up any existing client
      if (this.client) {
        try {
          this.client.disconnect();
        } catch (e) {
          logger.warn('Error disconnecting existing client:', e);
        }
        this.client = null;
      }

      this.client = new StreamerbotClient({
        host: address,
        port: port,
      });

      // Add connection timeout
      const connectionTimeout = 10000; // 10 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Connection timeout after ${connectionTimeout}ms`)),
          connectionTimeout,
        );
      });

      // Race between connection and timeout
      await Promise.race([this.client.connect(), timeoutPromise]);

      logger.info('Successfully connected to Streamer.bot');
    } catch (error) {
      logger.error('Streamer.bot connection failed:', error);
      this.client = null;

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(
            `Connection refused to ${address}:${port}. Please ensure Streamer.bot is running and the WebSocket server is enabled.`,
          );
        } else if (error.message.includes('timeout')) {
          throw new Error(
            `Connection timeout to ${address}:${port}. Please check if Streamer.bot is running.`,
          );
        } else if (error.message.includes('WebSocket is closed')) {
          throw new Error(
            `WebSocket connection failed to ${address}:${port}. Please verify Streamer.bot WebSocket settings.`,
          );
        } else if (error.message.includes('Connection attempt already in progress')) {
          throw new Error(
            `Connection attempt already in progress. Please wait for the current connection to complete.`,
          );
        } else if (
          error.message.includes('WebSocket closed before the connection is established')
        ) {
          throw new Error(
            `WebSocket connection was closed before establishment. Please check if Streamer.bot is running and the WebSocket server is enabled on port ${port}.`,
          );
        }
      }

      // Provide general troubleshooting guidance
      const troubleshootingTips = `
            
Troubleshooting tips:
1. Make sure Streamer.bot is running
2. Verify WebSocket server is enabled in Streamer.bot settings
3. Check that the port ${port} is correct and not blocked by firewall
4. Try restarting Streamer.bot if the issue persists`;

      throw new Error(
        `Failed to connect to Streamer.bot at ${address}:${port}: ${error instanceof Error ? error.message : 'Unknown error'}${troubleshootingTips}`,
      );
    }
  }

  disconnect() {
    if (this.client) {
      try {
        this.client.disconnect();
      } catch (e) {
        logger.warn('Error disconnecting Streamer.bot client:', e);
      }
      this.client = null;
    }
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  isConnected(): boolean {
    return this.client !== null && !this.isConnecting;
  }

  isConnectingToStreamerBot(): boolean {
    return this.isConnecting;
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.client) return;
    this.client.on(event as any, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (!this.client) return;
    (this.client as any).off(event, callback);
  }

  onEvent(callback: (event: Record<string, unknown>) => void): void {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    // The client's `on` method can listen to all events using '*'
    this.client.on('*', (message) => {
      callback(message.data.event);
    });
    logger.info('Subscribed to all Streamer.bot events.');
  }

  /**
   * Fetches broadcaster information
   */
  async getBroadcaster(): Promise<Broadcaster | undefined> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    return this.client.getBroadcaster() as Broadcaster;
  }

  /**
   * Fetches all available actions from Streamer.bot
   */
  async getActions(): Promise<Action[]> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    // getActions returns an object, not an array, so extract the actions array
    const response = await this.client.getActions();
    // The response is typically { actions: [...] }
    if (response && Array.isArray(response.actions)) {
      return response.actions;
    }
    // Fallback: return empty array if not found
    return [];
  }

  /**
   * Triggers an action in Streamer.bot by its ID or name
   */
  async doAction(actionIdentifier: string, args: Record<string, unknown> = {}): Promise<void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    // The client's doAction method accepts an object with name or id
    const identifier: { id?: string; name?: string } = {};
    if (actionIdentifier.match(/^[0-9a-f-]{36}$/i)) {
      identifier.id = actionIdentifier;
    } else {
      identifier.name = actionIdentifier;
    }

    await this.client.doAction(identifier, args);
  }

  /**
   * Sends a request generated by the Gemini model.
   * This now acts as a wrapper around the client's methods.
   * @param action The action object generated by Gemini
   */
  async executeBotAction(action: {
    type: string;
    args?: Record<string, unknown>;
  }): Promise<unknown> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    switch (action.type) {
      case 'GetActions': {
        // getActions returns an object, not an array
        const response = await this.client.getActions();
        return response;
      }
      case 'DoAction': {
        if (!action.args?.action) throw new Error('DoAction requires an action identifier.');
        return this.client.doAction(action.args.action as any, action.args.args as any);
      }
      case 'CreateAction': {
        // For now, CreateAction is not directly supported by the client
        // We'll simulate the action creation by throwing a helpful error
        throw new Error(
          'CreateAction is not currently supported by the Streamer.bot client library. You can create actions manually in Streamer.bot and then use DoAction to trigger them.',
        );
      }
      case 'UpdateAction': {
        throw new Error(
          'UpdateAction is not currently supported by the Streamer.bot client library.',
        );
      }
      case 'DeleteAction': {
        throw new Error(
          'DeleteAction is not currently supported by the Streamer.bot client library.',
        );
      }
      case 'TwitchSendMessage': {
        // This would need to be handled by a pre-existing action in Streamer.bot
        // that handles Twitch chat messages
        if (!action.args?.message) throw new Error('TwitchSendMessage requires a message.');

        // Try to find and trigger a Twitch send message action
        return await this.client.doAction(
          { name: 'Send Twitch Message' },
          {
            message: action.args.message,
          },
        );
      }
      case 'TwitchCreatePoll': {
        // This would need to be handled by a pre-existing action in Streamer.bot
        // that handles Twitch chat messages
        if (!action.args?.title || !action.args?.choices)
          throw new Error('TwitchCreatePoll requires title and choices.');

        // Try to find and trigger a Twitch create poll action
        return await this.client.doAction(
          { name: 'Create Twitch Poll' },
          {
            title: action.args.title,
            choices: action.args.choices,
            duration: action.args.duration || 60,
          },
        );
      }
      // Add more cases as needed
      default:
        throw new Error(`Unsupported Streamer.bot action type: ${action.type}`);
    }
  }
}
