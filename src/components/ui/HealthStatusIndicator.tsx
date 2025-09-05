import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useHealthStatus } from '@/hooks/useHealthStatus';

interface HealthStatusIndicatorProps {
  className?: string;
}

const HealthStatusIndicator: React.FC<HealthStatusIndicatorProps> = ({ className }) => {
  const { gemini, obs, mcp, overall, lastChecked, isChecking, refreshHealth } = useHealthStatus();

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      label: 'All Systems Operational',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      description: 'All services are running normally'
    },
    degraded: {
      icon: AlertTriangle,
      label: 'Some Systems Degraded',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      description: 'Some services are experiencing issues'
    },
    critical: {
      icon: XCircle,
      label: 'Critical Systems Down',
      color: 'text-red-600',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      description: 'Critical services are unavailable'
    },
    unknown: {
      icon: Activity,
      label: 'Status Unknown',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      description: 'Unable to determine system status'
    }
  };

  const serviceConfig = {
    gemini: {
      name: 'Gemini AI',
      healthy: 'Gemini connection healthy',
      degraded: 'Gemini connection degraded',
      critical: 'Gemini connection failing',
      unknown: 'Gemini status unknown'
    },
    obs: {
      name: 'OBS Studio',
      healthy: 'OBS Studio connected',
      degraded: 'OBS Studio degraded',
      critical: 'OBS Studio disconnected',
      unknown: 'OBS Studio status unknown'
    },
    mcp: {
      name: 'MCP Servers',
      healthy: 'MCP servers healthy',
      degraded: 'MCP servers degraded',
      critical: 'MCP servers failing',
      unknown: 'MCP servers status unknown'
    }
  };

  const currentStatus = statusConfig[overall];
  const StatusIcon = currentStatus.icon;

  const timeAgo = useMemo(() => {
    if (!lastChecked) return 'Never';

    const now = Date.now();
    const diff = now - lastChecked;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  }, [lastChecked]);

  const handleRefresh = async () => {
    await refreshHealth();
  };

  const getServiceStatusIcon = (status: keyof typeof statusConfig) => {
    const ServiceIcon = statusConfig[status].icon;
    return (
      <ServiceIcon
        className={`w-4 h-4 ${statusConfig[status].color}`}
        aria-hidden="true"
      />
    );
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className || ''}`}>
      {/* Main Status Indicator */}
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${currentStatus.bgColor} ${currentStatus.borderColor}`}
        role="status"
        aria-live="polite"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <StatusIcon
            className={`w-5 h-5 ${currentStatus.color}`}
            aria-hidden="true"
          />
        </motion.div>

        <span className={`text-sm font-medium ${currentStatus.color}`}>
          {currentStatus.label}
        </span>

        {/* Service Indicators */}
        <div className="flex items-center space-x-1 ml-3">
          {getServiceStatusIcon(gemini)}
          {getServiceStatusIcon(obs)}
          {getServiceStatusIcon(mcp)}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isChecking}
          className={`ml-2 p-1 rounded transition-colors ${
            isChecking
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-opacity-75 hover:bg-gray-200'
          }`}
          aria-label={isChecking ? 'Refreshing health status' : 'Refresh health status'}
        >
          {isChecking ? (
            <RefreshCw className="w-4 h-4 animate-spin text-gray-600" />
          ) : (
            <RefreshCw className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Time Since Last Check */}
      <span className="text-xs text-gray-500">
        Last checked {timeAgo}
      </span>

      {/* Screen Reader Status */}
      <span className="sr-only">
        System status: {currentStatus.label.toLowerCase()}
      </span>
    </div>
  );
};

export default HealthStatusIndicator;
