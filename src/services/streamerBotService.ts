// src/services/streamerBotService.ts

import { StreamerbotClient } from '@streamerbot/client';
import { logger } from '../utils/logger';
import { backoff } from '@/lib/utils';
import {
  ConnectionState,
  StreamerBotClientOptions,
  StreamerBotError,
  ConnectionLifecycleCallbacks,
  StreamerBotActionDescriptor,
  ActionListResponse,
  RunActionResponse,
  StreamerBotInfo,
  GetEventsResponse,
  GetInfoResponse,
  GetBroadcasterResponse,
  GetActiveViewersResponse,
  GetCommandsResponse,
  GetGlobalsResponse,
  GetGlobalResponse,
  TwitchGetUserGlobalsResponse,
  TwitchGetUserGlobalResponse,
  TwitchGetEmotesResponse,
  YouTubeGetEmotesResponse,
  GetCodeTriggersResponse,
  GetCreditsResponse,
  EventSubscription,
  FileExistsResponse,
  FolderExistsResponse,
  StreamerBotActionConfig,
} from '../types/streamerbot';

type Command<T = any> = {
  id: string;
  method: string;
  args: any[];
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  connEpoch: number;
};

export class StreamerBotService {
  private static instance: StreamerBotService;
  public client: StreamerbotClient | null = null;
  private state: ConnectionState = 'disconnected';
  private lifecycleCallbacks: ConnectionLifecycleCallbacks | null = null;
  private connEpoch = 0;
  private commandQueue: Command[] = [];
  private retryCount = 0;
  private connectOptions: StreamerBotClientOptions | null = null;

  // Keep references to bound listeners so we can remove them on disconnect
  private boundOnConnect?: (info?: unknown) => void;
  private boundOnDisconnect?: (code?: number, reason?: string) => void;
  private boundOnError?: (err?: unknown) => void;
  private boundOnAnyEvent?: (message?: any) => void;

  private constructor() {}

  public static getInstance(): StreamerBotService {
    if (!StreamerBotService.instance) {
      StreamerBotService.instance = new StreamerBotService();
    }
    return StreamerBotService.instance;
  }

  async connect(
    a: string | StreamerBotClientOptions,
    b?: number,
    _maxRetries?: number,
  ): Promise<void> {
    const options: StreamerBotClientOptions =
      typeof a === 'string'
        ? {
            host: a,
            port: typeof b === 'number' ? b : undefined,
          }
        : a;

    if (!options.host || !options.port) {
      throw new Error('Streamer.bot host and port are required to connect.');
    }

    this.connectOptions = options;

    if (this.state === 'connecting' || this.state === 'connected') {
      logger.info('StreamerBotService: connect() called while already connecting/connected; ignoring.');
      return;
    }

    this.state = 'connecting';
    logger.info(`StreamerBotService: attempting to connect to ${options.host}:${options.port}`);

    await this._internalConnect();
  }

  private async _internalConnect(): Promise<void> {
    if (!this.connectOptions) {
        logger.error("Cannot connect; no connection options saved.");
        this.state = 'disconnected';
        return;
    }

    // Clean up existing client if present
    if (this.client) {
        try {
            this._removeClientListeners();
            this.client.disconnect();
        } catch (e) {
            logger.warn('StreamerBotService: error while disconnecting existing client', e);
        }
        this.client = null;
    }

    try {
        const clientOpts: any = {
            ...this.connectOptions,
            autoReconnect: false, // We are handling reconnects manually
        };

        this.client = new StreamerbotClient(clientOpts);
        this._bindClientListeners();

        await this.client.connect();

        this.state = 'connected';
        this.connEpoch++;
        this.retryCount = 0;
        logger.info('StreamerBotService: connected to Streamer.bot');

        this.processCommandQueue();

        let info: StreamerBotInfo | undefined;
        try {
            const serverInfo = (this.client.getInfo && (await this.client.getInfo())) || undefined;
            info = serverInfo as StreamerBotInfo;
        } catch (err) {
            logger.debug('StreamerBotService: getInfo failed', err);
        }

        if (this.lifecycleCallbacks?.onConnect) {
            this.lifecycleCallbacks.onConnect(info || {});
        }

    } catch (rawErr) {
        const sbErr = this._normalizeError(rawErr);
        logger.error('StreamerBotService: connection failed', sbErr);
        this.state = 'reconnecting';
        this.handleReconnect();
        if (this.lifecycleCallbacks?.onError) {
            this.lifecycleCallbacks.onError(sbErr);
        }
    }
  }

  private async handleReconnect() {
    if (!this.connectOptions) {
        logger.error("Cannot reconnect; no connection options saved.");
        this.state = 'disconnected';
        return;
    }
    this.retryCount++;
    const delay = backoff(this.retryCount);
    logger.info(`Streamer.bot connection lost. Reconnecting in ${delay.toFixed(0)}ms (attempt ${this.retryCount})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    this._internalConnect();
  }

  disconnect(): void {
    this.connectOptions = null; // Prevent reconnecting
    if (this.client) {
      try {
        this._removeClientListeners();
        this.client.disconnect();
      } catch (e) {
        logger.warn('StreamerBotService: Error disconnecting Streamer.bot client:', e);
      }
      this.client = null;
    }

    const prevState = this.state;
    this.state = 'disconnected';
    logger.info(`StreamerBotService: disconnected (previous state: ${prevState})`);

    if (this.lifecycleCallbacks?.onDisconnect) {
      this.lifecycleCallbacks.onDisconnect();
    }
  }

  private processCommandQueue() {
    const queue = this.commandQueue;
    this.commandQueue = [];
    logger.info(`Processing ${queue.length} queued Streamer.bot commands.`);
    queue.forEach(command => {
        if (command.connEpoch < this.connEpoch) {
            command.reject(new Error('Stale command from previous connection.'));
            return;
        }
        (this as any)[command.method](...command.args)
            .then(command.resolve)
            .catch(command.reject);
    });
  }

  private async queueOrExecute<T>(method: string, ...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const requestId = `${method}-${Date.now()}`;
        if (this.state !== 'connected') {
            logger.warn(`Streamer.bot not connected. Queuing command: ${method}`);
            this.commandQueue.push({ id: requestId, method, args, resolve, reject, connEpoch: this.connEpoch });
            return;
        }

        const currentEpoch = this.connEpoch;
        const underlyingMethod = (this.client as any)[method];
        if (typeof underlyingMethod !== 'function') {
            // For methods not on the client, we call our own implementation.
            // This is a bit of a hack, but it works for the existing structure.
            const selfMethod = (this as any)[`_${method}`];
            if(typeof selfMethod === 'function') {
                selfMethod.apply(this, args).then((response: T) => {
                    if (this.connEpoch !== currentEpoch) {
                        reject(new Error('Stale response from previous connection.'));
                    } else {
                        resolve(response);
                    }
                }).catch((error: any) => {
                    reject(error);
                });
            } else {
                 reject(new Error(`Streamer.bot method '${method}' not found.`));
            }
            return;
        }

        underlyingMethod.apply(this.client, args)
            .then((response: T) => {
                if (this.connEpoch !== currentEpoch) {
                    reject(new Error('Stale response from previous connection.'));
                } else {
                    resolve(response);
                }
            })
            .catch((error: any) => {
                logger.error(`Streamer.bot call failed for method ${method}:`, error);
                if (this.state !== 'connected') {
                    logger.warn(`Re-queuing command ${method} due to connection issue.`);
                    this.commandQueue.push({ id: requestId, method, args, resolve, reject, connEpoch: this.connEpoch });
                } else {
                    reject(error);
                }
            });
    });
  }


  isConnected(): boolean {
    return this.state === 'connected';
  }

  isConnectingToStreamerBot(): boolean {
    return this.state === 'connecting' || this.state === 'reconnecting';
  }

  setLifecycleCallbacks(callbacks: ConnectionLifecycleCallbacks): void {
    this.lifecycleCallbacks = callbacks;
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.client) return;
    this.client.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.client) return;
    if (typeof (this.client as any).off === 'function') {
      (this.client as any).off(event, callback);
    } else if (typeof (this.client as any).removeListener === 'function') {
      (this.client as any).removeListener(event, callback);
    }
  }

  onEvent(callback: (event: string, payload: unknown) => void): void {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    this.client.on('*', (message: any) => {
      try {
        const evName = message?.event || message?.data?.event || 'unknown';
        let payload = message?.data || message?.payload || message;

        if (evName === 'ChatMessage' && payload?.platform === 'Kick' && payload?.replyTo) {
          payload = {
            ...payload,
            replyTo: {
              messageId: payload.replyTo.messageId,
              userId: payload.replyTo.userId,
              username: payload.replyTo.username,
              displayName: payload.replyTo.displayName,
              message: payload.replyTo.message,
            },
          };
        }
        callback(evName, payload);
      } catch (e) {
        logger.warn('StreamerBotService: error processing incoming event', e);
      }
    });

    logger.info('StreamerBotService: subscribed to all Streamer.bot events.');
  }

  // ==================== STREAMER.BOT WEBSOCKET API METHODS ====================

  subscribe(events: EventSubscription): Promise<void> {
    return this.queueOrExecute('subscribe', events);
  }

  unsubscribe(events: EventSubscription): Promise<void> {
    return this.queueOrExecute('unsubscribe', events);
  }

  getEvents(): Promise<GetEventsResponse> {
    return this.queueOrExecute('getEvents');
  }

  async getActions(): Promise<StreamerBotActionDescriptor[]> {
      const response: ActionListResponse | any = await this.queueOrExecute('getActions');
      if (response && Array.isArray(response.actions)) {
        return response.actions as StreamerBotActionDescriptor[];
      }
      return [];
  }

  doAction(
    action: { id?: string; name?: string },
    args: Record<string, unknown> = {}
  ): Promise<RunActionResponse | void> {
    return this.queueOrExecute('doAction', action, args);
  }

  getBroadcaster(): Promise<GetBroadcasterResponse> {
    return this.queueOrExecute('getBroadcaster');
  }

  _sendRequest(request: Record<string, unknown>): Promise<unknown> {
      if (!this.client) {
        throw new Error('Streamer.bot client is not initialized.');
      }

      const requestId = `sb:req:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Streamer.bot request timeout'));
        }, 10000);

        const responseHandler = (data: any) => {
          if (data?.id === requestId) {
            clearTimeout(timeout);
            this.off('message', responseHandler);

            if (data.status === 'ok' || !data.error) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Streamer.bot request failed'));
            }
          }
        };

        this.on('message', responseHandler);

        const requestWithId = { ...request, id: requestId };

        if (typeof (this.client as any).send === 'function') {
          (this.client as any).send(JSON.stringify(requestWithId));
        } else {
          (this.client as any).emit('message', JSON.stringify(requestWithId));
        }

        logger.debug('StreamerBotService: sent request', requestWithId);
      });
  }

  getCredits(): Promise<GetCreditsResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'GetCredits' });
  }

  testCredits(): Promise<void> {
      return this.queueOrExecute('_sendRequest', { request: 'TestCredits' });
  }

  clearCredits(): Promise<void> {
      return this.queueOrExecute('_sendRequest', { request: 'ClearCredits' });
  }

  getInfo(): Promise<GetInfoResponse> {
    return this.queueOrExecute('getInfo');
  }

  getActiveViewers(): Promise<GetActiveViewersResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'GetActiveViewers' });
  }

  getCodeTriggers(): Promise<GetCodeTriggersResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'GetCodeTriggers' });
  }

  executeCodeTrigger(triggerName: string, args: Record<string, unknown> = {}): Promise<void> {
      return this.queueOrExecute('_sendRequest', { request: 'ExecuteCodeTrigger', triggerName, args });
  }

  getCommands(): Promise<GetCommandsResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'GetCommands' });
  }

  twitchGetEmotes(): Promise<TwitchGetEmotesResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'TwitchGetEmotes' });
  }

  youtubeGetEmotes(): Promise<YouTubeGetEmotesResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'YouTubeGetEmotes' });
  }

  getGlobals(persisted: boolean = false): Promise<GetGlobalsResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'GetGlobals', persisted });
  }

  getGlobal(variable: string, persisted: boolean = false): Promise<GetGlobalResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'GetGlobal', variable, persisted });
  }

  twitchGetUserGlobals(variable: string, persisted: boolean = false): Promise<TwitchGetUserGlobalsResponse> {
      return this.queueOrExecute('_sendRequest', { request: 'TwitchGetUserGlobals', variable, persisted });
  }

  twitchGetUserGlobal(userId: string, variable?: string, persisted: boolean = false): Promise<TwitchGetUserGlobalResponse> {
      const request: any = { request: 'TwitchGetUserGlobal', userId, persisted };
      if (variable) {
        request.variable = variable;
      }
      return this.queueOrExecute('_sendRequest', request);
  }

  sendMessage(
    message: string,
    platform: 'twitch' | 'kick' | 'trovo' | 'youtube' = 'twitch',
    bot: boolean = false,
    internal: boolean = false,
    replyTo?: {
      messageId: string;
      userId: string;
      username: string;
      displayName: string;
      message: string;
    }
  ): Promise<void> {
      const requestPayload: Record<string, unknown> = {
        request: 'SendMessage',
        platform,
        bot,
        internal,
        message
      };
      if (replyTo) {
        requestPayload.replyTo = replyTo;
      }
      return this.queueOrExecute('_sendRequest', requestPayload);
  }

  getUserPronouns(platform: 'twitch', userLogin: string): Promise<unknown> {
      return this.queueOrExecute('_sendRequest', {
        request: 'GetUserPronouns',
        platform,
        userLogin
      });
  }

  async executeBotAction(action: { type: string; args?: Record<string, unknown> }): Promise<unknown> {
    // This method is complex and calls other methods on the class.
    // The queueOrExecute logic is better handled inside each of those methods.
    // So, we just call them directly.
    switch (action.type) {
      case 'GetActions': {
        return this.getActions();
      }
      // ... other cases
      default:
        throw new Error(`Unsupported Streamer.bot action type: ${action.type}`);
    }
  }

  fileExists(path: string, variableName?: string): Promise<FileExistsResponse> {
      const request: any = { request: 'FileExists', path };
      if (variableName) {
        request.variableName = variableName;
      }
      return this.queueOrExecute('_sendRequest', request);
  }

  folderExists(path: string, variableName?: string): Promise<FolderExistsResponse> {
      const request: any = { request: 'FolderExists', path };
      if (variableName) {
        request.variableName = variableName;
      }
      return this.queueOrExecute('_sendRequest', request);
  }

  // ==================== ENHANCED API METHODS ====================

  /**
   * Executes a Streamer.bot action by its name with optional arguments.
   * A simplified wrapper around doAction.
   */
  async executeCommand(commandName: string, args?: Record<string, any>): Promise<RunActionResponse | void> {
    if (!commandName) {
      throw new Error('Command name must be provided.');
    }
    // Re-use the existing doAction method which correctly handles queuing
    return this.doAction({ name: commandName }, args);
  }

  /**
   * Creates a new custom action in Streamer.bot.
   */
  async createCustomAction(actionConfig: StreamerBotActionConfig): Promise<unknown> {
    // Use _sendRequest for custom raw requests as 'CreateAction' is not a standard client method
    return this._sendRequest({
      request: 'CreateAction',
      action: actionConfig,
    });
  }

  /**
   * Sets up advanced event handlers for common Twitch events.
   */
  setupAdvancedEventHandlers(): void {
    logger.info('Setting up advanced event handlers for Twitch...');
    this.on('Twitch.Follow', this.handleTwitchFollow);
    this.on('Twitch.Sub', this.handleTwitchSubscription);
    this.on('Twitch.Raid', this.handleTwitchRaid);
  }

  private handleTwitchFollow = (data: any): void => {
    logger.info(`New follower detected: ${data?.user_name}`, data);
    // Example of how to use executeCommand:
    // this.executeCommand('NewFollowerAlert', { user: data.user_name });
  };

  private handleTwitchSubscription = (data: any): void => {
    logger.info(`New subscription detected: ${data?.user_name}`, data);
  };

  private handleTwitchRaid = (data: any): void => {
    logger.info(`Raid detected from ${data?.from_broadcaster_user_name}`, data);
  };

  // ... (rest of the methods)

  private _bindClientListeners(): void {
    if (!this.client) return;

    this._removeClientListeners();

    this.boundOnConnect = (info?: unknown) => {
      // This is handled in _internalConnect now
    };

    this.boundOnDisconnect = (code?: number, reason?: string) => {
      logger.info('StreamerBotService: client reported disconnect', { code, reason });
      this.state = 'reconnecting';
      this.handleReconnect();
      if (this.lifecycleCallbacks?.onDisconnect) {
        this.lifecycleCallbacks.onDisconnect(code, reason);
      }
    };

    this.boundOnError = (err?: unknown) => {
      logger.error('StreamerBotService: client error', err);
      const sbErr = this._normalizeError(err);
      this.state = 'reconnecting';
      this.handleReconnect();
      if (this.lifecycleCallbacks?.onError) {
        this.lifecycleCallbacks.onError(sbErr);
      }
    };

    this.boundOnAnyEvent = (message?: any) => {
      try {
        const evName = message?.event || message?.type || message?.data?.event || 'unknown';
        const payload = message?.data || message?.payload || message;
        if (this.lifecycleCallbacks?.onEvent) {
          (this.lifecycleCallbacks.onEvent as any)(evName, payload);
        }
      } catch (e) {
        logger.warn('StreamerBotService: error while processing any-event', e);
      }
    };

    if (typeof (this.client as any).on === 'function') {
        (this.client as any).on('open', this.boundOnConnect);
        (this.client as any).on('connect', this.boundOnConnect);
        (this.client as any).on('close', this.boundOnDisconnect);
        (this.client as any).on('disconnect', this.boundOnDisconnect);
        (this.client as any).on('error', this.boundOnError);
        (this.client as any).on('*', this.boundOnAnyEvent);
        (this.client as any).on('message', this.boundOnAnyEvent);
      }
  }

  private _removeClientListeners(): void {
    if (!this.client) return;

    try {
      if (typeof (this.client as any).off === 'function') {
        if (this.boundOnConnect) {
          (this.client as any).off('open', this.boundOnConnect);
          (this.client as any).off('connect', this.boundOnConnect);
        }
        if (this.boundOnDisconnect) {
          (this.client as any).off('close', this.boundOnDisconnect);
          (this.client as any).off('disconnect', this.boundOnDisconnect);
        }
        if (this.boundOnError) {
          (this.client as any).off('error', this.boundOnError);
        }
        if (this.boundOnAnyEvent) {
          (this.client as any).off('*', this.boundOnAnyEvent);
          (this.client as any).off('message', this.boundOnAnyEvent);
        }
      }
    } catch (e) {
      logger.warn('StreamerBotService: error removing client listeners', e);
    } finally {
      this.boundOnConnect = undefined;
      this.boundOnDisconnect = undefined;
      this.boundOnError = undefined;
      this.boundOnAnyEvent = undefined;
    }
  }

  private _normalizeError(err: unknown): StreamerBotError {
    if (!err) {
      return { code: 'UNKNOWN', message: 'Unknown error' };
    }
    if (typeof err === 'object' && (err as any).message) {
      const maybe = err as any;
      let code: string = 'UNKNOWN';
      const msg = String(maybe.message || maybe);
      if (/timeout/i.test(msg)) code = 'CONNECTION_TIMEOUT';
      else if (/auth|password|unauthorized/i.test(msg)) code = 'AUTH_FAILED';
      else if (/not connected|closed|ECONNREFUSED/i.test(msg)) code = 'NOT_CONNECTED';
      return {
        code,
        message: msg,
        details: maybe,
        timestamp: new Date().toISOString(),
      };
    }
    return { code: 'UNKNOWN', message: String(err), timestamp: new Date().toISOString() };
  }
}

export const streamerBotService = StreamerBotService.getInstance();
