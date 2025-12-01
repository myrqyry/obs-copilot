import React from 'react';
import { Button } from '@/components/ui';

interface AppInitializerProps {
    isInitialized: boolean;
    error: Error | null;
    onRetry?: () => void;
    children: React.ReactNode;
    stepLabel?: string;
    progress?: number;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ 
    isInitialized, 
    error, 
    onRetry,
    children,
    stepLabel = 'Initializing...',
    progress = 0
}) => {
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-card">
                <div className="text-center max-w-md px-4">
                    <div className="mb-4">
                        <svg 
                            className="w-16 h-16 mx-auto text-destructive" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                            />
                        </svg>
                    </div>
                    <p className="text-lg font-semibold text-destructive">Initialization Failed</p>
                    <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
                    {onRetry && (
                        <Button 
                            onClick={onRetry} 
                            className="mt-4"
                            variant="outline"
                        >
                            Retry Connection
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (!isInitialized) {
        return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50" role="alert" aria-busy="true">
            <div className="w-full max-w-md p-6 space-y-6 text-center">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">OBS Copilot</h1>
                    <p className="text-muted-foreground" role="status" aria-live="polite">
                        {stepLabel || 'Initializing...'}
                    </p>
                </div>

                <div 
                    className="w-full h-2 bg-secondary rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Initialization progress"
                >
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                
                <p className="text-xs text-muted-foreground/50">
                    v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
                </p>
            </div>
        </div>
    );
    }

    return <>{children}</>;
};
