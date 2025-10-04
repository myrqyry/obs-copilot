import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';
import ErrorFallback from './ErrorFallback';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    resetOnPropsChange?: boolean;
    resetKeys?: Array<string | number>;
    isolate?: boolean;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string | null;
}

/**
 * Comprehensive Error Boundary that provides:
 * - Graceful error handling with fallback UI
 * - Error logging and reporting
 * - Recovery mechanisms
 * - Isolation of component failures
 */
class ComprehensiveErrorBoundary extends Component<Props, State> {
    private resetTimeoutId: number | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { onError, name } = this.props;
        
        // Generate error context
        const errorContext = {
            boundaryName: name || 'UnnamedErrorBoundary',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            errorId: this.state.errorId,
        };

        // Log error with full context
        logger.error('Error Boundary caught an error:', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            errorInfo: {
                componentStack: errorInfo.componentStack,
            },
            context: errorContext,
        });

        // Update state with error info
        this.setState({ errorInfo });

        // Call custom error handler if provided
        if (onError) {
            try {
                onError(error, errorInfo);
            } catch (handlerError) {
                logger.error('Error in custom error handler:', handlerError);
            }
        }

        // Report to external error tracking service if available
        this.reportError(error, errorInfo, errorContext);
    }

    componentDidUpdate(prevProps: Props) {
        const { resetOnPropsChange, resetKeys } = this.props;
        const { hasError } = this.state;

        // Reset error state if resetKeys have changed
        if (hasError && resetOnPropsChange && resetKeys) {
            const prevResetKeys = prevProps.resetKeys || [];
            const hasResetKeyChanged = resetKeys.some(
                (key, index) => key !== prevResetKeys[index]
            );

            if (hasResetKeyChanged) {
                this.resetErrorBoundary();
            }
        }
    }

    componentWillUnmount() {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }
    }

    private reportError = (error: Error, /* unused */ _errorInfo: ErrorInfo, context: any) => {
        // This could be extended to report to services like Sentry, LogRocket, etc.
        try {
            // Example: Send to analytics or error reporting service
            const gtag = (window as any).gtag;
            if (typeof gtag === 'function') {
                gtag('event', 'exception', {
                    description: error.message,
                    fatal: false,
                    custom_map: {
                        error_boundary: context.boundaryName,
                        error_id: context.errorId,
                    },
                });
            }
        } catch (reportingError) {
            logger.error('Failed to report error:', reportingError);
        }
    };

    private resetErrorBoundary = () => {
        if (this.resetTimeoutId) {
            clearTimeout(this.resetTimeoutId);
        }

        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: null,
        });
    };

    private handleRetry = () => {
        logger.info('User initiated error boundary retry');
        this.resetErrorBoundary();
    };

    private handleReload = () => {
        logger.info('User initiated page reload from error boundary');
        window.location.reload();
    };

    private renderFallbackUI = () => {
        const { fallback } = this.props;
        const { error } = this.state;

        if (fallback) {
            return fallback;
        }

        if (error) {
            return (
                <ErrorFallback
                    error={error}
                    resetErrorBoundary={this.resetErrorBoundary}
                />
            );
        }

        // This should not be reached if hasError is true, but as a safeguard:
        return <div>An unknown error occurred.</div>;
    };

    render() {
        if (this.state.hasError) {
            return this.renderFallbackUI();
        }

        return this.props.children;
    }
}

export default ComprehensiveErrorBoundary;

// Convenience wrapper components for common use cases
export const ChatErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
    <ComprehensiveErrorBoundary name="Chat" isolate={false}>
        {children}
    </ComprehensiveErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode; name?: string }> = ({ 
    children, 
    name 
}) => (
    <ComprehensiveErrorBoundary name={name} isolate={true}>
        {children}
    </ComprehensiveErrorBoundary>
);

export const FeatureErrorBoundary: React.FC<{ children: ReactNode; feature: string }> = ({ 
    children, 
    feature 
}) => (
    <ComprehensiveErrorBoundary name={`${feature}Feature`} isolate={false}>
        {children}
    </ComprehensiveErrorBoundary>
);
