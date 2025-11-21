import { useEffect, useState, useRef } from 'react';
import useConnectionsStore from '@/store/connections';
import { loadConnectionSettings } from '@/utils/persistence';

export const useAppInitialization = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);
    const connectToObs = useConnectionsStore(state => state.connectToObs);
    const disconnectFromObs = useConnectionsStore(state => state.disconnectFromObs);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const initialize = async () => {
            try {
                // Load persisted settings
                const savedSettings = loadConnectionSettings();

                // Auto-connect if configured
                if (savedSettings.autoConnect && savedSettings.obsUrl) {
                    await connectToObs(savedSettings.obsUrl, savedSettings.obsPassword);
                }

                if (isMountedRef.current) {
                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('App initialization failed:', error);
                if (isMountedRef.current) {
                    setInitError(error as Error);
                    setIsInitialized(true); // Still mark as initialized to show error UI
                }
            }
        };

        initialize();

        return () => {
            isMountedRef.current = false;
            disconnectFromObs().catch(err => {
                console.error('Cleanup error:', err);
            });
        };
    }, [connectToObs, disconnectFromObs]);

    return { isInitialized, initError };
};
