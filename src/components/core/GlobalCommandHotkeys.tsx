// src/components/core/GlobalCommandHotkeys.tsx
import React, { useEffect } from 'react';
import { useCommandPaletteStore } from '@/store/commandPaletteStore';

const GlobalCommandHotkeys: React.FC = () => {
  const { commands } = useCommandPaletteStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, metaKey, ctrlKey, shiftKey, altKey } = event;
      const lowerKey = key.toLowerCase();

      // Find a command that matches the current key combination
      const matchedCommand = commands.find((command) => {
        if (!command.shortcut) return false;

        const shortcutParts = command.shortcut.toLowerCase().split('+');
        const shortcutKey = shortcutParts.pop();

        if (shortcutKey !== lowerKey) return false;

        const modKeys = {
          mod: metaKey || ctrlKey,
          shift: shiftKey,
          alt: altKey,
        };

        return shortcutParts.every((part) => modKeys[part]);
      });

      if (matchedCommand) {
        event.preventDefault();
        matchedCommand.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [commands]);

  return null; // This component does not render anything
};

export default GlobalCommandHotkeys;
