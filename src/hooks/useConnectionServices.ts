// src/hooks/useConnectionServices.ts
import { useContext } from 'react';
import { ConnectionContext } from '@/components/ConnectionProvider';

export const useConnectionServices = () => {
    const context = useContext(ConnectionContext);
    if (context === undefined) {
        throw new Error('useConnectionServices must be used within a ConnectionProvider');
    }
    return context;
};
