import { useState, useEffect, useCallback } from 'react';
import { healthService, HealthReport, ServiceStatus } from '@/services/healthService';
export type { HealthReport, ServiceStatus };
import { logger } from '@/utils/logger';

export interface HealthCheckResult {
  reports: HealthReport[];
  overallStatus: ServiceStatus;
  lastChecked: number;
  isChecking: boolean;
  refreshHealth: () => Promise<void>;
}

export const useHealthStatus = (): HealthCheckResult => {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [overallStatus, setOverallStatus] = useState<ServiceStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<number>(Date.now());
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const calculateOverallStatus = (currentReports: HealthReport[]): ServiceStatus => {
    const statuses = currentReports.map(r => r.status);
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.includes('unknown')) return 'unknown';
    return 'healthy';
  };

  const refreshHealth = useCallback(async (): Promise<void> => {
    setIsChecking(true);
    logger.info('[useHealthStatus] Refreshing health...');
    const newReports = await healthService.runChecks();
    setReports(newReports);
    setOverallStatus(calculateOverallStatus(newReports));
    setLastChecked(Date.now());
    setIsChecking(false);
    logger.info('[useHealthStatus] Health refreshed.');
  }, []);

  useEffect(() => {
    refreshHealth(); // Initial check

    healthService.startMonitoring();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshHealth();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      healthService.stopMonitoring();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshHealth]);

  return {
    reports,
    overallStatus,
    lastChecked,
    isChecking,
    refreshHealth,
  };
};

export default useHealthStatus;
