import { create } from 'zustand';
import { ChatMessage } from '../types';
import { saveUserSettings } from '../utils/persistence';

export interface ChatState {
  geminiMessages: ChatMessage[];
  isGeminiClientInitialized: boolean;
  userDefinedContext: string[];
  actions: {
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    setGeminiClientInitialized: (initialized: boolean) => void;
    addToUserDefinedContext: (context: string) => void;
    removeFromUserDefinedContext: (context: string) => void;
    clearUserDefinedContext: () => void;
    addSystemMessageToChat: (contextText: string) => void;
    setGlobalErrorMessage: (message: string | null) => void;
    removeMessagesFrom: (startIndex: number) => void; // Add this new action
  };
  geminiInitializationError: string | null; // Keep this for general errors
}

export const useChatStore = create<ChatState>((set, get) => {
  const actions = {
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
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
    replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) =>
      set((state) => ({
        geminiMessages: state.geminiMessages.map((msg) =>
          msg.id === messageId ? { ...newMessage, id: messageId, timestamp: new Date() } : msg
        ),
      })),
    setGeminiClientInitialized: (initialized: boolean) => set({ isGeminiClientInitialized: initialized }),
    addToUserDefinedContext: (context: string) => {
      const updatedContext = [...get().userDefinedContext, context];
      set({ userDefinedContext: updatedContext });
      saveUserSettings({ userDefinedContext: updatedContext });
    },
    removeFromUserDefinedContext: (context: string) => {
      const updatedContext = get().userDefinedContext.filter((item) => item !== context);
      set({ userDefinedContext: updatedContext });
      saveUserSettings({ userDefinedContext: updatedContext });
    },
    clearUserDefinedContext: () => {
      set({ userDefinedContext: [] });
      saveUserSettings({ userDefinedContext: [] });
    },
    addSystemMessageToChat: (contextText: string) => {
      get().actions.addMessage({ role: 'system', text: contextText });
    },
    setGlobalErrorMessage: (message: string | null) => set({ geminiInitializationError: message }),
    removeMessagesFrom: (startIndex: number) =>
      set((state) => ({
        geminiMessages: state.geminiMessages.slice(0, startIndex),
      })),
  };

  return {
    geminiMessages: [],
    isGeminiClientInitialized: false,
    userDefinedContext: [],
    geminiInitializationError: null, // Keep for displaying general API errors
    actions,
  };
});
