import { useState, useEffect, useCallback } from 'react';
import useSettingsStore from '@/store/settingsStore';
import useConnectionsStore from '@/store/connectionsStore';

export type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface HealthStatus {
  gemini: ServiceStatus;
  obs: ServiceStatus;
  mcp: ServiceStatus;
  overall: ServiceStatus;
  lastChecked: number;
  isChecking: boolean;
  refreshHealth: () => Promise<void>;
}

export const useHealthStatus = (): HealthStatus => {
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Get status from stores
  const { isConnected: obsConnected, connectionError: obsError } = useConnectionsStore();

  // Mock MCP health status - replace with actual MCP health check
  const [mcpStatus] = useState<ServiceStatus>('healthy');

  const checkGeminiHealth = useCallback(async (): Promise<ServiceStatus> => {
    try {
      // Check backend Gemini proxy health (no auth needed - backend handles it)
      const response = await fetch('/api/health/gemini');

      if (response.ok) {
        const data = await response.json();
        return data.healthy ? 'healthy' : 'degraded';
      }
      return 'critical';
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return 'critical';
    }
  }, []);

  const checkOBSHealth = useCallback(async (): Promise<ServiceStatus> => {
    if (obsError) return 'critical';
    if (!obsConnected) return 'unknown';

    try {
      // Mock OBS health check - replace with actual OBS connection test
      const response = await fetch('/api/health/obs');
      if (response.ok) {
        const data = await response.json();
        return data.connected ? 'healthy' : 'degraded';
      }
      return 'critical';
    } catch (error) {
      console.error('OBS health check failed:', error);
      return 'critical';
    }
  }, [obsConnected, obsError]);

  const checkMCPHealth = useCallback(async (): Promise<ServiceStatus> => {
    try {
      // Mock MCP health check - replace with actual MCP status
      const response = await fetch('/api/health/mcp');
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy' ? 'healthy' : 'degraded';
      }
      return 'critical';
    } catch (error) {
      console.error('MCP health check failed:', error);
      return 'critical';
    }
  }, []);

  const refreshHealth = useCallback(async (): Promise<void> => {
    setIsChecking(true);

    try {
      // Run all health checks concurrently
      const [geminiStatus, obsStatus, mcpHealthStatus] = await Promise.allSettled([
        checkGeminiHealth(),
        checkOBSHealth(),
        checkMCPHealth(),
      ]);

      const gemini = geminiStatus.status === 'fulfilled' ? geminiStatus.value : 'critical';
      const obs = obsStatus.status === 'fulfilled' ? obsStatus.value : 'critical';
      const mcp = mcpHealthStatus.status === 'fulfilled' ? mcpHealthStatus.value : mcpStatus;

      setLastChecked(Date.now());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [checkGeminiHealth, checkOBSHealth, checkMCPHealth, mcpStatus]);

  // Calculate overall status
  const calculateOverallStatus = (
    gemini: ServiceStatus,
    obs: ServiceStatus,
    mcp: ServiceStatus
  ): ServiceStatus => {
    const statuses = [gemini, obs, mcp];

    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.includes('unknown')) return 'unknown';

    return 'healthy';
  };

  // Get current status values
  const [geminiStatus] = useState<ServiceStatus>('unknown');
  const [obsStatus] = useState<ServiceStatus>(
    obsConnected ? 'unknown' : 'unknown'
  );
  const overallStatus = calculateOverallStatus(geminiStatus, obsStatus, mcpStatus);

  // Auto-refresh on mount and dependencies change
  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChecking) {
        refreshHealth();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [refreshHealth, isChecking]);

  return {
    gemini: geminiStatus,
    obs: obsStatus,
    mcp: mcpStatus,
    overall: overallStatus,
    lastChecked,
    isChecking,
    refreshHealth,
  };
};

export default useHealthStatus;
