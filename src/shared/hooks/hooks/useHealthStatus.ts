import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { healthService, HealthReport, ServiceStatus } from '@/services/healthService';
import { logger } from '@/utils/logger';

export type { HealthReport, ServiceStatus };

export interface HealthCheckResult {
  reports: HealthReport[];
  overallStatus: ServiceStatus;
  lastChecked: number;
  isChecking: boolean;
  refreshHealth: () => Promise<void>;
}

const calculateOverallStatus = (currentReports: HealthReport[]): ServiceStatus => {
  const statuses = currentReports.map(r => r.status);
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.includes('unknown')) return 'unknown';
  return 'healthy';
};

export const useHealthStatus = (): HealthCheckResult => {
  const { data: reports = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      logger.info('[useHealthStatus] Refreshing health...');
      const result = await healthService.runChecks();
      logger.info('[useHealthStatus] Health refreshed.');
      return result;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const overallStatus = calculateOverallStatus(reports);

  const refreshHealth = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    reports,
    overallStatus,
    lastChecked: dataUpdatedAt,
    isChecking: isLoading,
    refreshHealth,
  };
};

export default useHealthStatus;
