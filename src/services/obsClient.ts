import OBSWebSocket from 'obs-websocket-js';
import { backoff } from '@/lib/utils';
import { logger } from '@/utils/logger';

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
  connEpoch: number;
}

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: OBSWebSocketInstance;
  private status: ConnectionStatus = 'disconnected';
  private connEpoch = 0;
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
      this.connEpoch++;
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
        this.setStatus('reconnecting');
        this.handleReconnect();
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
      logger.error(`Failed to connect to OBS: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.setStatus('reconnecting');
      this.handleReconnect();
      throw new ObsError(`Failed to connect to OBS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connectOptions = null; // Prevent reconnecting after manual disconnect
    this.setStatus('disconnected');
    try {
      await this.obs.disconnect();
    } catch {
      // Ignore errors on disconnect
    }
  }

  private processCommandQueue() {
    const queue = this.commandQueue;
    this.commandQueue = [];
    logger.info(`Processing ${queue.length} queued OBS commands.`);
    queue.forEach(command => {
        if (command.connEpoch < this.connEpoch) {
            command.reject(new ObsError('Stale command from previous connection.'));
            return;
        }
      this.call(command.method, command.params)
        .then(command.resolve)
        .catch(command.reject);
    });
  }

  call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `${method}-${Date.now()}`;
      const obsInstance = this.obs as any; // To access identified property
      if (this.status !== 'connected' || !obsInstance.identified) {
        logger.warn(`OBS not ready (status: ${this.status}, identified: ${obsInstance.identified}). Queuing command: ${method}`);
        this.commandQueue.push({ id: requestId, method, params, resolve, reject, connEpoch: this.connEpoch });
        return;
      }

      const currentEpoch = this.connEpoch;

      this.obs.call<T>(method, params)
        .then(response => {
            if (this.connEpoch !== currentEpoch) {
                reject(new ObsError('Stale response from previous connection.'));
            } else {
                resolve(response);
            }
        })
        .catch(error => {
          logger.error(`OBS call failed for method ${method}:`, error);
          if (this.status !== 'connected' || !obsInstance.identified) {
            logger.warn(`Re-queuing command ${method} due to connection issue.`);
            this.commandQueue.push({ id: requestId, method, params, resolve, reject, connEpoch: this.connEpoch });
          } else {
            reject(new ObsError(`OBS call failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
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

  async addBrowserSource(
    sceneName: string,
    url: string,
    sourceName: string,
    width: number = 800,
    height: number = 600,
  ) {
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
  }

  async addImageSource(
    sceneName: string,
    imageUrl: string,
    sourceName: string,
  ) {
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
  }

  async setVideoSettings(settings: {
    fpsNumerator: number;
    fpsDenominator: number;
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
  }) {
    await this.call('SetVideoSettings', settings);
  }

  async startStream() {
    await this.call('StartStream');
  }

  async stopStream() {
    await this.call('StopStream');
  }

  async startRecord() {
    await this.call('StartRecord');
  }

  async stopRecord() {
    await this.call('StopRecord');
  }

  // Widget-specific methods
  async getAvailableTargets(type: TargetType): Promise<string[]> {
    switch (type) {
      case TargetType.INPUT:
        const inputs = await this.call('GetInputList');
        return inputs.inputs.map((input: any) => input.inputName);
      case TargetType.SCENE:
        const scenes = await this.call('GetSceneList');
        return scenes.scenes.map((scene: any) => scene.sceneName);
      case TargetType.TRANSITION:
        const transitions = await this.call('GetTransitionList');
        return transitions.transitions.map((t: any) => t.transitionName);
      default:
        return [];
    }
  }

  async executeWidgetAction(config: UniversalWidgetConfig, value: any): Promise<void> {
    const params: Record<string, any> = {};
    if (config.targetName) params.inputName = config.targetName;
    if (config.targetType === TargetType.SCENE && config.targetName) params.sceneName = config.targetName;

    switch (config.actionType) {
      case 'SetVolume':
        await this.call('SetInputVolume', { ...params, inputVolumeDb: value });
        break;
      case 'SetInputMute':
        await this.call('SetInputMute', { ...params, inputMuted: value });
        break;
      case 'SetCurrentScene':
        await this.call('SetCurrentScene', { sceneName: value });
        break;
      // Add more cases as needed
      default:
        throw new ObsError(`Unsupported action: ${config.actionType}`);
    }
  }
}
