import { useEffect } from 'react';
import { useAppLayout } from './useAppLayout';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    action: () => void;
    description: string;
}

export const useKeyboardShortcuts = () => {
    const { setActiveTab } = useAppLayout();

    const shortcuts: ShortcutConfig[] = [
        {
            key: ',',
            meta: true, // Cmd on Mac, Ctrl on Windows (usually meta is Command, ctrl is Ctrl)
            // We'll accept ctrl or meta for "primary modifier" behavior if we want cross-platform genericism,
            // but here we'll be specific as per request or stick to standard.
            // User example used meta: true for settings.
            action: () => setActiveTab('settings'),
            description: 'Open Settings'
        },
        {
            key: 'k',
            meta: true,
            action: () => {
                // Placeholder for command palette
                console.log('Command palette - Not implemented');
            },
            description: 'Open Command Palette'
        },
        {
            key: '1',
            meta: true,
            action: () => setActiveTab('dashboard'),
            description: 'Go to Dashboard'
        },
        {
            key: '2',
            meta: true,
            action: () => setActiveTab('obs-control'),
            description: 'Go to OBS Control'
        },
        {
            key: '3',
            meta: true,
            action: () => setActiveTab('twitch-chat'),
            description: 'Go to Chat'
        }
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if in input/textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            const matchedShortcut = shortcuts.find(shortcut => {
                const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = !!e.ctrlKey === (shortcut.ctrl || false);
                const shiftMatch = !!e.shiftKey === (shortcut.shift || false);
                const altMatch = !!e.altKey === (shortcut.alt || false);
                const metaMatch = !!e.metaKey === (shortcut.meta || false);

                return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
            });

            if (matchedShortcut) {
                e.preventDefault();
                matchedShortcut.action();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, setActiveTab]);

    return { shortcuts };
};
