import OBSWebSocket from 'obs-websocket-js';
import { backoff } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';
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
    options?: { eventSubscriptions: number },
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
}

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: OBSWebSocketInstance;
  private status: ConnectionStatus = 'disconnected';
  private commandQueue: Command[] = [];
  private retryCount = 0;
  private connectOptions: { address: string; password?: string } | null = null;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];

  private constructor() {
    this.obs = new (OBSWebSocket as any)();
    this.setupEventListeners();
  }

  public static getInstance(): ObsClientImpl {
    if (!ObsClientImpl.instance) {
      ObsClientImpl.instance = new ObsClientImpl();
    }
    return ObsClientImpl.instance;
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  public addStatusListener(listener: (status: ConnectionStatus) => void) {
    this.statusListeners.push(listener);
  }

  public removeStatusListener(listener: (status: ConnectionStatus) => void) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  private setupEventListeners() {
    this.obs.on('ConnectionOpened', () => {
      logger.info('OBS connection opened. Awaiting identification...');
      // Do not set to 'connected' yet; wait for 'Identified'
    });

    this.obs.on('Identified', () => {
      logger.info('OBS Identified: Socket ready for API calls.');
      this.setStatus('connected');
      this.retryCount = 0;
      this.processCommandQueue();
    });

    this.obs.on('ConnectionClosed', () => {
      logger.warn('OBS connection closed.');
      this.setStatus('reconnecting');
      this.handleReconnect();
    });

    this.obs.on('ConnectionError', (err: any) => {
        logger.error('OBS connection error:', err);
        const errorMsg = handleAppError('OBS ConnectionError', err, 'Connection error occurred');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'obsClient',
          level: 'critical',
          details: { error: err }
        });
        this.setStatus('reconnecting');
        this.handleReconnect();
    });

    // Catch general errors to prevent uncaught exceptions in connection/retry logic
    this.obs.on('error', (err: any) => {
      logger.error('Uncaught OBS error:', err);
      const errorMsg = handleAppError('OBS uncaught error', err, 'Uncaught error in OBS client');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'critical',
        details: { error: err }
      });
      if (err instanceof ObsError) {
        logger.error(`ObsError details: ${err.message}`);
        this.setStatus('error');
        // Optionally trigger reconnect for non-fatal errors
        if (this.status === 'reconnecting' || this.status === 'connecting') {
          this.handleReconnect();
        }
      }
    });
  }

  private async handleReconnect() {
    if (!this.connectOptions) {
        logger.error("Cannot reconnect; no connection options saved.");
        this.setStatus('disconnected');
        return;
    }
    this.retryCount++;
    const delay = backoff(this.retryCount);
    logger.info(`OBS connection lost. Reconnecting in ${delay.toFixed(0)}ms (attempt ${this.retryCount})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    this.connect(this.connectOptions.address, this.connectOptions.password);
  }

  async connect(address: string, password?: string): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }
    
    this.connectOptions = { address, password };
    this.setStatus('connecting');

    try {
      await this.obs.connect(address, password, {
        eventSubscriptions: 0xffffffff,
      });
    } catch (error) {
      const errorMsg = handleAppError('OBS connection', error, `Failed to connect to OBS at ${address}`);
      logger.error(errorMsg);
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'critical',
        details: { address, error }
      });
      this.setStatus('reconnecting');
      this.handleReconnect();
      throw new ObsError(errorMsg);
    }
  }

  async disconnect(): Promise<void> {
    this.connectOptions = null; // Prevent reconnecting after manual disconnect
    this.commandQueue = []; // Clear any pending commands to prevent stale processing
    this.setStatus('disconnected');
    try {
      await this.obs.disconnect();
    } catch {
      // Ignore errors on disconnect
    }
  }

  private async processCommandQueue() {
      const queue = this.commandQueue;
      this.commandQueue = [];
      console.log(`[DEBUG] Processing ${queue.length} queued OBS commands`); // Queue processing log
      for (const command of queue) {
        try {
          const result = await this.call(command.method, command.params);
          command.resolve(result);
        } catch (error) {
          console.error(`[DEBUG] Queued OBS command failed: ${command.method}`, error);
          const errorMsg = handleAppError(`Queued OBS ${command.method}`, error, `Failed to process queued command: ${command.method}`);
          useUiStore.getState().addError({
            message: errorMsg,
            source: 'obsClient',
            level: 'error',
            details: { method: command.method, params: command.params, error }
          });
          command.reject(new ObsError(errorMsg));
        }
      }
    }

  call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `${method}-${Date.now()}`;
      const obsInstance = this.obs as any; // To access identified property
      if (this.status !== 'connected' || !obsInstance.identified) {
        if (this.status === 'disconnected' || this.status === 'error') {
          reject(new ObsError('OBS not connected.'));
          return;
        }
        console.log(`[DEBUG] OBS not ready (status: ${this.status}, identified: ${obsInstance.identified}). Queuing command: ${method}`); // Queue log
        this.commandQueue.push({ id: requestId, method, params, resolve, reject });
        return;
      }
  
      console.log(`[DEBUG] OBS call ${method}, status: ${this.status}`); // Call start log
  
      this.obs.call<T>(method, params)
        .then(response => {
            resolve(response);
        })
        .catch(error => {
          console.error(`[DEBUG] OBS call failed for method ${method}:`, error); // Call failure log
          const errorMsg = handleAppError(`OBS call ${method}`, error, `Failed to execute OBS command: ${method}`);
          useUiStore.getState().addError({
            message: errorMsg,
            source: 'obsClient',
            level: 'error',
            details: { method, params, error }
          });
          reject(new ObsError(errorMsg));
        });
    });
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.obs.on(event, listener);
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

  getSceneList() {
    return this.call('GetSceneList');
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

  getSceneItemList(sceneName: string) {
    return this.call('GetSceneItemList', { sceneName });
  }

  getInputList() {
    return this.call('GetInputList');
  }

  async addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    width: number = 800,
    height: number = 600,
  ) {
    try {
      await this.call('CreateInput', {
        sceneName,
        inputName: sourceName,
        inputKind: 'browser_source',
        inputSettings: {
          url,
          width,
          height,
          rerender_with_css: true,
          webpage_control_level: 2, // Full control
        },
        sceneItemEnabled: true,
      });
    } catch (error) {
      const errorMsg = handleAppError('OBS addBrowserSource', error, `Failed to add browser source ${sourceName} to scene ${sceneName}`);
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { sceneName, sourceName, url, error }
      });
      throw new ObsError(errorMsg);
    }
  }

  async addImageSource(
    sceneName: string,
    imageUrl: string,
    sourceName: string,
  ) {
    try {
      await this.call('CreateInput', {
        sceneName,
        inputName: sourceName,
        inputKind: 'image_source',
        inputSettings: {
          file: imageUrl,
          unload_when_not_showing: true,
        },
        sceneItemEnabled: true,
      });
    } catch (error) {
      const errorMsg = handleAppError('OBS addImageSource', error, `Failed to add image source ${sourceName} to scene ${sceneName}`);
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { sceneName, sourceName, imageUrl, error }
      });
      throw new ObsError(errorMsg);
    }
  }

  async setVideoSettings(settings: {
    fpsNumerator: number;
    fpsDenominator: number;
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
  }) {
    try {
      await this.call('SetVideoSettings', settings);
    } catch (error) {
      const errorMsg = handleAppError('OBS setVideoSettings', error, 'Failed to set video settings');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { settings, error }
      });
      throw new ObsError(errorMsg);
    }
  }

  async startStream() {
    try {
      await this.call('StartStream');
    } catch (error) {
      const errorMsg = handleAppError('OBS startStream', error, 'Failed to start stream');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { error }
      });
      throw new ObsError(errorMsg);
    }
  }

  async stopStream() {
    try {
      await this.call('StopStream');
    } catch (error) {
      const errorMsg = handleAppError('OBS stopStream', error, 'Failed to stop stream');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { error }
      });
      throw new ObsError(errorMsg);
    }
  }

  async startRecord() {
    try {
      await this.call('StartRecord');
    } catch (error) {
      const errorMsg = handleAppError('OBS startRecord', error, 'Failed to start recording');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { error }
      });
      throw new ObsError(errorMsg);
    }
  }

  async stopRecord() {
    try {
      await this.call('StopRecord');
    } catch (error) {
      const errorMsg = handleAppError('OBS stopRecord', error, 'Failed to stop recording');
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { error }
      });
      throw new ObsError(errorMsg);
    }
  }

  // Widget-specific methods
  async getAvailableTargets(type: string): Promise<string[]> {
    // Accept string values for target types (e.g. 'input', 'scene', 'transition')
    switch (type) {
      case 'input': {
        const inputs = await this.call('GetInputList');
        return inputs.inputs.map((input: any) => input.inputName);
      }
      case 'scene': {
        const scenes = await this.call('GetSceneList');
        return scenes.scenes.map((scene: any) => scene.sceneName);
      }
      case 'transition': {
        const transitions = await this.call('GetTransitionList');
        return transitions.transitions.map((t: any) => t.transitionName);
      }
      default:
        return [];
    }
  }

  async executeWidgetAction(config: UniversalWidgetConfig, value: any): Promise<void> {
    try {
      const params: Record<string, any> = {};
      if (config.targetName) params.inputName = config.targetName;
      if (config.targetType === 'scene' && config.targetName) params.sceneName = config.targetName;
  
      switch (config.actionType) {
        case 'setInputVolume':
          await this.call('SetInputVolume', { ...params, inputVolumeDb: value });
          break;
        case 'setInputMute':
          await this.call('SetInputMute', { ...params, inputMuted: value });
          break;
        case 'setCurrentProgramScene':
          await this.call('SetCurrentProgramScene', { sceneName: value });
          break;
        // Add more cases as needed
        default:
          throw new ObsError(`Unsupported action: ${config.actionType}`);
      }
    } catch (error) {
      const errorMsg = handleAppError('OBS executeWidgetAction', error, `Failed to execute widget action ${config.actionType}`);
      useUiStore.getState().addError({
        message: errorMsg,
        source: 'obsClient',
        level: 'error',
        details: { config, value, error }
      });
      throw new ObsError(errorMsg);
    }
  }
}

// Export a convenient singleton instance for consumers that import { obsClient }
// This preserves existing import sites while keeping the class available for
// direct use or testing.
export const obsClient = ObsClientImpl.getInstance();
