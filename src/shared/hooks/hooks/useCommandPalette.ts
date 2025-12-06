// src/hooks/useCommandPalette.ts
import { useEffect, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useCommandPaletteStore, Command } from '@/store/commandPaletteStore';

// Hook to interact with the command palette state
export function useCommandPalette() {
  const { isOpen, setIsOpen, commands, registerCommand, unregisterCommand } =
    useCommandPaletteStore();

  // Register global shortcut to open the palette
  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault();
      setIsOpen(true);
    },
    [setIsOpen],
  );

  return {
    isOpen,
    setIsOpen,
    commands,
    registerCommand,
    unregisterCommand,
  };
}

// Hook for components to register a command and handle cleanup
export function useRegisterCommand(command: Command | Command[]) {
  const { registerCommand, unregisterCommand } = useCommandPaletteStore();

  useEffect(() => {
    const commandsArray = Array.isArray(command) ? command : [command];

    commandsArray.forEach((cmd) => {
      registerCommand(cmd);
    });

    // Cleanup function to unregister commands on unmount
    return () => {
      commandsArray.forEach((cmd) => {
        unregisterCommand(cmd.id);
      });
    };
  }, [command, registerCommand, unregisterCommand]);
}
