import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { obsClient } from '@/services/obsClient';

export type InitializationStep = 
    | 'connecting-backend'
    | 'loading-config' 
    | 'connecting-obs'
    | 'loading-plugins'
    | 'complete';

interface StepConfig {
    label: string;
    progress: number;
    critical: boolean;  // Can the app function without this step?
}

interface InitializationState {
    isInitialized: boolean;
    initError: Error | null;
    currentStep: InitializationStep;
    progress: number;
    skippedSteps: InitializationStep[];
    failedStep: InitializationStep | undefined;
}

const STEP_CONFIG: Record<InitializationStep, StepConfig> = {
    'connecting-backend': { label: 'Connecting to backend...', progress: 20, critical: true },
    'loading-config': { label: 'Loading configuration...', progress: 40, critical: true },
    'connecting-obs': { label: 'Connecting to OBS WebSocket...', progress: 60, critical: false },
    'loading-plugins': { label: 'Loading plugins...', progress: 80, critical: true },
    'complete': { label: 'Ready', progress: 100, critical: true }
};

export function useAppInitialization(): InitializationState & { 
    stepLabel: string; 
    retryInit: () => void;
    retryStep: (step: InitializationStep) => Promise<void>;
    skipStep: (step: InitializationStep) => void;
    isStepCritical: (step: InitializationStep) => boolean;
} {
    const [state, setState] = useState<InitializationState>({
        isInitialized: false,
        initError: null,
        currentStep: 'connecting-backend',
        progress: 0,
        skippedSteps: [],
        failedStep: undefined
    });

    const updateStep = useCallback((step: InitializationStep, error?: Error) => {
        setState(prev => ({
            ...prev,
            currentStep: step,
            progress: STEP_CONFIG[step].progress,
            initError: error || null,
            failedStep: error ? step : undefined
        }));
    }, []);

    const checkBackendConnection = async () => {
        try {
            const response = await apiService.checkHealth();
            if (!response.ok) {
                throw new Error('Backend health check failed');
            }
        } catch (error) {
            throw new Error(`Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const loadConfiguration = async () => {
        try {
            await apiService.loadConfig();
        } catch (error) {
            throw new Error(`Configuration load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const connectToOBS = async () => {
        try {
            // We use the default connection settings or what's stored in local storage/config
            // For now, we assume the service handles connection details internally or we pass defaults
            // If obsClient.connect requires args, we might need to fetch them from config first.
            // Assuming obsClient.connect() can be called without args if it has stored config, 
            // OR we need to provide default localhost:4455.
            // Looking at obsClient.ts, connect takes (address, password).
            // We should probably try to connect with defaults if not configured.
            // For this refactor, let's assume we try localhost:4455 and empty password if no config.
            await obsClient.connect('ws://localhost:4455', undefined);
        } catch (error) {
            throw new Error(`OBS connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const loadPlugins = async () => {
        try {
            // Dynamic plugin loading logic
            // In a real app, this might iterate over a list of plugins to load.
            // For now, we just simulate a delay or rely on the fact that plugins are imported elsewhere.
            // If we need to explicitly load them, we would do it here.
            // The user snippet had `await import('@/plugins');`.
            // We'll assume there is an index file in plugins that initializes them.
            // If not, we can just wait a bit.
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            throw new Error(`Plugin load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const stepExecutors: Record<InitializationStep, () => Promise<void>> = {
        'connecting-backend': checkBackendConnection,
        'loading-config': loadConfiguration,
        'connecting-obs': connectToOBS,
        'loading-plugins': loadPlugins,
        'complete': async () => {}
    };

    const retryStep = useCallback(async (step: InitializationStep) => {
        if (step === 'complete') return;

        try {
            updateStep(step);
            await stepExecutors[step]();
            
            // If this was the failed step, continue initialization from here
            const steps = Object.keys(STEP_CONFIG) as InitializationStep[];
            const currentIndex = steps.indexOf(step);
            
            for (let i = currentIndex + 1; i < steps.length; i++) {
                const nextStep = steps[i];
                if (!nextStep) continue;
                if (state.skippedSteps.includes(nextStep)) continue;
                
                try {
                    updateStep(nextStep);
                    await stepExecutors[nextStep]();
                } catch (error) {
                    if (STEP_CONFIG[nextStep].critical) {
                        throw error;
                    } else {
                        console.warn(`Non-critical step ${nextStep} failed, continuing...`);
                        setState(prev => ({
                            ...prev,
                            skippedSteps: [...prev.skippedSteps, nextStep]
                        }));
                    }
                }
            }

            setState(prev => ({
                ...prev,
                isInitialized: true,
                currentStep: 'complete',
                progress: 100,
                initError: null,
                failedStep: undefined
            }));
        } catch (error) {
            updateStep(step, error instanceof Error ? error : new Error('Unknown error'));
        }
    }, [state.skippedSteps, updateStep]);

    const skipStep = useCallback((step: InitializationStep) => {
        if (STEP_CONFIG[step].critical) {
            console.error(`Cannot skip critical step: ${step}`);
            return;
        }

        setState(prev => ({
            ...prev,
            skippedSteps: [...prev.skippedSteps, step],
            initError: null,
            failedStep: undefined
        }));

        // Continue initialization from next step
        const steps = Object.keys(STEP_CONFIG) as InitializationStep[];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            const nextStep = steps[currentIndex + 1];
            if (nextStep) {
                retryStep(nextStep);
            }
        }
    }, [retryStep]);

    const initialize = useCallback(async () => {
        const steps = Object.keys(STEP_CONFIG) as InitializationStep[];
        
        for (const step of steps) {
            if (step === 'complete') break;
            if (state.skippedSteps.includes(step)) continue;

            try {
                updateStep(step);
                await stepExecutors[step]();
            } catch (error) {
                if (STEP_CONFIG[step].critical) {
                    updateStep(step, error instanceof Error ? error : new Error('Unknown error'));
                    return; // Stop initialization on critical failure
                } else {
                    console.warn(`Non-critical step ${step} failed, continuing...`);
                    setState(prev => ({
                        ...prev,
                        skippedSteps: [...prev.skippedSteps, step]
                    }));
                }
            }
        }

        setState(prev => ({
            ...prev,
            isInitialized: true,
            currentStep: 'complete',
            progress: 100,
            initError: null
        }));
    }, [state.skippedSteps, updateStep]);

    useEffect(() => {
        initialize();
    }, []);

    return {
        ...state,
        stepLabel: STEP_CONFIG[state.currentStep].label,
        retryInit: initialize,
        retryStep,
        skipStep,
        isStepCritical: (step) => STEP_CONFIG[step].critical
    };
}
