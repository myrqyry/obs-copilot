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
} from '../types/streamerbot';

/**
 * StreamerBotService
 *
 * Singleton wrapper around @streamerbot/client that:
 * - Uses the client's built-in autoReconnect support
 * - Exposes lifecycle callbacks (onConnect, onDisconnect, onError, onEvent)
 * - Tracks connection state using the typed ConnectionState
 * - Preserves existing public method signatures for compatibility
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
        const payload = message?.data || message?.payload || message;
        callback(evName, payload);
      } catch (e) {
        logger.warn('StreamerBotService: error processing incoming event', e);
      }
    });

    logger.info('StreamerBotService: subscribed to all Streamer.bot events.');
  }

  /**
   * Fetches broadcaster information (if supported by client).
   */
  async getBroadcaster(): Promise<unknown | undefined> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    // Keep original behavior but typed as unknown
    return (this.client.getBroadcaster && (await this.client.getBroadcaster())) || undefined;
  }

  /**
   * Fetches all available actions from Streamer.bot
   */
  async getActions(): Promise<StreamerBotActionDescriptor[]> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');
    const response: ActionListResponse | any = await this.client.getActions();
    if (response && Array.isArray(response.actions)) {
      return response.actions as StreamerBotActionDescriptor[];
    }
    return [];
  }

  /**
   * Triggers an action in Streamer.bot by its ID or name
   */
  async doAction(actionIdentifier: string, args: Record<string, unknown> = {}): Promise<RunActionResponse | void> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    const identifier: { id?: string; name?: string } = {};
    if (/^[0-9a-f-]{36}$/i.test(actionIdentifier)) {
      identifier.id = actionIdentifier;
    } else {
      identifier.name = actionIdentifier;
    }

    // Forward the call and return the client's response if available
    const response = await this.client.doAction(identifier as any, args as any);
    return response as RunActionResponse;
  }

  /**
   * Executes a structured action object (used by Gemini wrapper)
   */
  async executeBotAction(action: { type: string; args?: Record<string, unknown> }): Promise<unknown> {
    if (!this.client) throw new Error('Streamer.bot client is not initialized.');

    switch (action.type) {
      case 'GetActions': {
        return await this.client.getActions();
      }
      case 'DoAction': {
        if (!action.args?.action) throw new Error('DoAction requires an action identifier.');
        return await this.client.doAction(action.args.action as any, (action.args.args || {}) as any);
      }
      case 'TwitchSendMessage': {
        if (!action.args?.message) throw new Error('TwitchSendMessage requires a message.');
        return await this.client.doAction({ name: 'Send Twitch Message' }, { message: action.args.message });
      }
      case 'TwitchCreatePoll': {
        if (!action.args?.title || !action.args?.choices) {
          throw new Error('TwitchCreatePoll requires title and choices.');
        }
        return await this.client.doAction(
          { name: 'Create Twitch Poll' },
          {
            title: action.args.title,
            choices: action.args.choices,
            duration: action.args.duration || 60,
          },
        );
      }
      case 'CreateAction':
      case 'UpdateAction':
      case 'DeleteAction':
        throw new Error(`${action.type} is not currently supported by the Streamer.bot client library.`);
      default:
        throw new Error(`Unsupported Streamer.bot action type: ${action.type}`);
    }
  }

  // -------------------------
  // Internal helpers
  // -------------------------

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
