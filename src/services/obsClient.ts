import OBSWebSocket from 'obs-websocket-js';

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
  ): Promise<void>;
  disconnect(): Promise<void>;
  call<T = any>(method: string, params?: Record<string, any>): Promise<T>;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  identified: boolean;
}

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: OBSWebSocketInstance;

  private constructor() {
    // Temporary workaround for constructor typing
    this.obs = new (OBSWebSocket as any)();
  }

  public static getInstance(): ObsClientImpl {
    if (!ObsClientImpl.instance) {
      ObsClientImpl.instance = new ObsClientImpl();
    }
    return ObsClientImpl.instance;
  }

  async connect(address: string, password?: string): Promise<void> {
    try {
      await this.obs.connect(address, password, {
        eventSubscriptions: 0xffffffff,
      });
    } catch (error) {
      throw new ObsError(`Failed to connect to OBS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.obs.disconnect();
    } catch {
      // Disconnect might fail if already disconnected, ignore
    }
  }

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    try {
      return await this.obs.call(method, params);
    } catch (error) {
      throw new ObsError(`OBS call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.obs.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.obs.off(event, listener);
  }

  isConnected(): boolean {
    return this.obs.identified;
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
}
