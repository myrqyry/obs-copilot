import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

interface Props {
  children: ReactNode;
  pluginId?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class PluginErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Plugin Error [${this.props.pluginId}]:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <BugReportIcon style={{ fontSize: 48 }} />
          </div>
          <div className="max-w-md text-left border rounded-lg p-4 bg-background shadow-sm">
            <h3 className="font-medium text-destructive mb-1">Plugin Error</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {this.props.pluginId ? `The ${this.props.pluginId} plugin` : 'This component'} encountered an error.
            </p>
            {this.state.error && (
              <div className="p-2 bg-muted/50 rounded text-xs font-mono break-all opacity-80">
                {this.state.error.message}
              </div>
            )}
          </div>
          <Button onClick={this.handleRetry} variant="outline" className="gap-2">
            <RefreshIcon className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PluginErrorBoundary;
