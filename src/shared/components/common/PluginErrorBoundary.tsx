// src/components/common/PluginErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  pluginName: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

export class PluginErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Plugin "${this.props.pluginName}" crashed:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
    this.setState(prev => ({ error, errorCount: prev.errorCount + 1 }));
    toast.error(`Plugin "${this.props.pluginName}" encountered an error`);

    if ((this.state?.errorCount ?? 0) >= 3) {
      // Provide a non-fatal log/telemetry event; optional hook into monitoring
      if ((window as any)?.gtag) {
        (window as any).gtag('event', 'exception', {
          description: `Plugin ${this.props.pluginName} disabled after repeated crashes`,
          fatal: false,
        });
      }
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { errorCount } = this.state;
      if (errorCount > 3) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Plugin Disabled</h2>
            <p className="text-muted-foreground mb-4">
              The {this.props.pluginName} plugin has been disabled after repeated crashes.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Reload Application
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-warning text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Plugin Error</h2>
          <p className="text-muted-foreground mb-4">
            The {this.props.pluginName} plugin encountered an error and couldn't load.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              Reload App
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Attempt {errorCount} of 3 before disable</p>
        </div>
      );
    }

    return this.props.children;
  }
}
