import { obsClient, ObsClientImpl } from './obsClient';
import { streamerBotService, StreamerBotService } from './streamerBotService';
import { logger } from '@/shared/utils/logger';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private obsConnections: Map<string, ObsClientImpl> = new Map();
  private streamerBotConnections: Map<string, StreamerBotService> = new Map();

  private constructor() {
    // Initialize with the default singleton connections
    this.obsConnections.set('default', obsClient);
    this.streamerBotConnections.set('default', streamerBotService);
    logger.info('[ConnectionManager] Initialized with default connections.');
  }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public getObsConnection(id: string = 'default'): ObsClientImpl | undefined {
    return this.obsConnections.get(id);
  }

  public getAllObsConnections(): Map<string, ObsClientImpl> {
    return this.obsConnections;
  }

  public getStreamerBotConnection(id: string = 'default'): StreamerBotService | undefined {
    return this.streamerBotConnections.get(id);
  }

  public getAllStreamerBotConnections(): Map<string, StreamerBotService> {
    return this.streamerBotConnections;
  }
}

export const connectionManager = ConnectionManager.getInstance();
