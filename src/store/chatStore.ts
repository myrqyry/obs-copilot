import { create } from 'zustand';
import { ChatMessage } from '../types';
import { saveUserSettings } from '../utils/persistence';

export interface ChatState {
  geminiMessages: ChatMessage[];
  userDefinedContext: string[];
  actions: {
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    addToUserDefinedContext: (context: string) => void;
    removeFromUserDefinedContext: (context: string) => void;
    clearUserDefinedContext: () => void;
    addSystemMessageToChat: (contextText: string) => void;
    setGlobalErrorMessage: (message: string | null) => void;
  };
  geminiInitializationError: string | null; // Keep this for general errors
}

export const useChatStore = create<ChatState>((set, get) => ({
  geminiMessages: [],
  userDefinedContext: [],
  geminiInitializationError: null, // Keep for displaying general API errors
  actions: {
    addMessage: (message) =>
      set((state) => ({
        geminiMessages: [
          ...state.geminiMessages,
          {
            ...message,
            id: Date.now().toString() + Math.random(),
            timestamp: new Date(),
          },
        ],
      })),
    replaceMessage: (messageId, newMessage) =>
      set((state) => ({
        geminiMessages: state.geminiMessages.map((msg) =>
          msg.id === messageId ? { ...newMessage, id: messageId, timestamp: new Date() } : msg,
        ),
      })),
    addToUserDefinedContext: (context) => {
      const updatedContext = [...get().userDefinedContext, context];
      set({ userDefinedContext: updatedContext });
      saveUserSettings({ userDefinedContext: updatedContext });
    },
    removeFromUserDefinedContext: (context) => {
      const updatedContext = get().userDefinedContext.filter((item) => item !== context);
      set({ userDefinedContext: updatedContext });
      saveUserSettings({ userDefinedContext: updatedContext });
    },
    clearUserDefinedContext: () => {
      set({ userDefinedContext: [] });
      saveUserSettings({ userDefinedContext: [] });
    },
    addSystemMessageToChat: (contextText) => {
      get().actions.addMessage({ role: 'system', text: contextText });
    },
    setGlobalErrorMessage: (message) => set({ geminiInitializationError: message }),
  },
}));
