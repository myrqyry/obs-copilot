import { connectionManager } from './ConnectionManager';
import { ObsClientImpl } from './obsClient';
import { StreamerBotService } from './streamerBotService';
import { logger } from '@/shared/utils/logger';

export type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface HealthReport {
  service: string;
  status: ServiceStatus;
  details?: string;
}

class HealthService {
  private static instance: HealthService;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  public startMonitoring(interval: number = 30000) {
    if (this.healthCheckInterval) {
      this.stopMonitoring();
    }
    logger.info(`[HealthService] Starting health monitoring with a ${interval}ms interval.`);
    this.healthCheckInterval = setInterval(() => {
      this.runChecks();
    }, interval);
  }

  public stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('[HealthService] Stopped health monitoring.');
    }
  }

  public async runChecks(): Promise<HealthReport[]> {
    logger.info('[HealthService] Running health checks...');
    const reports: HealthReport[] = [];

    const obsConnections = connectionManager.getAllObsConnections();
    for (const [id, client] of obsConnections.entries()) {
      reports.push(await this.checkObsConnection(id, client));
    }

    const streamerBotConnections = connectionManager.getAllStreamerBotConnections();
    for (const [id, client] of streamerBotConnections.entries()) {
      reports.push(await this.checkStreamerBotConnection(id, client));
    }

    reports.push(await this.checkGeminiHealth());

    logger.info('[HealthService] Health checks complete.', reports);
    return reports;
  }

  private async checkObsConnection(id: string, client: ObsClientImpl): Promise<HealthReport> {
    const status = client.getConnectionStatus();
    let serviceStatus: ServiceStatus = 'unknown';
    let details = `Connection status: ${status}`;

    switch (status) {
      case 'connected':
        serviceStatus = 'healthy';
        break;
      case 'connecting':
      case 'reconnecting':
        serviceStatus = 'degraded';
        break;
      case 'error':
        serviceStatus = 'critical';
        break;
    }

    return { service: `OBS (${id})`, status: serviceStatus, details };
  }

  private async checkStreamerBotConnection(id: string, client: StreamerBotService): Promise<HealthReport> {
    const status = client.isConnected();
    const serviceStatus: ServiceStatus = status ? 'healthy' : 'critical';
    const details = `Connection status: ${status ? 'connected' : 'disconnected'}`;

    return { service: `Streamer.bot (${id})`, status: serviceStatus, details };
  }

  private async checkGeminiHealth(): Promise<HealthReport> {
    try {
      const response = await fetch('/api/health/gemini');
      if (response.ok) {
        const data = await response.json();
        return { service: 'Gemini', status: data.healthy ? 'healthy' : 'degraded', details: data.healthy ? 'API key is configured' : 'API key is missing' };
      }
      return { service: 'Gemini', status: 'critical', details: `Health check failed with status: ${response.status}` };
    } catch (error) {
      logger.error('[HealthService] Gemini health check failed:', error);
      return { service: 'Gemini', status: 'critical', details: 'Failed to fetch Gemini health status.' };
    }
  }
}

export const healthService = HealthService.getInstance();
