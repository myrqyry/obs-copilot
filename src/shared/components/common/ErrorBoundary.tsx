import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Add to uiStore for consistent notification/logging
    const { handleAppError } = require('@/lib/errorUtils');
    const { useUiStore } = require('@/store/uiStore');
    
    const errorMsg = handleAppError('ErrorBoundary', error, 'An unexpected error occurred in the application');
    useUiStore.getState().addError({
      message: errorMsg,
      source: 'ErrorBoundary',
      level: 'critical',
      details: {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    });
  }

  public render() {
    if (this.state.hasError) {
      // Enhanced fallback UI with error details and toast integration
      return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30 text-muted-foreground">
          <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-error">Application Error</h1>
            <p className="text-lg mb-4">An unexpected error occurred.</p>
            <div className="bg-muted/10 p-4 rounded mb-4 text-sm">
              <p className="font-medium mb-1">Error details logged. Check notifications for more info.</p>
              <p className="text-muted-foreground text-xs">This error has been reported to the system.</p>
            </div>
            <div className="space-y-2">
              <button
                className="w-full px-4 py-2 bg-primary text-foreground rounded hover:bg-primary transition-colors"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
              <button
                className="w-full px-4 py-2 border border-border text-muted-foreground rounded hover:bg-muted/10 transition-colors"
                onClick={() => {
                  this.setState({ hasError: false });
                  // Optionally clear uiStore errors
                  const { useUiStore } = require('@/store/uiStore');
                  useUiStore.getState().clearErrors?.();
                }}
              >
                Try to Continue
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;