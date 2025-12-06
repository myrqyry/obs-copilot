import { useEffect, useRef } from 'react';
import useConnectionsStore from '@/app/store/connections';
import { loadConnectionSettings } from '@/shared/utils/persistence';

export const useAutoConnect = () => {
    const connectToObs = useConnectionsStore(state => state.connectToObs);
    const disconnectFromObs = useConnectionsStore(state => state.disconnectFromObs);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        const savedSettings = loadConnectionSettings();

        if (savedSettings.autoConnect && savedSettings.obsUrl) {
            connectToObs(savedSettings.obsUrl, savedSettings.obsPassword);
        }

        return () => {
            isMountedRef.current = false;
            disconnectFromObs().catch(err => {
                if (isMountedRef.current) {
                    console.error('Cleanup error:', err);
                }
            });
        };
    }, [connectToObs, disconnectFromObs]);
};
