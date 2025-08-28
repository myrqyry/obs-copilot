import React from 'react';
import { ConnectionForm } from '@/features/connections/ConnectionForm';
import { ObsMainControls } from '@/features/connections/ObsMainControls';
import useConnectionsStore from '@/store/connectionsStore';
import { useConnectionServices } from '@/hooks/useConnectionServices';

const ConnectionPanel: React.FC = () => {
    const { isConnected: isObsConnected } = useConnectionsStore();
    const { handleObsConnect, handleStreamerBotConnect } = useConnectionServices();

    return (
        <div className="p-2 sm:p-4">
            {!isObsConnected ? (
                <ConnectionForm 
                    onObsConnect={handleObsConnect}
                    onStreamerBotConnect={handleStreamerBotConnect} 
                />
            ) : (
                <ObsMainControls />
            )}
        </div>
    );
};

export default ConnectionPanel;