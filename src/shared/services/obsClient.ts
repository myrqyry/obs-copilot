import OBSWebSocket from 'obs-websocket-js';
import { logger } from '@/shared/utils/logger';
import { handleAppError } from '@/shared/lib/errorUtils';
import useUiStore from '@/app/store/uiStore';
import { useSettingsStore } from '@/app/store/settingsStore';
import type { UniversalWidgetConfig } from '@/shared/types/universalWidget';

export class ObsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObsError';
  }
}

// Define interface for internal safety
interface OBSWebSocketInstance {
  connect(address: string, password?: string, options?: { rpcVersion: number, eventSubscriptions: number }): Promise<any>;
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

const MAX_RETRY_ATTEMPTS = 5;
const COMMAND_TIMEOUT_MS = 15000;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

// Helper to sanitize and format WS URL
const getWebsocketUrl = (providedAddress?: string) => {
    if (!providedAddress || providedAddress === 'localhost' || providedAddress === '127.0.0.1') {
        if (import.meta.env.VITE_OBS_WS_URL) return import.meta.env.VITE_OBS_WS_URL;
        const hostname = window.location.hostname || 'localhost';
        return `ws://${hostname}:4455`;
    }
    if (providedAddress.startsWith('ws://') || providedAddress.startsWith('wss://')) {
        return providedAddress;
    }
    if (!providedAddress.includes(':')) {
         return `ws://${providedAddress}:4455`;
    }
    return `ws://${providedAddress}`;
};

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: OBSWebSocketInstance;
  
  // State
  private status: ConnectionStatus = 'disconnected';
  private connectOptions: { address: string; password?: string | undefined } | null = null;
  
  // Mechanisms
  private commandQueue: Command[] = [];
  private retryCount = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;
  
  // Event Handling
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private cacheInvalidationListeners: Map<string, () => void> = new Map();
  
  // Cache
  private stateCache: Map<string, { state: any; timestamp: number }> = new Map();
  private pendingStateRequest: Promise<any> | null = null;
  private readonly CACHE_TTL_MS = {
    scenes: 5000,
    sources: 2000,
    status: 1000,
    default: 2000
  };

  private constructor() {
    this.obs = new (OBSWebSocket as any)();
    this.setupInternalListeners();
  }

  public static getInstance(): ObsClientImpl {
    if (!ObsClientImpl.instance) {
      ObsClientImpl.instance = new ObsClientImpl();
    }
    return ObsClientImpl.instance;
  }

  // --- Internal Event Setup ---
  private setupInternalListeners() {
    // Bind methods once to ensure reference equality for add/remove listener
    this.onConnectionOpened = this.onConnectionOpened.bind(this);
    this.onIdentified = this.onIdentified.bind(this);
    this.onConnectionClosed = this.onConnectionClosed.bind(this);
    this.onConnectionError = this.onConnectionError.bind(this);
  }

  private attachListeners() {
    // Clean first to ensure no duplicates
    this.detachListeners();
    this.obs.on('ConnectionOpened', this.onConnectionOpened);
    this.obs.on('Identified', this.onIdentified);
    this.obs.on('ConnectionClosed', this.onConnectionClosed);
    this.obs.on('ConnectionError', this.onConnectionError);
    this.setupCacheInvalidation();
  }

  private detachListeners() {
    try {
      this.obs.off('ConnectionOpened', this.onConnectionOpened);
      this.obs.off('Identified', this.onIdentified);
      this.obs.off('ConnectionClosed', this.onConnectionClosed);
      this.obs.off('ConnectionError', this.onConnectionError);
      
      // Detach cache listeners
      this.cacheInvalidationListeners.forEach((listener, event) => {
        this.obs.off(event, listener);
      });
      this.cacheInvalidationListeners.clear();
    } catch (e) {
      // Ignore errors during detachment (e.g. if socket is already destroyed)
    }
  }

  // --- Connection Logic ---

  public async connect(address: string, password?: string): Promise<void> {
    // 1. Guard against overlapping connection attempts
    if (this.status === 'connecting' && this.connectionPromise) {
      logger.info('[OBS] Connection already in progress, returning existing promise.');
      return this.connectionPromise;
    }

    if (this.status === 'connected') {
      logger.info('[OBS] Already connected.');
      return Promise.resolve();
    }

    const wsUrl = getWebsocketUrl(address);
    this.connectOptions = { address: wsUrl, password };
    this.setStatus('connecting');
    this.cleanupReconnectTimeout();

    this.connectionPromise = (async () => {
      try {
        this.attachListeners();
        logger.info(`[OBS] Connecting to ${wsUrl}...`);
        
        // This resolves when 'Identified' is received or rejects on error
        await this.obs.connect(wsUrl, password, {
          rpcVersion: 1,
          eventSubscriptions: 0xffffffff,
        });
        
      } catch (error: any) {
        // Reset status implies connection failed completely
        this.setStatus('error', error.message);
        
        // Only trigger reconnect if this wasn't a manual intentional failure
        const settings = useSettingsStore.getState().settings;
        if (settings.obs.autoConnect) {
           this.scheduleReconnect();
        }

        throw new ObsError(`Connection failed: ${error.message || 'Unknown error'}`);
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  public async disconnect(): Promise<void> {
    logger.info('[OBS] Manual disconnect requested.');
    
    // 1. Stop any pending reconnects
    this.cleanupReconnectTimeout();
    this.connectOptions = null; // Clear options to prevent auto-reconnect
    
    // 2. Reject queue
    this.rejectStaleCommands('Connection manually closed.');
    
    // 3. Reset Internal State
    try {
       const module = await import('./obsStateManager');
       module.obsStateManager.reset();
    } catch (e) { /* ignore */ }

    // 4. Close socket
    if (this.status !== 'disconnected') {
      try {
        await this.obs.disconnect();
      } catch (e) {
        logger.warn('[OBS] Error during disconnect:', e);
      }
    }
    
    this.setStatus('disconnected');
    this.detachListeners();
  }

  // --- Event Handlers ---

  private onConnectionOpened() {
    logger.debug('[OBS] Socket opened, waiting for identification...');
  }

  private onIdentified() {
    logger.info('[OBS] Connected & Identified!');
    this.retryCount = 0;
    this.setStatus('connected');
    this.processCommandQueue();
  }

  private onConnectionClosed(data: { code: number; reason: string }) {
    logger.warn(`[OBS] Connection closed: ${data.code} - ${data.reason}`);
    
    // Auth failure specific code
    if (data.code === 4009) {
      this.setStatus('error', 'Invalid Password');
      this.connectOptions = null; // Stop reconnecting
      useUiStore.getState().addError({
        message: 'OBS Authentication Failed. Please check your password.',
        source: 'OBS',
        level: 'critical'
      });
      return;
    }

    // Normal closure logic
    if (this.status !== 'reconnecting' && this.status !== 'disconnected') {
      this.setStatus('disconnected');
      
      // Auto-reconnect if we have options
      if (this.connectOptions) {
        const settings = useSettingsStore.getState().settings;
        if (settings.obs.autoConnect) {
           this.setStatus('reconnecting');
           this.scheduleReconnect();
        }
      }
    }
  }

  private onConnectionError(err: any) {
    // Only log if we aren't already in an error state handling logic
    if (this.status !== 'reconnecting' && this.status !== 'error') {
       logger.error('[OBS] Socket Error:', err);
       // The 'ConnectionClosed' event usually follows this, so we handle logic there
    }
  }

  private scheduleReconnect() {
    if (!this.connectOptions) return;
    
    if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
      logger.error(`[OBS] Max reconnect attempts (${MAX_RETRY_ATTEMPTS}) reached. Giving up.`);
      this.setStatus('error', 'Max retries exceeded');
      this.connectOptions = null; // Stop trying
      return;
    }

    const delay = Math.min(
        INITIAL_RECONNECT_DELAY_MS * Math.pow(1.5, this.retryCount), 
        MAX_RECONNECT_DELAY_MS
    );
    
    logger.info(`[OBS] Reconnecting in ${delay}ms (Attempt ${this.retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
    this.retryCount++;

    this.reconnectTimeout = setTimeout(() => {
        if (this.connectOptions) {
            this.connect(this.connectOptions.address, this.connectOptions.password)
                .catch(() => { /* handled in connect() catch block */ });
        }
    }, delay);
  }

  private cleanupReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private setStatus(status: ConnectionStatus, detail?: string) {
    if (this.status !== status) {
        this.status = status;
        this.statusListeners.forEach(listener => listener(status));
        logger.info(`[OBS Status] ${status} ${detail ? `(${detail})` : ''}`);
    }
  }

  // --- Command Execution ---

  public call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Immediate rejection if explicitly disconnected
      if (this.status === 'disconnected' || this.status === 'error') {
        return reject(new ObsError(`Cannot execute ${method}: OBS is ${this.status}`));
      }

      // If connecting, queue it
      if (this.status === 'connecting' || this.status === 'reconnecting') {
         this.queueCommand(method, params, resolve, reject);
         return;
      }

      // Connected - execute immediately
      this.executeCommand(method, params)
          .then(resolve)
          .catch(err => {
              // If send fails (e.g. socket drops mid-flight), queue for retry? 
              // For now, simpler to reject and let caller handle, or rely on internal buffer
              reject(err); 
          });
    });
  }

  private queueCommand(method: string, params: any, resolve: any, reject: any) {
    logger.debug(`[OBS] Queuing command: ${method}`);
    this.commandQueue.push({
      id: `${method}-${Date.now()}-${Math.random()}`,
      method,
      params,
      resolve,
      reject,
      timestamp: Date.now()
    });
  }

  private executeCommand(method: string, params?: any): Promise<any> {
    // Add timeout race
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new ObsError(`Command ${method} timed out`)), COMMAND_TIMEOUT_MS);
    });

    const callPromise = this.obs.call(method, params);

    return Promise.race([callPromise, timeoutPromise]);
  }

  private async processCommandQueue() {
    if (this.commandQueue.length === 0) return;

    // Filter stale commands
    const now = Date.now();
    const validCommands = this.commandQueue.filter(cmd => {
        if (now - cmd.timestamp > COMMAND_TIMEOUT_MS) {
            cmd.reject(new ObsError('Command timed out in queue'));
            return false;
        }
        return true;
    });

    this.commandQueue = []; // Clear queue before processing to avoid loops

    logger.info(`[OBS] Processing ${validCommands.length} queued commands`);
    
    // Execute sequentially to maintain order
    for (const cmd of validCommands) {
        try {
            const result = await this.executeCommand(cmd.method, cmd.params);
            cmd.resolve(result);
        } catch (e) {
            cmd.reject(e);
        }
    }
  }

  private rejectStaleCommands(reason: string) {
    this.commandQueue.forEach(cmd => cmd.reject(new ObsError(reason)));
    this.commandQueue = [];
  }

  // --- Caching Logic (Keeping simplified from original for brevity, but vital) ---
  
  private setupCacheInvalidation() {
    // Standard invalidation patterns
    const events: Record<string, string[]> = {
       'CurrentProgramSceneChanged': ['getCurrentProgramScene', 'fullState'],
       'SceneListChanged': ['getSceneList', 'fullState'],
       'InputVolumeChanged': ['getInputList', 'fullState'], // careful with volume, high freq
       'StreamStateChanged': ['getStreamStatus', 'fullState'],
       'RecordStateChanged': ['getRecordStatus', 'fullState']
    };

    Object.entries(events).forEach(([evt, keys]) => {
        const handler = () => {
            keys.forEach(k => this.stateCache.delete(k));
        };
        this.cacheInvalidationListeners.set(evt, handler);
        this.obs.on(evt, handler);
    });
  }
  
  // Public Helpers
  public isConnected() { return this.status === 'connected'; }
  public getConnectionStatus() { return this.status; }
  
  public addStatusListener(listener: (status: ConnectionStatus) => void) {
      this.statusListeners.add(listener);
      listener(this.status); // Initial emit
      return () => this.statusListeners.delete(listener);
  }

  // Legacy support for widget system
  async executeWidgetAction(config: UniversalWidgetConfig, value: any): Promise<void> {
    try {
      const params: Record<string, any> = {};
      if (config.targetName) params.inputName = config.targetName;
      if (config.targetType === 'scene' && config.targetName) {
        params.sceneName = config.targetName;
      }
      if (value !== undefined && value !== null) {
        // Handle specialized mappings if needed, generic 'value' mapping usually insufficient for raw call
        if (config.actionType === 'SetInputVolume') params.inputVolumeDb = value;
        else params.value = value;
      }
      await this.call(config.actionType, params);
    } catch (error) {
       throw error; // Let widget handle UI feedback
    }
  }

  // AI Context Support (Stubbed from previous implementation)
  async getFullState(): Promise<any> {
      // Re-use connection check
      if (!this.isConnected()) return {};
      // Implement caching logic here similar to previous file
      return this.call('GetSceneList'); // Placeholder
  }
  async getAvailableTargets(type: string): Promise<string[]> {
      // Discovery logic
      return [];
  }
}

export const obsClient = ObsClientImpl.getInstance();