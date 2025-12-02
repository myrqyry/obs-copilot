import { useEffect } from 'react';
import { useHealthMonitor } from '@/store/healthMonitorStore';
import { toast } from 'sonner';

export const useConnectionNotifications = () => {
    const { services } = useHealthMonitor();

    useEffect(() => {
        const unsubscribe = useHealthMonitor.subscribe((state, prevState) => {
            // OBS connection changes
            if (state.services.obs.status !== prevState.services.obs.status) {
                switch (state.services.obs.status) {
                    case 'connected':
                        toast.success('OBS Connected', {
                            description: 'Successfully connected to OBS WebSocket'
                        });
                        break;
                    case 'disconnected':
                        // Only show if previously connected (avoid initial disconnected spam)
                        if (prevState.services.obs.status === 'connected') {
                            toast.warning('OBS Disconnected', {
                                description: 'Connection to OBS was lost'
                            });
                        }
                        break;
                    case 'error':
                        toast.error('OBS Connection Error', {
                            description: state.services.obs.error || 'Failed to connect to OBS'
                        });
                        break;
                }
            }

            // Backend connection changes
            if (state.services.backend.status !== prevState.services.backend.status) {
                switch (state.services.backend.status) {
                    case 'connected':
                        if (prevState.services.backend.status !== 'connected') {
                             toast.success('Backend API Connected');
                        }
                        break;
                    case 'disconnected':
                         if (prevState.services.backend.status === 'connected') {
                            toast.warning('Backend API Disconnected');
                         }
                        break;
                    case 'error':
                         if (prevState.services.backend.status !== 'error') {
                            toast.error('Backend API Error', {
                                description: state.services.backend.error || 'Failed to reach backend'
                            });
                         }
                        break;
                }
            }
        });

        return () => unsubscribe();
    }, []);
};
