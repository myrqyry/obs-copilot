// src/store/commandPaletteStore.ts
import { create } from 'zustand';

export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  keywords: string[];
  action: () => void | Promise<void>;
  category: 'plugin' | 'obs' | 'navigation' | 'settings';
}

interface CommandPaletteState {
  isOpen: boolean;
  commands: Command[];
  setIsOpen: (isOpen: boolean) => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  isOpen: false,
  commands: [],
  setIsOpen: (isOpen) => set({ isOpen }),
  registerCommand: (command) =>
    set((state) => ({
      commands: [...state.commands.filter((c) => c.id !== command.id), command],
    })),
  unregisterCommand: (commandId) =>
    set((state) => ({
      commands: state.commands.filter((c) => c.id !== commandId),
    })),
}));
