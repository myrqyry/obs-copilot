import { useEffect } from 'react';
import { useConnectionsStore } from '@/store/connections';
import { toast } from 'sonner';

export const useConnectionNotifications = () => {
    useEffect(() => {
        const unsubscribe = useConnectionsStore.subscribe((state, prevState) => {
            // OBS connection changes
            if (state.obsStatus !== prevState.obsStatus) {
                switch (state.obsStatus) {
                    case 'connected':
                        toast.success('OBS Connected', {
                            description: 'Successfully connected to OBS WebSocket'
                        });
                        break;
                    case 'disconnected':
                        // Only show if previously connected (avoid initial disconnected spam)
                        if (prevState.obsStatus === 'connected') {
                            toast.warning('OBS Disconnected', {
                                description: 'Connection to OBS was lost'
                            });
                        }
                        break;
                    case 'error':
                        toast.error('OBS Connection Error', {
                            description: state.connectionError || 'Failed to connect to OBS'
                        });
                        break;
                }
            }

            // Backend connection changes
            if (state.backendStatus !== prevState.backendStatus) {
                switch (state.backendStatus) {
                    case 'connected':
                        if (prevState.backendStatus !== 'connected') {
                             toast.success('Backend API Connected');
                        }
                        break;
                    case 'disconnected':
                         if (prevState.backendStatus === 'connected') {
                            toast.warning('Backend API Disconnected');
                         }
                        break;
                    case 'error':
                         if (prevState.backendStatus !== 'error') {
                            toast.error('Backend API Error', {
                                description: state.backendError || 'Failed to reach backend'
                            });
                         }
                        break;
                }
            }
        });

        return () => unsubscribe();
    }, []);
};
