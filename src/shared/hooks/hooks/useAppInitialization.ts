import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { obsClient } from '@/services/obsClient';
import { initializePlugins } from '@/plugins'; // Import the initializer

export type InitializationStep = 
    | 'connecting-backend'
    | 'loading-config' 
    | 'connecting-obs'
    | 'loading-plugins'
    | 'complete';

interface StepConfig {
    label: string;
    progress: number;
    critical: boolean;
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
    'loading-plugins': { label: 'Loading plugins...', progress: 60, critical: true },
    'connecting-obs': { label: 'Connecting to OBS WebSocket...', progress: 80, critical: false },
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
            await obsClient.connect('ws://localhost:4455', undefined);
        } catch (error) {
            throw new Error(`OBS connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const loadPlugins = async () => {
        try {
            await initializePlugins();
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
                console.log(`INIT: Starting step: ${step}`);
                await stepExecutors[step]();
                console.log(`INIT: Finished step: ${step}`);
            } catch (error) {
                if (STEP_CONFIG[step].critical) {
                    console.error(`INIT: Critical step ${step} failed`, error);
                    updateStep(step, error instanceof Error ? error : new Error('Unknown error'));
                    return;
                } else {
                    console.warn(`INIT: Non-critical step ${step} failed, continuing...`);
                    setState(prev => ({
                        ...prev,
                        skippedSteps: [...prev.skippedSteps, step]
                    }));
                }
            }
        }

        console.log('INIT: All steps complete. Setting isInitialized to true.');
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
