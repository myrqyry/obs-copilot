import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { X, AlertTriangle, Info, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import useUiStore from '@/app/store/uiStore';

interface ErrorObject {
  id: string;
  message: string;
  source: string;
  timestamp: number;
  level: 'critical' | 'error' | 'warning';
  retry?: () => void;
  details?: Record<string, any>;
}

interface ErrorViewerProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const ErrorViewer: React.FC<ErrorViewerProps> = ({ isOpen, onClose, className }) => {
  const { criticalErrors, removeError, clearErrors } = useUiStore();
  const [filteredLogs, setFilteredLogs] = useState<ErrorObject[]>([]);
  const [filters, setFilters] = useState({
    level: 'all' as 'all' | 'critical' | 'error' | 'warning',
    source: 'all' as string,
    search: '',
    showAuthedOnly: false,
  });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter logs based on current filters
  useEffect(() => {
    let filtered = criticalErrors;

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
        log.source.toLowerCase().includes(searchLower)
      );
    }

    if (filters.showAuthedOnly) {
      filtered = filtered.filter(log => log.details?.requestId);
    }

    setFilteredLogs(prevFilteredLogs => {
      // Only update if the new filtered array is different from the previous one
      // Assuming 'id' is a unique identifier for ErrorObject
      if (prevFilteredLogs.length === filtered.length &&
          prevFilteredLogs.every((log, index) => log.id === filtered[index].id)) {
        return prevFilteredLogs; // No change, return the previous state
      }
      return filtered; // Update with the new filtered array
    });
  }, [criticalErrors, filters]);

  const getLevelIcon = (level: ErrorObject['level']) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getLevelColor = (level: ErrorObject['level']) => {
    switch (level) {
      case 'critical':
      case 'error':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning';
      default:
        return 'bg-info/10 border-info/20 text-info';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, HH:mm:ss');
  };

    return (
      <AnimatePresence>
        {isOpen && (
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
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col ${className || ''}`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                <div className="flex flex-wrap items-center gap-4">
                  {/* Level Filter */}
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="critical">Critical Errors</option>
                    <option value="error">Errors Only</option>
                    <option value="warning">Warnings</option>
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
  
                  {/* Clear All Button */}
                  <button
                    onClick={() => clearErrors()}
                    className="ml-auto px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 text-sm font-medium"
                  >
                    Clear All Errors
                  </button>
                </div>
              </div>
  
              {/* Logs List */}
              <div className="overflow-y-auto flex-grow">
                {filteredLogs.length === 0 ? (
                  <div className="text-center p-8 text-gray-500 flex flex-col items-center justify-center h-full">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No critical errors to display</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredLogs.map((log) => {
                      const handleRetryClick = () => handleRetry(log);
                      return (
                        <div
                          key={log.id}
                          className={`p-4 transition-colors ${getLevelColor(log.level)}`}
                        >
                          <div className="flex items-start space-x-3">
                            {getLevelIcon(log.level)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {log.message}
                                </p>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {formatTimestamp(log.timestamp)}
                                </span>
                              </div>
                        
                              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                                <span>Source: {log.source}</span>
                                {log.details?.requestId && <span>Request ID: {log.details.requestId}</span>}
                                {log.retry && (
                                  <button
                                    onClick={handleRetryClick}
                                    className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                                  >
                                    Retry
                                  </button>
                                )}
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
                            <button
                              onClick={() => removeError(log.id)}
                              className="text-destructive hover:text-destructive/80 text-sm ml-2 flex-shrink-0"
                              title="Dismiss error"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
  
              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Showing {filteredLogs.length} of {criticalErrors.length} critical errors</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Last updated: {format(new Date(), 'HH:mm:ss')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>  );
};

export default ErrorViewer;
