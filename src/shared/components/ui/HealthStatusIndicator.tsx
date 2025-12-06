import React, { useMemo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useHealthStatus } from '@/hooks/useHealthStatus';

interface HealthStatusIndicatorProps {
  className?: string;
}

const HealthStatusIndicator: React.FC<HealthStatusIndicatorProps> = ({ className }) => {
  const { gemini, obs, mcp, overall, lastChecked, isChecking, refreshHealth } = useHealthStatus();
  const iconRef = useRef<HTMLDivElement>(null);

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      label: 'All Systems Operational',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      description: 'All services are running normally'
    },
    degraded: {
      icon: AlertTriangle,
      label: 'Some Systems Degraded',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      description: 'Some services are experiencing issues'
    },
    critical: {
      icon: XCircle,
      label: 'Critical Systems Down',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/20',
      description: 'Critical services are unavailable'
    },
    unknown: {
      icon: Activity,
      label: 'Status Unknown',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted/20',
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

  useEffect(() => {
    if (iconRef.current) {
        gsap.fromTo(iconRef.current, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' });
    }
  }, [overall]);

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
        <div ref={iconRef}>
          <StatusIcon
            className={`w-5 h-5 ${currentStatus.color}`}
            aria-hidden="true"
          />
        </div>

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
              : 'hover:bg-opacity-75 hover:bg-muted/20'
          }`}
          aria-label={isChecking ? 'Refreshing health status' : 'Refresh health status'}
        >
          {isChecking ? (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Time Since Last Check */}
      <span className="text-xs text-muted-foreground">
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
