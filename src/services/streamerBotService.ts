// src/services/streamerBotService.ts

import { StreamerbotClient } from '@streamerbot/client';
import { logger } from '../utils/logger';
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
} from '../types/streamerbot';

/**
 * StreamerBotService
 *
 * Singleton wrapper around @streamerbot/client that:
 * - Uses the client's built-in autoReconnect support
 * - Exposes lifecycle callbacks (onConnect, onDisconnect, onError, onEvent)
 * - Tracks connection state using the typed ConnectionState
 * - Preserves existing public method signatures for compatibility
 * - Implements all Streamer.bot WebSocket API endpoints
 *
 * Notes:
 * - The connect() method accepts either (host, port, maxRetries?) for backward
 *   compatibility or a single StreamerBotClientOptions object.
 * - This service intentionally avoids implementing manual retry/backoff logic and
 *   instead relies on the client's autoReconnect behavior.
 */
export class StreamerBotService {
  private static instance: StreamerBotService;
  public client: StreamerbotClient | null = null;
  private state: ConnectionState = 'disconnected';
  private lifecycleCallbacks: ConnectionLifecycleCallbacks | null = null;

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

  /**
   * Connect to Streamer.bot.
   *
   * Backwards-compatible signatures:
   * - connect(host: string, port: number, maxRetries?: number)
   * - connect(options: StreamerBotClientOptions)
   *
   * When passed host/port the call is converted into a StreamerBotClientOptions
   * object. Use options.autoReconnect, reconnectIntervalMs, timeoutMs, password, secure, etc.
   */
  async connect(
    a: string | StreamerBotClientOptions,
    b?: number,
    // note: maxRetries is accepted for compatibility but is ignored in favor of client's autoReconnect
    _maxRetries?: number,
  ): Promise<void> {
    const options: StreamerBotClientOptions =
      typeof a === 'string'
        ? {
            host: a,
            port: typeof b === 'number' ? b : undefined,
          }
        : a;

    // Sanity checks
    if (!options.host || !options.port) {
      throw new Error('Streamer.bot host and port are required to connect.');
    }

    // Prevent duplicate connect attempts
    if (this.state === 'connecting' || this.state === 'connected' || this.state === 'reconnecting') {
      logger.info('StreamerBotService: connect() called while already connecting/connected; ignoring.');
      return;
    }

    try {
      this.state = 'connecting';
      logger.info(`StreamerBotService: attempting to connect to ${options.host}:${options.port}`);

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

      // Construct client options with sensible defaults and enable autoReconnect
      const clientOpts: any = {
        host: options.host,
        port: options.port,
        password: options.password,
        secure: options.secure,
        autoReconnect: options.autoReconnect ?? true,
        // The underlying client may accept these exact option names; pass them through.
        reconnectIntervalMs: options.reconnectIntervalMs ?? 2000,
        timeoutMs: options.timeoutMs ?? 10000,
        metadata: options.metadata,
      };

      // Initialize client
      this.client = new StreamerbotClient(clientOpts);

      // Bind lifecycle handlers that forward to our typed callbacks
      this._bindClientListeners();

      // Attempt initial connection - the client's connect() resolves when connected
      await this.client.connect();

      // If client resolves, update state and notify
      this.state = 'connected';

      // Retrieve basic info from server if available and notify via callback
      let info: StreamerBotInfo | undefined;
      try {
        const serverInfo = (this.client.getInfo && (await this.client.getInfo())) || undefined;
        info = serverInfo as StreamerBotInfo;
      } catch (err) {
        // Non-fatal: just log it
        logger.debug('StreamerBotService: getInfo failed', err);
      }

      if (this.lifecycleCallbacks?.onConnect) {
        try {
          this.lifecycleCallbacks.onConnect(info || {});
        } catch (e) {
          logger.warn('StreamerBotService: lifecycle onConnect handler threw', e);
        }
      }

      logger.info('StreamerBotService: connected to Streamer.bot');
    } catch (rawErr) {
      // Convert to structured StreamerBotError where possible
      const sbErr = this._normalizeError(rawErr);
      this.state = 'failed';
      logger.error('StreamerBotService: connection failed', sbErr);
      // Invoke lifecycle error callback
      if (this.lifecycleCallbacks?.onError) {
        try {
          this.lifecycleCallbacks.onError(sbErr);
        } catch (e) {
          logger.warn('StreamerBotService: lifecycle onError handler threw', e);
        }
      }
      // Re-throw for callers to surface to UI
      throw new Error(sbErr.message);
    }
  }

  /**
   * Disconnect gracefully from Streamer.bot and clear listeners.
   */
  disconnect(): void {
    if (this.client) {
      try {
        this._removeClientListeners();
        // The client's disconnect may be synchronous
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
      try {
        this.lifecycleCallbacks.onDisconnect();
      } catch (e) {
        logger.warn('StreamerBotService: lifecycle onDisconnect handler threw', e);
      }
    }
  }

  /**
   * Returns true if currently connected.
   */
  isConnected(): boolean {
    return this.state === 'connected';
  }

  /**
   * Returns true if currently attempting to connect or reconnect.
   */
  isConnectingToStreamerBot(): boolean {
    return this.state === 'connecting' || this.state === 'reconnecting';
  }

  /**
   * Register lifecycle callbacks to receive connection and event updates.
   */
  setLifecycleCallbacks(callbacks: ConnectionLifecycleCallbacks): void {
    this.lifecycleCallbacks = callbacks;
  }

  /**
   * Proxy to client's event API. Keeps compatibility with existing usage.
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.client) {
      // store callbacks through lifecycle if it's a lifecycle event
      if (event === 'connect' && this.lifecycleCallbacks) {
        // no-op: lifecycle callbacks are preferred
      }
      return;
    }
    // @ts-ignore - the client's types may be looser; preserve runtime behavior
    this.client.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.client) return;
    // @ts-ignore
    if (typeof (this.client as any).off === 'function') {
      // @ts-ignore
      (this.client as any).off(event, callback);
    } else if (typeof (this.client as any).removeListener === 'function') {
      // fallback
      // @ts-ignore
      (this.client as any).removeListener(event, callback);
    }
  }

  /**
   * Subscribe to all events sent from Streamer.bot. The provided callback
   * will be invoked with (eventName, payload) matching our typed event map.
   */
  onEvent(callback: (event: string, payload: unknown) => void): void {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    // Many Streamer.bot clients emit '*' with a message that contains 'event' and 'data'
    this.client.on('*', (message: any) => {
      try {
        const evName = message?.event || message?.data?.event || 'unknown';
        let payload = message?.data || message?.payload || message;

        // Check for Kick message reply-to data
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

  /**
   * Subscribe to a set of events from the connected Streamer.bot instance.
   */
  async subscribe(events: EventSubscription): Promise<void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // @ts-ignore - client may have subscribe method
      if (typeof this.client.subscribe === 'function') {
        // @ts-ignore
        await this.client.subscribe(events);
      } else {
        // Fallback: send raw request
        await this._sendRequest({ request: 'Subscribe', events });
      }
      logger.info('StreamerBotService: subscribed to events', events);
    } catch (error) {
      logger.error('StreamerBotService: subscribe failed', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from events you are currently subscribed to.
   */
  async unsubscribe(events: EventSubscription): Promise<void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // @ts-ignore - client may have unsubscribe method
      if (typeof this.client.unsubscribe === 'function') {
        // @ts-ignore
        await this.client.unsubscribe(events);
      } else {
        // Fallback: send raw request
        await this._sendRequest({ request: 'UnSubscribe', events });
      }
      logger.info('StreamerBotService: unsubscribed from events', events);
    } catch (error) {
      logger.error('StreamerBotService: unsubscribe failed', error);
      throw error;
    }
  }

  /**
   * Fetch a list of all events that can be subscribed to.
   */
  async getEvents(): Promise<GetEventsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // @ts-ignore - client may have getEvents method
      if (typeof this.client.getEvents === 'function') {
        // @ts-ignore
        return await this.client.getEvents();
      } else {
        // Fallback: send raw request
        const response = await this._sendRequest({ request: 'GetEvents' });
        return response as GetEventsResponse;
      }
    } catch (error) {
      logger.error('StreamerBotService: getEvents failed', error);
      throw error;
    }
  }

  /**
   * Fetch a list of all actions in the connected Streamer.bot instance.
   */
  async getActions(): Promise<StreamerBotActionDescriptor[]> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      const response: ActionListResponse | any = await this.client.getActions();
      if (response && Array.isArray(response.actions)) {
        return response.actions as StreamerBotActionDescriptor[];
      }
      return [];
    } catch (error) {
      logger.error('StreamerBotService: getActions failed', error);
      throw error;
    }
  }

  /**
   * Execute an action on the connected Streamer.bot instance.
   */
  async doAction(
    action: { id?: string; name?: string }, 
    args: Record<string, unknown> = {}
  ): Promise<RunActionResponse | void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      const response = await this.client.doAction(action as any, args as any);
      return response as RunActionResponse;
    } catch (error) {
      logger.error('StreamerBotService: doAction failed', error);
      throw error;
    }
  }

  /**
   * Fetch information about the connected broadcaster account(s).
   */
  async getBroadcaster(): Promise<GetBroadcasterResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // @ts-ignore - client may have getBroadcaster method
      if (typeof this.client.getBroadcaster === 'function') {
        // @ts-ignore
        return await this.client.getBroadcaster();
      } else {
        // Fallback: send raw request
        const response = await this._sendRequest({ request: 'GetBroadcaster' });
        return response as GetBroadcasterResponse;
      }
    } catch (error) {
      logger.error('StreamerBotService: getBroadcaster failed', error);
      throw error;
    }
  }

  /**
   * Fetch the current credits system data.
   */
  async getCredits(): Promise<GetCreditsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'GetCredits' });
      return response as GetCreditsResponse;
    } catch (error) {
      logger.error('StreamerBotService: getCredits failed', error);
      throw error;
    }
  }

  /**
   * Fill credits system with test data for testing.
   */
  async testCredits(): Promise<void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      await this._sendRequest({ request: 'TestCredits' });
      logger.info('StreamerBotService: testCredits executed');
    } catch (error) {
      logger.error('StreamerBotService: testCredits failed', error);
      throw error;
    }
  }

  /**
   * Reset the current credits system data.
   */
  async clearCredits(): Promise<void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      await this._sendRequest({ request: 'ClearCredits' });
      logger.info('StreamerBotService: clearCredits executed');
    } catch (error) {
      logger.error('StreamerBotService: clearCredits failed', error);
      throw error;
    }
  }

  /**
   * Fetch information about the connected Streamer.bot instance.
   */
  async getInfo(): Promise<GetInfoResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // @ts-ignore - client may have getInfo method
      if (typeof this.client.getInfo === 'function') {
        // @ts-ignore
        return await this.client.getInfo();
      } else {
        // Fallback: send raw request
        const response = await this._sendRequest({ request: 'GetInfo' });
        return response as GetInfoResponse;
      }
    } catch (error) {
      logger.error('StreamerBotService: getInfo failed', error);
      throw error;
    }
  }

  /**
   * Fetch a list of all active viewers for connected broadcaster accounts.
   */
  async getActiveViewers(): Promise<GetActiveViewersResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'GetActiveViewers' });
      return response as GetActiveViewersResponse;
    } catch (error) {
      logger.error('StreamerBotService: getActiveViewers failed', error);
      throw error;
    }
  }

  /**
   * Returns the list of code triggers available to be invoked.
   */
  async getCodeTriggers(): Promise<GetCodeTriggersResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'GetCodeTriggers' });
      return response as GetCodeTriggersResponse;
    } catch (error) {
      logger.error('StreamerBotService: getCodeTriggers failed', error);
      throw error;
    }
  }

  /**
   * Triggers a code trigger, causing any associated actions to be executed.
   */
  async executeCodeTrigger(triggerName: string, args: Record<string, unknown> = {}): Promise<void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      await this._sendRequest({ request: 'ExecuteCodeTrigger', triggerName, args });
      logger.info('StreamerBotService: executeCodeTrigger executed', { triggerName, args });
    } catch (error) {
      logger.error('StreamerBotService: executeCodeTrigger failed', error);
      throw error;
    }
  }

  /**
   * Returns the list of defined commands.
   */
  async getCommands(): Promise<GetCommandsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'GetCommands' });
      return response as GetCommandsResponse;
    } catch (error) {
      logger.error('StreamerBotService: getCommands failed', error);
      throw error;
    }
  }

  /**
   * Fetches a list of emotes for Twitch.
   */
  async twitchGetEmotes(): Promise<TwitchGetEmotesResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'TwitchGetEmotes' });
      return response as TwitchGetEmotesResponse;
    } catch (error) {
      logger.error('StreamerBotService: twitchGetEmotes failed', error);
      throw error;
    }
  }

  /**
   * Fetches a list of emotes for YouTube.
   */
  async youtubeGetEmotes(): Promise<YouTubeGetEmotesResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'YouTubeGetEmotes' });
      return response as YouTubeGetEmotesResponse;
    } catch (error) {
      logger.error('StreamerBotService: youtubeGetEmotes failed', error);
      throw error;
    }
  }

  /**
   * Returns all the global variables, either persisted or temporary.
   */
  async getGlobals(persisted: boolean = false): Promise<GetGlobalsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'GetGlobals', persisted });
      return response as GetGlobalsResponse;
    } catch (error) {
      logger.error('StreamerBotService: getGlobals failed', error);
      throw error;
    }
  }

  /**
   * Gets a single persisted or temporary global variable.
   */
  async getGlobal(variable: string, persisted: boolean = false): Promise<GetGlobalResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'GetGlobal', variable, persisted });
      return response as GetGlobalResponse;
    } catch (error) {
      logger.error('StreamerBotService: getGlobal failed', error);
      throw error;
    }
  }

  /**
   * Fetches the values of a given user variable across all Twitch users.
   */
  async twitchGetUserGlobals(variable: string, persisted: boolean = false): Promise<TwitchGetUserGlobalsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ request: 'TwitchGetUserGlobals', variable, persisted });
      return response as TwitchGetUserGlobalsResponse;
    } catch (error) {
      logger.error('StreamerBotService: twitchGetUserGlobals failed', error);
      throw error;
    }
  }

  /**
   * Gets either a single user variable for a given user, or all variables for that user.
   */
  async twitchGetUserGlobal(userId: string, variable?: string, persisted: boolean = false): Promise<TwitchGetUserGlobalResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const request: any = { request: 'TwitchGetUserGlobal', userId, persisted };
      if (variable) {
        request.variable = variable;
      }
      const response = await this._sendRequest(request);
      return response as TwitchGetUserGlobalResponse;
    } catch (error) {
      logger.error('StreamerBotService: twitchGetUserGlobal failed', error);
      throw error;
    }
  }

  /**
   * Sends a message to the broadcaster's chat.
   */
  async sendMessage(
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
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
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
      await this._sendRequest(requestPayload);
      logger.info('StreamerBotService: sendMessage executed', { platform, message, replyTo });
    } catch (error) {
      logger.error('StreamerBotService: sendMessage failed', error);
      throw error;
    }
  }

  /**
   * Fetches the pronouns for a given user.
   */
  async getUserPronouns(platform: 'twitch', userLogin: string): Promise<unknown> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      // Fallback: send raw request
      const response = await this._sendRequest({ 
        request: 'GetUserPronouns', 
        platform, 
        userLogin 
      });
      return response;
    } catch (error) {
      logger.error('StreamerBotService: getUserPronouns failed', error);
      throw error;
    }
  }

  /**
   * Executes a structured action object (used by Gemini wrapper)
   */
  async executeBotAction(action: { type: string; args?: Record<string, unknown> }): Promise<unknown> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    switch (action.type) {
      case 'GetActions': {
        return await this.getActions();
      }
      case 'DoAction': {
        if (!action.args?.action) throw new Error('DoAction requires an action identifier.');
        return await this.doAction(action.args.action as any, (action.args.args || {}) as any);
      }
      case 'TwitchSendMessage': {
        if (!action.args?.message) throw new Error('TwitchSendMessage requires a message.');
        return await this.sendMessage(action.args.message as string);
      }
      case 'TwitchCreatePoll': {
        if (!action.args?.title || !action.args?.choices) {
          throw new Error('TwitchCreatePoll requires title and choices.');
        }
        return await this.doAction(
          { name: 'Create Twitch Poll' },
          {
            title: action.args.title,
            choices: action.args.choices,
            duration: action.args.duration || 60,
          },
        );
      }
      // Add new action types
      case 'Subscribe': {
        if (!action.args?.events) throw new Error('Subscribe requires events.');
        return await this.subscribe(action.args.events as EventSubscription);
      }
      case 'UnSubscribe': {
        if (!action.args?.events) throw new Error('UnSubscribe requires events.');
        return await this.unsubscribe(action.args.events as EventSubscription);
      }
      case 'GetEvents': {
        return await this.getEvents();
      }
      case 'GetBroadcaster': {
        return await this.getBroadcaster();
      }
      case 'GetInfo': {
        return await this.getInfo();
      }
      case 'GetActiveViewers': {
        return await this.getActiveViewers();
      }
      case 'GetCommands': {
        return await this.getCommands();
      }
      case 'GetGlobals': {
        const persisted = action.args?.persisted as boolean || false;
        return await this.getGlobals(persisted);
      }
      case 'GetGlobal': {
        if (!action.args?.variable) throw new Error('GetGlobal requires a variable name.');
        const persisted = action.args?.persisted as boolean || false;
        return await this.getGlobal(action.args.variable as string, persisted);
      }
      case 'TwitchGetEmotes': {
        return await this.twitchGetEmotes();
      }
      case 'YouTubeGetEmotes': {
        return await this.youtubeGetEmotes();
      }
      case 'GetCodeTriggers': {
        return await this.getCodeTriggers();
      }
      case 'ExecuteCodeTrigger': {
        if (!action.args?.triggerName) throw new Error('ExecuteCodeTrigger requires a trigger name.');
        return await this.executeCodeTrigger(
          action.args.triggerName as string, 
          (action.args.args || {}) as Record<string, unknown>
        );
      }
      case 'GetCredits': {
        return await this.getCredits();
      }
      case 'TestCredits': {
        return await this.testCredits();
      }
      case 'ClearCredits': {
        return await this.clearCredits();
      }
      case 'TwitchGetUserGlobals': {
        if (!action.args?.variable) throw new Error('TwitchGetUserGlobals requires a variable name.');
        const persisted = action.args?.persisted as boolean || false;
        return await this.twitchGetUserGlobals(action.args.variable as string, persisted);
      }
      case 'TwitchGetUserGlobal': {
        if (!action.args?.userId) throw new Error('TwitchGetUserGlobal requires a user ID.');
        const persisted = action.args?.persisted as boolean || false;
        return await this.twitchGetUserGlobal(
          action.args.userId as string, 
          action.args.variable as string | undefined, 
          persisted
        );
      }
      case 'SendMessage': {
        if (!action.args?.message) throw new Error('SendMessage requires a message.');
        const platform = (action.args.platform as 'twitch' | 'kick' | 'trovo' | 'youtube') || 'twitch';
        const bot = action.args.bot as boolean || false;
        const internal = action.args.internal as boolean || false;
        return await this.sendMessage(
          action.args.message as string, 
          platform, 
          bot, 
          internal
        );
      }
      case 'GetUserPronouns': {
        if (!action.args?.platform || !action.args?.userLogin) {
          throw new Error('GetUserPronouns requires platform and userLogin.');
        }
        return await this.getUserPronouns(
          action.args.platform as 'twitch', 
          action.args.userLogin as string
        );
      }
      case 'CreateAction':
      case 'UpdateAction':
      case 'DeleteAction':
        throw new Error(`${action.type} is not currently supported by the Streamer.bot client library.`);
      case 'FileExists': {
        if (!action.args?.path) throw new Error('FileExists requires a path.');
        const variableName = action.args.variableName as string | undefined;
        return await this.fileExists(action.args.path as string, variableName);
      }
      case 'FolderExists': {
        if (!action.args?.path) throw new Error('FolderExists requires a path.');
        const variableName = action.args.variableName as string | undefined;
        return await this.folderExists(action.args.path as string, variableName);
      }
      default:
        throw new Error(`Unsupported Streamer.bot action type: ${action.type}`);
    }
  }

  /**
   * Checks if a file exists at the specified path.
   */
  async fileExists(path: string, variableName?: string): Promise<FileExistsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      const request: any = { request: 'FileExists', path };
      if (variableName) {
        request.variableName = variableName;
      }
      const response = await this._sendRequest(request);
      return response as FileExistsResponse;
    } catch (error) {
      logger.error('StreamerBotService: fileExists failed', error);
      throw error;
    }
  }

  /**
   * Checks if a folder exists at the specified path.
   */
  async folderExists(path: string, variableName?: string): Promise<FolderExistsResponse> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    
    try {
      const request: any = { request: 'FolderExists', path };
      if (variableName) {
        request.variableName = variableName;
      }
      const response = await this._sendRequest(request);
      return response as FolderExistsResponse;
    } catch (error) {
      logger.error('StreamerBotService: folderExists failed', error);
      throw error;
    }
  }

  // -------------------------
  // Internal helpers
  // -------------------------

  /**
   * Send a raw request to the Streamer.bot WebSocket server
   */
  private async _sendRequest(request: Record<string, unknown>): Promise<unknown> {
    if (!this.client) {
      throw new Error('Streamer.bot client is not initialized.');
    }

    // Generate a unique ID for the request
    const requestId = `sb:req:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        reject(new Error('Streamer.bot request timeout'));
      }, 10000);

      // Listen for response
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

      // Subscribe to responses
      this.on('message', responseHandler);

      // Send the request
      const requestWithId = { ...request, id: requestId };
      
      // @ts-ignore - send raw message
      if (typeof this.client.send === 'function') {
        // @ts-ignore
        this.client.send(JSON.stringify(requestWithId));
      } else {
        // Fallback: try to emit
        // @ts-ignore
        this.client.emit('message', JSON.stringify(requestWithId));
      }

      logger.debug('StreamerBotService: sent request', requestWithId);
    });
  }

  /**
   * Bind client-level event listeners and forward to lifecycle callbacks.
   */
  private _bindClientListeners(): void {
    if (!this.client) return;

    // Remove any previous handlers first
    this._removeClientListeners();

    // on connect/open
    this.boundOnConnect = (info?: unknown) => {
      logger.info('StreamerBotService: client reported connect/open', info);
      this.state = 'connected';
      if (this.lifecycleCallbacks?.onConnect) {
        try {
          this.lifecycleCallbacks.onConnect((info as StreamerBotInfo) || {});
        } catch (e) {
          logger.warn('StreamerBotService: lifecycle onConnect handler threw', e);
        }
      }
    };

    // on disconnect/close
    this.boundOnDisconnect = (code?: number, reason?: string) => {
      logger.info('StreamerBotService: client reported disconnect', { code, reason });
      // If client is auto-reconnecting the client may emit disconnect then reconnect.
      // Set state to reconnecting if autoReconnect is expected, otherwise disconnected.
      this.state = this.client && (this.client as any).options?.autoReconnect ? 'reconnecting' : 'disconnected';
      if (this.lifecycleCallbacks?.onDisconnect) {
        try {
          this.lifecycleCallbacks.onDisconnect(code, reason);
        } catch (e) {
          logger.warn('StreamerBotService: lifecycle onDisconnect handler threw', e);
        }
      }
    };

    // on error
    this.boundOnError = (err?: unknown) => {
      logger.error('StreamerBotService: client error', err);
      const sbErr = this._normalizeError(err);
      this.state = 'failed';
      if (this.lifecycleCallbacks?.onError) {
        try {
          this.lifecycleCallbacks.onError(sbErr);
        } catch (e) {
          logger.warn('StreamerBotService: lifecycle onError handler threw', e);
        }
      }
    };

    // catch-all events
    this.boundOnAnyEvent = (message?: any) => {
      // message may contain { event, data } or similar shape
      try {
        const evName = message?.event || message?.type || message?.data?.event || 'unknown';
        const payload = message?.data || message?.payload || message;
        if (this.lifecycleCallbacks?.onEvent) {
          // forward typed event (K extends keyof E in consumer)
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.lifecycleCallbacks.onEvent as any)(evName, payload);
          } catch (e) {
            logger.warn('StreamerBotService: lifecycle onEvent handler threw', e);
          }
        }
      } catch (e) {
        logger.warn('StreamerBotService: error while processing any-event', e);
      }
    };

    // Bind into client - event names below are common; we listen to multiple to maximize compatibility
    try {
      if (typeof (this.client as any).on === 'function') {
        // Common node/ws events
        // Some clients emit 'open' / 'close' / 'error', others 'connect' / 'disconnect'
        (this.client as any).on('open', this.boundOnConnect);
        (this.client as any).on('connect', this.boundOnConnect);
        (this.client as any).on('close', this.boundOnDisconnect);
        (this.client as any).on('disconnect', this.boundOnDisconnect);
        (this.client as any).on('error', this.boundOnError);
        // Catch-all event emission (previous code used '*')
        (this.client as any).on('*', this.boundOnAnyEvent);
        (this.client as any).on('message', this.boundOnAnyEvent);
      }
    } catch (e) {
      logger.warn('StreamerBotService: failed to bind some client listeners', e);
    }
  }

  /**
   * Remove any previously bound client listeners.
   */
  private _removeClientListeners(): void {
    if (!this.client) return;

    try {
      // @ts-ignore
      if (typeof (this.client as any).off === 'function') {
        // Try to remove each bound handler if present
        if (this.boundOnConnect) {
          // @ts-ignore
          this.client.off('open', this.boundOnConnect);
          // @ts-ignore
          this.client.off('connect', this.boundOnConnect);
        }
        if (this.boundOnDisconnect) {
          // @ts-ignore
          this.client.off('close', this.boundOnDisconnect);
          // @ts-ignore
          this.client.off('disconnect', this.boundOnDisconnect);
        }
        if (this.boundOnError) {
          // @ts-ignore
          this.client.off('error', this.boundOnError);
        }
        if (this.boundOnAnyEvent) {
          // @ts-ignore
          this.client.off('*', this.boundOnAnyEvent);
          // @ts-ignore
          this.client.off('message', this.boundOnAnyEvent);
        }
      } else if (typeof (this.client as any).removeListener === 'function') {
        if (this.boundOnConnect) {
          // @ts-ignore
          this.client.removeListener('open', this.boundOnConnect);
          // @ts-ignore
          this.client.removeListener('connect', this.boundOnConnect);
        }
        if (this.boundOnDisconnect) {
          // @ts-ignore
          this.client.removeListener('close', this.boundOnDisconnect);
          // @ts-ignore
          this.client.removeListener('disconnect', this.boundOnDisconnect);
        }
        if (this.boundOnError) {
          // @ts-ignore
          this.client.removeListener('error', this.boundOnError);
        }
        if (this.boundOnAnyEvent) {
          // @ts-ignore
          this.client.removeListener('*', this.boundOnAnyEvent);
          // @ts-ignore
          this.client.removeListener('message', this.boundOnAnyEvent);
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

  /**
   * Convert raw errors into a structured StreamerBotError for callbacks and logging.
   */
  private _normalizeError(err: unknown): StreamerBotError {
    if (!err) {
      return { code: 'UNKNOWN', message: 'Unknown error' };
    }
    if (typeof err === 'object' && (err as any).message) {
      const maybe = err as any;
      // Attempt to map common substrings to error codes
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
    // Fallback: stringify
    return { code: 'UNKNOWN', message: String(err), timestamp: new Date().toISOString() };
  }
}
