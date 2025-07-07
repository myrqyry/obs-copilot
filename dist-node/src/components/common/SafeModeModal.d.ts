import React from "react";
import type { CatppuccinAccentColorName } from "../../types";
interface SafeModeModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    actionDescription: string;
    accentColorName?: CatppuccinAccentColorName;
}
export declare const SafeModeModal: React.FC<SafeModeModalProps>;
export {};
