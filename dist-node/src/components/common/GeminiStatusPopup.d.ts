import React from 'react';
import { CatppuccinAccentColorName } from '../../types';
interface GeminiStatusPopupProps {
    status: 'initializing' | 'connected' | 'error' | 'unavailable' | 'missing-key';
    message: string;
    onClose?: () => void;
    accentColorName?: CatppuccinAccentColorName;
}
export declare const GeminiStatusPopup: React.FC<GeminiStatusPopupProps>;
export {};
