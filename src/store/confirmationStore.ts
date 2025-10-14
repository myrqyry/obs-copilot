import { create } from 'zustand';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
  openDialog: (options: { title: string; description: string; onConfirm: () => void }) => void;
}

export const useConfirmationStore = create<ConfirmationState>((set) => ({
  isOpen: false,
  title: '',
  description: '',
  onConfirm: () => {},
  onClose: () => set({ isOpen: false }),
  openDialog: ({ title, description, onConfirm }) => {
    set({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        set({ isOpen: false });
      },
    });
  },
}));
