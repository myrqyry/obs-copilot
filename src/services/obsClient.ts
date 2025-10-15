import OBSWebSocket from 'obs-websocket-js';
import { backoff } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { handleAppError } from '@/lib/errorUtils';

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

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: OBSWebSocketInstance;
  private status: ConnectionStatus = 'disconnected';
  private commandQueue: Command[] = [];
  private retryCount = 0;
  private connectOptions: { address: string; password?: string } | null = null;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionLock = false;
  private stateCache: { state: any; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 2000; // Cache state for 2 seconds

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
    this.obs.off('ConnectionOpened', this.onConnectionOpened);
    this.obs.off('Identified', this.onIdentified);
    this.obs.off('ConnectionClosed', this.onConnectionClosed);
    this.obs.off('ConnectionError', this.onConnectionError);

    for (const [event, listener] of this.cacheInvalidationListeners.entries()) {
      this.obs.off(event, listener);
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
    const eventsToInvalidateCache: string[] = [
      'CurrentProgramSceneChanged', 'SceneListChanged',
      'InputCreated', 'InputRemoved', 'InputNameChanged',
      'StreamStateChanged', 'RecordStateChanged',
    ];
    for (const event of eventsToInvalidateCache) {
      const listener = () => {
        logger.info(`[OBS Cache] Invalidating cache due to event: ${event}`);
        this.invalidateCache();
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
        this.handleReconnect();
      }
    }
  }

  private _onConnectionError(err: any) {
    logger.error('[OBS] Connection error:', err);
    if (this.status !== 'reconnecting') {
      this.setStatus('reconnecting', 'Connection error');
      this.handleReconnect();
    }
  }

  private invalidateCache() {
    this.stateCache = null;
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
      logger.error(`[OBS] Max reconnection attempts (${MAX_RETRY_ATTEMPTS}) reached. Stopping.`);
      this.setStatus('error');
      this.rejectStaleCommands('Failed to connect to OBS after multiple attempts.');
      return;
    }

    this.retryCount++;
    const delay = backoff(this.retryCount, { min: 1000, max: 30000 });
    logger.info(`[OBS] Reconnecting in ${delay.toFixed(0)}ms (attempt ${this.retryCount})...`);

    this.cleanupReconnectTimeout();
    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.connectOptions!.address, this.connectOptions!.password);
    }, delay);
  }

  async connect(address: string, password?: string): Promise<void> {
    if (this.connectionLock || this.status === 'connecting' || this.status === 'connected') {
      logger.warn(`[OBS] Ignoring connect call, already ${this.status} or connection attempt in progress.`);
      return;
    }
    
    this.connectionLock = true;
    this.connectOptions = { address, password };
    this.setStatus('connecting');

    try {
      // Ensure listeners are fresh for the new connection attempt
      this.setupEventListeners();
      await this.obs.connect(address, password, {
        rpcVersion: 1,
        eventSubscriptions: 0xffffffff,
      });
    } catch (error: any) {
      const errorMsg = handleAppError('OBS connection', error, `Failed to connect to OBS at ${address}`);
      useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'critical' });
      this.setStatus('reconnecting');
      this.handleReconnect();
      throw new ObsError(errorMsg);
    } finally {
      this.connectionLock = false;
    }
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
          params,
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
    const now = Date.now();
    if (this.stateCache && (now - this.stateCache.timestamp < this.CACHE_TTL_MS)) {
      logger.info('[OBS Cache] Returning cached state.');
      return this.stateCache.state;
    }

    if (!this.isConnected()) {
      logger.warn('[OBS] Cannot get full state, not connected.');
      return {
        current_scene: '',
        available_scenes: [],
        active_sources: [],
        streaming_status: false,
        recording_status: false,
        recent_commands: [],
      };
    }

    logger.info('[OBS Cache] Fetching fresh state.');
    try {
      const [sceneList, programScene, streamStatus, recordStatus, inputList] = await Promise.all([
        this.getSceneList(),
        this.getCurrentProgramScene(),
        this.getStreamStatus(),
        this.getRecordStatus(),
        this.getInputList(),
      ]);

      const newState = {
        current_scene: programScene.currentProgramSceneName,
        available_scenes: sceneList.scenes.map((s: any) => s.sceneName),
        active_sources: inputList.inputs.filter((i: any) => i.inputKind !== 'scene'),
        streaming_status: streamStatus.outputActive,
        recording_status: recordStatus.outputActive,
        recent_commands: [],
      };

      this.stateCache = { state: newState, timestamp: Date.now() };
      return newState;
    } catch (error) {
      handleAppError('OBS getFullState', error, 'Failed to retrieve full OBS state.');
      // Invalidate cache on error to avoid serving stale/bad data
      this.invalidateCache();
      return {
        current_scene: '',
        available_scenes: [],
        active_sources: [],
        streaming_status: false,
        recording_status: false,
        recent_commands: [],
      };
    }
  }

  // --- Convenience Methods ---
  getSceneList() {
    return this.call<{ scenes: { sceneName: string }[] }>('GetSceneList');
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
      if (config.targetType === 'scene' && config.targetName) params.sceneName = config.targetName;
      if (config.property) params.property = config.property;
      if (typeof value !== 'undefined') params.value = value;

      // Use the actionType as the OBS method if it's a string matching OBS API
      const method = config.actionType || '';

      // If OBS is connected, call immediately, otherwise queue via this.call
      await this.call(method, params);
    } catch (error: any) {
      const errorMsg = handleAppError('OBS executeWidgetAction', error, `Failed to execute widget action ${config.actionType}`);
      // Add UI-level error if store is available (non-critical if missing)
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { useUiStore } = require('@/store/uiStore');
        useUiStore.getState().addError({ message: errorMsg, source: 'obsClient', level: 'error' });
      } catch (e) {
        // fallback if uiStore isn't importable in this context
      }
      throw new ObsError(errorMsg);
    }
  }
}

export const obsClient = ObsClientImpl.getInstance();
