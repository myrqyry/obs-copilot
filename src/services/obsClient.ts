import OBSWebSocket from 'obs-websocket-js';

export class ObsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObsError';
  }
}

export class ObsClientImpl {
  private static instance: ObsClientImpl;
  private obs: any; // Temporarily set to any due to typing issues with obs-websocket-js

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

  getSceneList(): Promise<{ scenes: any[] }> {
    return this.call('GetSceneList');
  }

  getCurrentProgramScene(): Promise<any> {
    return this.call('GetCurrentProgramScene');
  }

  getStreamStatus(): Promise<any> {
    return this.call('GetStreamStatus');
  }

  getRecordStatus(): Promise<any> {
    return this.call('GetRecordStatus');
  }

  getVideoSettings(): Promise<any> {
    return this.call('GetVideoSettings');
  }

  getSceneItemList(sceneName: string): Promise<{ sceneItems: any[] }> {
    return this.call('GetSceneItemList', { sceneName });
  }
}
