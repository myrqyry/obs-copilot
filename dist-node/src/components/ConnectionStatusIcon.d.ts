import React from 'react';
interface ConnectionStatusIconProps {
    isConnected: boolean;
    isConnecting: boolean;
    error: boolean;
    onClick: () => void;
}
export declare const ConnectionStatusIcon: React.FC<ConnectionStatusIconProps>;
export {};
