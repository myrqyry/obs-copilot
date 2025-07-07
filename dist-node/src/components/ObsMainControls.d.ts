import React from 'react';
import { CatppuccinAccentColorName } from '../types';
import { OBSWebSocketService } from '../services/obsService';
interface ObsMainControlsProps {
    obsService: OBSWebSocketService;
    onRefreshData: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    accentColorName?: CatppuccinAccentColorName;
}
export declare const ObsMainControls: React.FC<ObsMainControlsProps>;
export {};
