import { create } from 'zustand';

interface SafeModeState {
  isOpen: boolean;
  actionDescription: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  showModal: (actionDescription: string, onConfirm: () => void, onCancel: () => void) => void;
  hideModal: () => void;
}

export const useSafeModeStore = create<SafeModeState>((set) => ({
  isOpen: false,
  actionDescription: '',
  onConfirm: null,
  onCancel: null,
  showModal: (actionDescription, onConfirm, onCancel) => set({
    isOpen: true,
    actionDescription,
    onConfirm,
    onCancel,
  }),
  hideModal: () => set({
    isOpen: false,
    actionDescription: '',
    onConfirm: null,
    onCancel: null,
  }),
}));
