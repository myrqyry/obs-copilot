// src/components/core/GlobalCommandHotkeys.tsx
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useCommandPaletteStore } from '@/store/commandPaletteStore';

// A component to register a single hotkey
const Hotkey: React.FC<{
  shortcut: string;
  action: () => void;
}> = ({ shortcut, action }) => {
  useHotkeys(shortcut, action);
  return null;
};

const GlobalCommandHotkeys: React.FC = () => {
  const { commands } = useCommandPaletteStore();

  return (
    <>
      {commands.map((command) =>
        command.shortcut ? (
          <Hotkey
            key={command.id}
            shortcut={command.shortcut}
            action={command.action}
          />
        ) : null,
      )}
    </>
  );
};

export default GlobalCommandHotkeys;
