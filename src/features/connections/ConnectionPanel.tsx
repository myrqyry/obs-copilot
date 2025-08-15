// src/features/connections/ConnectionPanel.tsx
import React from 'react';
import { ConnectionForm } from './ConnectionForm';
import { useConnectionServices } from '@/components/ConnectionProvider'; // <-- IMPORT our new hook

export const ConnectionPanel: React.FC = () => {
    // Use the hook to get all the necessary state and functions from the provider
    const {
        handleObsConnect,
        handleStreamerBotConnect,
    } = useConnectionServices();

    // Note: We'll manage the input state directly in ConnectionForm for simplicity,
    // but the connection logic now comes from the context.

    return (
        <div className="space-y-1 max-w-4xl mx-auto">
            <ConnectionForm
                // Pass the connection handlers down to the form component
                onObsConnect={handleObsConnect}
                onStreamerBotConnect={handleStreamerBotConnect}
            />
        </div>
    );
};