import OBSWebSocket from 'obs-websocket-js';

import { logger } from '@/utils/logger';
import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';

import { useSettingsStore } from '@/store/settingsStore';

import type { UniversalWidgetConfig } from '@/types/universalWidget';

export class ObsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObsError';
  }
}

// Define an interface for the obs-websocket-js instance to ensure type safety.
interface OBSWebSocketInstance {
  connect(
    address: string,
    password?: string,
    options?: { rpcVersion: number, eventSubscriptions: number },
  ): Promise<any>;
  disconnect(): Promise<void>;
  call<T = any>(method: string, params?: Record<string, any>): Promise<T>;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  identified: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface Command<T = any> {
  id: string;
  method: string;
  params?: Record<string, any>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  timestamp: number;
}

const MAX_RETRY_ATTEMPTS = 10;
const COMMAND_TIMEOUT_MS = 30000; // 30 seconds for a command to be considered stale

// Helper to determine WebSocket URL
const getWebsocketUrl = (providedAddress?: string) => {
    // Check if the provided address effectively means "default local"
    const isDefaultLocal = !providedAddress ||
                          providedAddress === 'localhost' ||
                          providedAddress === '127.0.0.1';

    // If it's effectively local, but we're running on a different host (e.g. tablet),
    // we should prefer the dynamic hostname of the window location.
    // However, if we are actually ON localhost (dev mode), window.location.hostname will be 'localhost'.
    // So this logic is safe: if we're on a remote device, window.location.hostname will be an IP.
    if (isDefaultLocal) {
        // If we have an env var override, use it first
        if (import.meta.env.VITE_OBS_WS_URL) return import.meta.env.VITE_OBS_WS_URL;

        const hostname = window.location.hostname || 'localhost';
        return `ws://${hostname}:4455`;
    }

    // If a specific, non-local address was provided, respect it.

    // If a full address is provided (including protocol), use it.
    if (providedAddress && (providedAddress.startsWith('ws://') || providedAddress.startsWith('wss://'))) {
        return providedAddress;
    }

    // If a provided address is just host:port or host, prepend ws://
    // We assume port 4455 if no port is specified, but strict parsing is tricky.
    // Simplest approach: if it has no protocol, add one.
    // If the user provided '192.168.1.5', we want 'ws://192.168.1.5:4455' ideally,
    // but the providedAddress usually comes from settings which stores host and port separately
    // or as a full string depending on the call site.
    // Looking at the codebase, `connect` usually takes just `address`.

    // If it looks like just an IP or hostname without port (no colon), append default port
    if (providedAddress && !providedAddress.includes(':')) {
         return `ws://${providedAddress}:4455`;
    }

    return `ws://${providedAddress}`;
};

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: OBSWebSocketInstance;
  private status: ConnectionStatus = 'disconnected';
  private commandQueue: Command[] = [];
  private retryCount = 0;
  // 'password' may be present or explicitly undefined; with strict TS settings
  // (exactOptionalPropertyTypes) the property type must include `undefined`.
  private connectOptions: { address: string; password?: string | undefined } | null = null;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private connectionPromise: Promise<void> | null = null;
  private isConnecting = false;
  private stateCache: Map<string, { state: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = {
    scenes: 5000,      // Scene list changes less frequently
    sources: 2000,     // Sources change more often
    status: 1000,      // Status changes frequently
    default: 2000
  };

  // --- Event Listener Properties ---
  private onConnectionOpened: () => void;
  private onIdentified: () => void;
  private onConnectionClosed: (data: { code: number }) => void;
  private onConnectionError: (err: any) => void;
  private cacheInvalidationListeners: Map<string, () => void> = new Map();

  private constructor() {
    this.obs = new (OBSWebSocket as any)();

    // Define listeners as bound methods
    this.onConnectionOpened = this._onConnectionOpened.bind(this);
    this.onIdentified = this._onIdentified.bind(this);
    this.onConnectionClosed = this._onConnectionClosed.bind(this);
    this.onConnectionError = this._onConnectionError.bind(this);

    this.setupEventListeners();
  }

  public static getInstance(): ObsClientImpl {
    if (!ObsClientImpl.instance) {
      ObsClientImpl.instance = new ObsClientImpl();
    }
    return ObsClientImpl.instance;
  }

  private setStatus(status: ConnectionStatus, details?: string) {
    if (this.status === status) return;
    const message = `[OBS] Status changed: ${this.status} -> ${status}${details ? ` (${details})` : ''}`;
    logger.info(message);
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  public addStatusListener(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private cleanupEventListeners() {
    logger.info('[OBS] Cleaning up event listeners.');

    // Store references to bound methods for proper cleanup
    const eventsToCleanup: [string, (...args: any[]) => void][] = [
      ['ConnectionOpened', this.onConnectionOpened],
      ['Identified', this.onIdentified],
      ['ConnectionClosed', this.onConnectionClosed],
      ['ConnectionError', this.onConnectionError]
    ];

    for (const [event, listener] of eventsToCleanup) {
      try {
        this.obs.off(event, listener);
      } catch (error) {
        logger.warn(`Failed to remove listener for ${event}:`, error);
      }
    }

    // Cleanup cache invalidation listeners
    for (const [event, listener] of this.cacheInvalidationListeners.entries()) {
      try {
        this.obs.off(event, listener);
      } catch (error) {
        logger.warn(`Failed to remove cache listener for ${event}:`, error);
      }
    }
    this.cacheInvalidationListeners.clear();
  }

  private setupEventListeners() {
    // Clean up any existing listeners before setting up new ones
    this.cleanupEventListeners();

    this.obs.on('ConnectionOpened', this.onConnectionOpened);
    this.obs.on('Identified', this.onIdentified);
    this.obs.on('ConnectionClosed', this.onConnectionClosed);
    this.obs.on('ConnectionError', this.onConnectionError);

    // --- Cache Invalidation Listeners ---
    // Map events to specific cache keys that should be invalidated
    const invalidationMap: Record<string, string[]> = {
        'CurrentProgramSceneChanged': ['fullState', 'getCurrentProgramScene'],
        'SceneListChanged': ['fullState', 'getSceneList'],
        'InputCreated': ['fullState', 'getInputList'],
        'InputRemoved': ['fullState', 'getInputList'],
        'InputNameChanged': ['fullState', 'getInputList'],
        'StreamStateChanged': ['fullState', 'getStreamStatus'],
        'RecordStateChanged': ['fullState', 'getRecordStatus'],
    };

    for (const [event, cacheKeys] of Object.entries(invalidationMap)) {
      const listener = () => {
        logger.info(`[OBS Cache] Invalidating ${cacheKeys.join(', ')} due to event: ${event}`);
        for (const key of cacheKeys) {
            this.stateCache.delete(key);
        }
      };
      this.cacheInvalidationListeners.set(event, listener);
      this.obs.on(event, listener);
    }
  }

  // --- Listener Implementations ---
  private _onConnectionOpened() {
    logger.info('[OBS] Connection opened. Awaiting identification...');
  }

  private _onIdentified() {
    logger.info('[OBS] Identified: Socket is ready.');
    this.retryCount = 0;
    this.cleanupReconnectTimeout();
    this.setStatus('connected');

    this.processCommandQueue();
  }

  private _onConnectionClosed(data: { code: number }) {


    if (data.code === 4009) {
      logger.error('[OBS] Connection failed: Invalid password.');
      this.setStatus('error', 'Invalid password');

      this.connectOptions = null;
      const errorMsg = 'Invalid OBS password. Please update your connection settings.';
      this.rejectStaleCommands(errorMsg);
    } else {
      logger.warn(`[OBS] Connection closed (code: ${data.code}).`);
      if (this.status !== 'reconnecting') {
        this.setStatus('reconnecting', `Connection closed with code: ${data.code}`);

        // Only auto-reconnect if enabled in settings
        const settings = useSettingsStore.getState().settings;
        if (settings.obs.autoConnect) {
            this.handleReconnect();
        } else {
            this.setStatus('disconnected', 'Auto-reconnect disabled');
        }
      }
    }
  }

  private _onConnectionError(err: any) {
    logger.error('[OBS] Connection error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);


    if (this.status !== 'reconnecting') {
      this.setStatus('reconnecting', errorMessage);

      // Only auto-reconnect if enabled in settings
      const settings = useSettingsStore.getState().settings;
      if (settings.obs.autoConnect) {
          this.handleReconnect();
      }
    }
  }

  private invalidateCache(pattern?: string) {
    if (pattern) {
      // Selective invalidation based on event type or key pattern
      for (const [key] of this.stateCache) {
        if (key.includes(pattern) || pattern === key) {
          this.stateCache.delete(key);
        }
      }
    } else {
      this.stateCache.clear();
    }
  }

  private cleanupReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private async handleReconnect() {
    if (!this.connectOptions || this.status === 'connecting' || this.reconnectTimeout) {
      return;
    }

    if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
      logger.error(`[OBS] Max reconnection attempts (${MAX_RETRY_ATTEMPTS}) reached.`);
      this.setStatus('error');
      this.rejectStaleCommands('Failed to connect after maximum retry attempts.');
      return;
    }

    this.retryCount++;

    // Improved backoff with jitter to prevent thundering herd
    const baseDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 30000);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    const delay = baseDelay + jitter;

    logger.info(`[OBS] Reconnecting in ${delay.toFixed(0)}ms (attempt ${this.retryCount}/${MAX_RETRY_ATTEMPTS})`);


    this.cleanupReconnectTimeout();
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect(this.connectOptions!.address, this.connectOptions!.password);
      } catch (error) {
        logger.warn(`[OBS] Reconnection attempt ${this.retryCount} failed:`, error);
        // handleReconnect will be called by the error handlers
      }
    }, delay);
  }

  async connect(address: string, password?: string): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.status === 'connected') {
      logger.warn(`[OBS] Ignoring connect call, already ${this.status}.`);
      return Promise.resolve();
    }
    
    this.isConnecting = true;

    // Use dynamic helper to determine the final URL
    const wsUrl = getWebsocketUrl(address);
    // Store original address (or resolved one) in connectOptions for reconnects
    // Note: We're storing what we're *trying* to connect to.

    this.connectionPromise = (async () => {
      try {
        this.connectOptions = { address: wsUrl, password };
        this.setStatus('connecting');


        this.setupEventListeners();

        logger.info(`[OBS] Connecting to ${wsUrl}`);

        await this.obs.connect(wsUrl, password, {
          rpcVersion: 1,
          eventSubscriptions: 0xffffffff,
        });
      } catch (error: any) {
        const errorMsg = handleAppError('OBS connection', error, `Failed to connect to OBS at ${wsUrl}`);
        useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'critical' });
        this.setStatus('reconnecting');


        // Only auto-reconnect if enabled in settings
        const settings = useSettingsStore.getState().settings;
        if (settings.obs.autoConnect) {
            this.handleReconnect();
        }

        throw new ObsError(errorMsg);
      } finally {
        this.isConnecting = false;
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  async disconnect(): Promise<void> {
    this.cleanupReconnectTimeout();
    this.connectOptions = null;
    this.rejectStaleCommands('Connection manually closed.');
    
    // Important: Clean up listeners to prevent leaks
    this.cleanupEventListeners();

    if (this.status !== 'disconnected') {
      this.setStatus('disconnected');

      try {
        await this.obs.disconnect();
      } catch { /* Ignore errors on disconnect */ }
    }
  }

  private rejectStaleCommands(reason: string) {
    const now = Date.now();
    const stillValidCommands: Command[] = [];

    for (const command of this.commandQueue) {
      if ((now - command.timestamp) > COMMAND_TIMEOUT_MS) {
        command.reject(new ObsError(`Command '${command.method}' timed out. ${reason}`));
      } else {
        stillValidCommands.push(command);
      }
    }
    this.commandQueue = stillValidCommands;
  }

  private async processBatchCommands(commands: Command[]): Promise<void> {
    const batchSize = 10; // Process up to 10 commands in parallel
    for (let i = 0; i < commands.length; i += batchSize) {
      const batch = commands.slice(i, i + batchSize);
      logger.info(`[OBS] Processing command batch of size ${batch.length}`);
      await Promise.allSettled(
        batch.map(cmd =>
          this.obs.call(cmd.method, cmd.params)
            .then(cmd.resolve)
            .catch(cmd.reject)
        )
      );
    }
  }

  private processCommandQueue() {
    this.rejectStaleCommands('Reconnected.'); // First, clear out any stale commands
    const queue = [...this.commandQueue];
    this.commandQueue = [];

    if (queue.length > 0) {
      logger.info(`[OBS] Processing ${queue.length} queued commands in batches...`);
      this.processBatchCommands(queue);
    }
  }

  call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.status !== 'connected') {
        if (this.status === 'disconnected' || this.status === 'error') {
          return reject(new ObsError(`OBS not connected (status: ${this.status}). Command '${method}' rejected.`));
        }

        logger.info(`[OBS] Not connected. Queuing command: ${method}`);
        this.commandQueue.push({
          id: `${method}-${Date.now()}`,
          method,
          params: params ?? {},
          resolve,
          reject,
          timestamp: Date.now(),
        });
        return;
      }
  
      this.obs.call<T>(method, params)
        .then(resolve)
        .catch(error => {
          const errorMsg = handleAppError(`OBS call ${method}`, error, `Failed to execute OBS command: ${method}`);
          useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'error' });
          reject(new ObsError(errorMsg));
        });
    });
  }

  on(event: string, listener: (...args: any[]) => void): () => void {
    this.obs.on(event, listener);
    return () => this.obs.off(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.obs.off(event, listener);
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }
  
  getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  // --- Full State Method for AI Context ---
  async getFullState(): Promise<any> {
    const cacheKey = 'fullState';
    const ttl = this.CACHE_TTL_MS.default;
    const cached = this.stateCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < ttl)) {
      logger.info('[OBS Cache] Returning cached full state.');
      return cached.state;
    }

    if (!this.isConnected()) {
      return this.getEmptyState();
    }

    logger.info('[OBS Cache] Building fresh full state from cached components.');
    try {
      // Use cached wrapper methods to build state
      // We run them sequentially or parallel - parallel is fine as they handle their own caching
      const [programScene, sceneList, inputList, streamStatus, recordStatus] = await Promise.all([
          this.getCurrentProgramSceneCached(),
          this.getSceneListCached(),
          this.getInputListCached(),
          this.getStreamStatusCached(),
          this.getRecordStatusCached()
      ]);

      const newState = {
        current_scene: programScene.currentProgramSceneName,
        available_scenes: sceneList.scenes.map((s: any) => s.sceneName),
        active_sources: inputList.inputs.filter((i: any) => i.inputKind !== 'scene'),
        streaming_status: streamStatus.outputActive,
        recording_status: recordStatus.outputActive,
        recent_commands: [],
      };

      this.stateCache.set(cacheKey, { state: newState, timestamp: Date.now() });
      return newState;
    } catch (error) {
      handleAppError('OBS getFullState', error, 'Failed to retrieve full OBS state.');
      // Invalidate cache on error to avoid serving stale/bad data
      this.invalidateCache();
      return this.getEmptyState();
    }
  }

  private getEmptyState() {
      return {
        current_scene: '',
        available_scenes: [],
        active_sources: [],
        streaming_status: false,
        recording_status: false,
        recent_commands: [],
      };
  }

  // --- Caching Helpers ---

  private async cachedCall<T>(key: string, fn: () => Promise<T>, ttl: number): Promise<T> {
    const cached = this.stateCache.get(key);

    if (cached && (Date.now() - cached.timestamp < ttl)) {
        return cached.state as T;
    }

    const result = await fn();
    this.stateCache.set(key, { state: result, timestamp: Date.now() });
    return result;
  }

  // --- Cached Convenience Methods ---

  private async getCurrentProgramSceneCached() {
    return this.cachedCall('getCurrentProgramScene', () => this.getCurrentProgramScene(), this.CACHE_TTL_MS.scenes);
  }

  private async getSceneListCached() {
    return this.cachedCall('getSceneList', () => this.getSceneList(), this.CACHE_TTL_MS.scenes);
  }

  private async getInputListCached() {
    return this.cachedCall('getInputList', () => this.getInputList(), this.CACHE_TTL_MS.sources);
  }

  private async getStreamStatusCached() {
    return this.cachedCall('getStreamStatus', () => this.getStreamStatus(), this.CACHE_TTL_MS.status);
  }

  private async getRecordStatusCached() {
    return this.cachedCall('getRecordStatus', () => this.getRecordStatus(), this.CACHE_TTL_MS.status);
  }

  // --- Convenience Methods (Direct Calls) ---
  getSceneList() {
    return this.call<{ scenes: { sceneName: string; sceneIndex: number }[] }>('GetSceneList');
  }

  getCurrentProgramScene() {
    return this.call('GetCurrentProgramScene');
  }

  getStreamStatus() {
    return this.call('GetStreamStatus');
  }

  getRecordStatus() {
    return this.call('GetRecordStatus');
  }

  getVideoSettings() {
    return this.call('GetVideoSettings');
  }

  getInputList() {
    return this.call('GetInputList');
  }

  async executeWidgetAction(config: UniversalWidgetConfig, value: any): Promise<void> {
    try {
      const params: Record<string, any> = {};
      if (config.targetName) params.inputName = config.targetName;
      if (config.targetType === 'scene' && config.targetName) {
        params.sceneName = config.targetName;
      }
      if (value !== undefined && value !== null) {
        // This part is unclear from the original code, but we can assume
        // the value should be passed in a generic `value` parameter.
        params.value = value;
      }
      await this.call(config.actionType, params);
    } catch (error) {
      const errorMsg = handleAppError(`OBS widget action ${config.actionType}`, error, `Failed to execute OBS widget action: ${config.actionType}`);
      useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'error' });
      throw new ObsError(errorMsg);
    }
  }

  async addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    width: number = 1920,
    height: number = 1080
  ): Promise<number> {
    try {
      const { inputId } = await this.call('CreateInput', {
        sceneName,
        inputName: sourceName,
        inputKind: 'browser_source',
        inputSettings: {
          url,
          width,
          height,
        },
      });
      return inputId;
    } catch (error) {
      const errorMsg = handleAppError('OBS addBrowserSource', error, 'Failed to add browser source');
      useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'error' });
      throw new ObsError(errorMsg);
    }
  }

  async addImageSource(
    sceneName: string,
    url: string,
    sourceName: string
  ): Promise<number> {
    try {
      const { inputId } = await this.call('CreateInput', {
        sceneName,
        inputName: sourceName,
        inputKind: 'image_source',
        inputSettings: {
          file: url,
        },
      });
      return inputId;
    } catch (error) {
      const errorMsg = handleAppError('OBS addImageSource', error, 'Failed to add image source');
      useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'error' });
      throw new ObsError(errorMsg);
    }
  }
}

export const obsClient = ObsClientImpl.getInstance();
