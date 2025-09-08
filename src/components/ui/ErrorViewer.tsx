import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  source: string;
  requestId?: string;
  details?: Record<string, any>;
}

interface ErrorViewerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ErrorViewer: React.FC<ErrorViewerProps> = ({ isOpen, onClose, className }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState({
    level: 'all' as 'all' | 'error' | 'warning' | 'info' | 'debug',
    source: 'all' as string,
    search: '',
    showAuthedOnly: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Mock log fetching - replace with actual API call
  const fetchLogs = async (requestId?: string) => {
    setIsLoading(true);
    try {
      // Replace with actual API call to fetch logs
      const mockLogs: LogEntry[] = [
        {
          id: 'log_1',
          timestamp: Date.now() - 300000,
          level: 'error',
          message: 'Connection timeout to OBS WebSocket',
          source: 'obs-connection',
          requestId: 'req_12345',
          details: {
            error: 'WebSocket timeout after 30 seconds',
            code: 'CONNECTION_TIMEOUT',
            url: 'ws://localhost:4455'
          }
        },
        {
          id: 'log_2',
          timestamp: Date.now() - 600000,
          level: 'warning',
          message: 'Gemini API rate limit approaching',
          source: 'gemini-service',
          requestId: 'req_12346',
          details: {
            remainingRequests: 45,
            resetTime: Date.now() + 3600000
          }
        },
        {
          id: 'log_3',
          timestamp: Date.now() - 900000,
          level: 'info',
          message: 'MCP server connected successfully',
          source: 'mcp-manager',
          requestId: 'req_12347',
          details: {
            serverName: 'firecrawl-mcp',
            version: '1.0.0'
          }
        }
      ];

      setTimeout(() => {
        setLogs(mockLogs);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setIsLoading(false);
    }
  };

  // Filter logs based on current filters
  useEffect(() => {
    let filtered = logs;

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(log => log.source === filters.source);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower) ||
        (log.requestId && log.requestId.toLowerCase().includes(searchLower))
      );
    }

    if (filters.showAuthedOnly) {
      filtered = filtered.filter(log => log.requestId);
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  // Fetch logs when component opens
  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info':
        return <Info className="w-4 h-4 text-info" />;
      case 'debug':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      case 'info':
        return 'bg-info/10 border-info/20 text-info';
      case 'debug':
        return 'bg-muted/10 border-muted/20 text-muted-foreground';
      default:
        return 'bg-muted/10 border-muted/20 text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, HH:mm:ss');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden ${className || ''}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Error Logs & System Status</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close error viewer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              {/* Level Filter */}
              <select
                value={filters.level}
                onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[200px]"
              />

              {/* Authenticated Only */}
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.showAuthedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, showAuthedOnly: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Authenticated requests only</span>
              </label>

              {/* Refresh Button */}
              <button
                onClick={() => fetchLogs()}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start space-x-3">
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {log.message}
                          </p>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                          <span>Source: {log.source}</span>
                          {log.requestId && <span>Request ID: {log.requestId}</span>}
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="flex items-center space-x-1 hover:text-gray-900"
                          >
                            {expandedLog === log.id ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hide Details</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Show Details</span>
                              </>
                            )}
                          </button>
                        </div>

                        {expandedLog === log.id && log.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium">Details</summary>
                            <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing {filteredLogs.length} of {logs.length} logs</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Auto-refresh: 30s</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorViewer;
