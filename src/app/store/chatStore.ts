import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatMessage } from '@/shared/types';

export interface ChatState {
  geminiMessages: ChatMessage[];
  isGeminiClientInitialized: boolean;
  userDefinedContext: string[];
  actions: {
    addMessage: (message: Partial<ChatMessage>) => void;
    replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    setGeminiClientInitialized: (initialized: boolean) => void;
    addToUserDefinedContext: (context: string) => void;
    removeFromUserDefinedContext: (context: string) => void;
    clearUserDefinedContext: () => void;
    addSystemMessageToChat: (contextText: string) => void;
    setGlobalErrorMessage: (message: string | null) => void;
    removeMessagesFrom: (startIndex: number) => void;
    clearChat: () => void;
  };
  geminiInitializationError: string | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      const actions = {
        addMessage: (message: Partial<ChatMessage>) =>
          set((state) => ({
            geminiMessages: [
              ...state.geminiMessages,
              {
                role: 'user',
                text: '',
                ...message,
                id: message.id || Date.now().toString() + Math.random(),
                timestamp: message.timestamp || new Date(),
              } as ChatMessage,
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
        },
        removeFromUserDefinedContext: (context: string) => {
          const updatedContext = get().userDefinedContext.filter((item) => item !== context);
          set({ userDefinedContext: updatedContext });
        },
        clearUserDefinedContext: () => {
          set({ userDefinedContext: [] });
        },
        addSystemMessageToChat: (contextText: string) => {
          get().actions.addMessage({ role: 'system', text: contextText });
        },
        setGlobalErrorMessage: (message: string | null) => set({ geminiInitializationError: message }),
        removeMessagesFrom: (startIndex: number) =>
          set((state) => ({
            geminiMessages: state.geminiMessages.slice(0, startIndex),
          })),
        clearChat: () => set({ geminiMessages: [] }),
      };

      return {
        geminiMessages: [],
        isGeminiClientInitialized: false,
        userDefinedContext: [],
        geminiInitializationError: null,
        actions,
      };
    },
    {
      name: 'gemini-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        geminiMessages: state.geminiMessages,
        userDefinedContext: state.userDefinedContext,
      }),
    }
  )
);

export default useChatStore;
