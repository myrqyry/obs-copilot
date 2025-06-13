import React from 'react';
import { CatppuccinAccentColorName } from '../../types';

interface GeminiStatusPopupProps {
    status: 'initializing' | 'connected' | 'error' | 'unavailable' | 'missing-key';
    message: string;
    onClose?: () => void;
    accentColorName?: CatppuccinAccentColorName;
}

export const GeminiStatusPopup: React.FC<GeminiStatusPopupProps> = ({ status, message, onClose }) => {
    const statusColor = {
        initializing: 'var(--ctp-yellow)',
        connected: 'var(--ctp-green)',
        error: 'var(--ctp-red)',
        unavailable: 'var(--ctp-peach)',
        'missing-key': 'var(--ctp-mauve)',
    }[status];

    return (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
            <div
                className="px-5 py-3 rounded-xl shadow-xl border border-[var(--ctp-surface1)] bg-[var(--ctp-mantle)] flex items-center space-x-3 animate-modal-appear"
                style={{ color: statusColor, minWidth: 280, maxWidth: 400 }}
            >
                <span className="text-xl">
                    {status === 'connected' && '✅'}
                    {status === 'initializing' && '⏳'}
                    {status === 'error' && '❗'}
                    {status === 'unavailable' && '🚪'}
                    {status === 'missing-key' && '🔑'}
                </span>
                <span className="flex-1 text-sm" style={{ color: statusColor }}>{message}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-2 text-[var(--ctp-overlay1)] hover:text-[var(--ctp-text)] p-1 rounded-full hover:bg-[var(--ctp-surface0)] focus:outline-none"
                        aria-label="Close status popup"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
