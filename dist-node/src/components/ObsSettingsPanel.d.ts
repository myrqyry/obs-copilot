import React from 'react';
import { CatppuccinAccentColorName, CatppuccinSecondaryAccentColorName, CatppuccinChatBubbleColorName } from '../types';
interface ObsSettingsPanelActions {
    setThemeColor: (themeKey: 'accent' | 'secondaryAccent' | 'userChatBubble' | 'modelChatBubble', colorName: string) => void;
    toggleFlipSides: () => void;
    toggleAutoApplySuggestions: () => void;
    toggleExtraDarkMode: () => void;
    setCustomChatBackground: (url: string) => void;
    resetSettings?: () => void;
}
interface ObsSettingsPanelProps {
    selectedAccentColorName: CatppuccinAccentColorName;
    selectedSecondaryAccentColorName: CatppuccinSecondaryAccentColorName;
    selectedUserChatBubbleColorName: CatppuccinChatBubbleColorName;
    selectedModelChatBubbleColorName: CatppuccinChatBubbleColorName;
    flipSides: boolean;
    actions: ObsSettingsPanelActions;
}
export declare const ObsSettingsPanel: React.FC<ObsSettingsPanelProps>;
export {};
