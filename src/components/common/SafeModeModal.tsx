import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import type { CatppuccinAccentColorName } from "../../types";

interface SafeModeModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    actionDescription: string;
    accentColorName?: CatppuccinAccentColorName;
}

export const SafeModeModal: React.FC<SafeModeModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    actionDescription,
    accentColorName,
}) => (
    <Modal
        isOpen={isOpen}
        onClose={onCancel}
        title="🛡️ Safe Mode Confirmation"
        accentColorName={accentColorName}
        size="sm"
    >
        <div className="py-2">
            <div className="mb-4 text-base text-foreground">
                Gemini wants to do the following:
                <div className="mt-2 p-2 rounded bg-muted border border-border text-primary font-semibold">
                    {actionDescription}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" accentColorName={accentColorName} onClick={onConfirm}>
                    Allow
                </Button>
            </div>
        </div>
    </Modal>
);
