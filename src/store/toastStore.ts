import { create } from 'zustand';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface ToastState {
    toasts: Toast[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    removeToast: (id: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message, type) => {
        const newToast = { id: Date.now(), message, type };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== newToast.id) }));
        }, 3000);
    },
    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    },
}));
