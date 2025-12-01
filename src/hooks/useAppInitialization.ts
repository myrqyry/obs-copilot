import { useState, useEffect } from 'react';

export type InitializationStep = 
    | 'connecting-backend'
    | 'loading-config' 
    | 'connecting-obs'
    | 'loading-plugins'
    | 'complete';

interface InitializationState {
    isInitialized: boolean;
    initError: Error | null;
    currentStep: InitializationStep;
    progress: number;
}

const STEP_LABELS: Record<InitializationStep, string> = {
    'connecting-backend': 'Connecting to backend...',
    'loading-config': 'Loading configuration...',
    'connecting-obs': 'Connecting to OBS WebSocket...',
    'loading-plugins': 'Loading plugins...',
    'complete': 'Ready'
};

const STEP_PROGRESS: Record<InitializationStep, number> = {
    'connecting-backend': 20,
    'loading-config': 40,
    'connecting-obs': 60,
    'loading-plugins': 80,
    'complete': 100
};

export function useAppInitialization(): InitializationState & { stepLabel: string; retryInit: () => void } {
    const [state, setState] = useState<InitializationState>({
        isInitialized: false,
        initError: null,
        currentStep: 'connecting-backend',
        progress: 0
    });

    // Mock functions for now - these would be replaced by actual service calls
    const checkBackendConnection = async () => new Promise(resolve => setTimeout(resolve, 500));
    const loadConfiguration = async () => new Promise(resolve => setTimeout(resolve, 500));
    const connectToOBS = async () => new Promise(resolve => setTimeout(resolve, 500));
    const loadPlugins = async () => new Promise(resolve => setTimeout(resolve, 500));

    const initialize = async () => {
        try {
            // Step 1: Connect to backend
            setState(prev => ({ 
                ...prev, 
                initError: null,
                currentStep: 'connecting-backend',
                progress: STEP_PROGRESS['connecting-backend']
            }));
            await checkBackendConnection();

            // Step 2: Load config
            setState(prev => ({ 
                ...prev, 
                currentStep: 'loading-config',
                progress: STEP_PROGRESS['loading-config']
            }));
            await loadConfiguration();

            // Step 3: Connect to OBS
            setState(prev => ({ 
                ...prev, 
                currentStep: 'connecting-obs',
                progress: STEP_PROGRESS['connecting-obs']
            }));
            await connectToOBS();

            // Step 4: Load plugins
            setState(prev => ({ 
                ...prev, 
                currentStep: 'loading-plugins',
                progress: STEP_PROGRESS['loading-plugins']
            }));
            await loadPlugins();

            // Complete
            setState({
                isInitialized: true,
                initError: null,
                currentStep: 'complete',
                progress: 100
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                isInitialized: false,
                initError: error instanceof Error ? error : new Error('Unknown initialization error')
            }));
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    return {
        ...state,
        stepLabel: STEP_LABELS[state.currentStep],
        retryInit: initialize
    };
}
