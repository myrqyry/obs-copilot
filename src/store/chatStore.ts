import { create } from 'zustand';
import { ChatMessage } from '../types';
import { saveUserSettings } from '../utils/persistence';

export interface ChatState {
    geminiMessages: ChatMessage[];
    geminiApiKey: string;
    isGeminiClientInitialized: boolean;
    geminiInitializationError: string | null;
    userDefinedContext: string[];
    actions: {
        addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
        replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
        setGeminiApiKey: (key: string) => void;
        setGeminiClientInitialized: (initialized: boolean) => void;
        setGeminiInitializationError: (error: string | null) => void;
        addToUserDefinedContext: (context: string) => void;
        removeFromUserDefinedContext: (context: string) => void;
        clearUserDefinedContext: () => void;
        onSendToGeminiContext: (contextText: string) => void;
    };
}

export const useChatStore = create<ChatState>((set, get) => ({
    geminiMessages: [],
    geminiApiKey: '',
    isGeminiClientInitialized: false,
    geminiInitializationError: null,
    userDefinedContext: [],
    actions: {
        addMessage: (message) => set((state) => ({
            geminiMessages: [...state.geminiMessages, {
                ...message,
                id: Date.now().toString() + Math.random(),
                timestamp: new Date()
            }]
        })),
        replaceMessage: (messageId, newMessage) => set((state) => ({
            geminiMessages: state.geminiMessages.map(msg =>
                msg.id === messageId
                    ? { ...newMessage, id: messageId, timestamp: new Date() }
                    : msg
            )
        })),
        setGeminiApiKey: (key) => {
            const newKey = key || import.meta.env.VITE_GEMINI_API_KEY || '';
            set({ geminiApiKey: newKey });
            if (key) {
                saveUserSettings({ geminiApiKey: key });
            }
        },
        setGeminiClientInitialized: (initialized) => set({ isGeminiClientInitialized: initialized }),
        setGeminiInitializationError: (error) => set({ geminiInitializationError: error }),
        addToUserDefinedContext: (context) => {
            const updatedContext = [...get().userDefinedContext, context];
            set({ userDefinedContext: updatedContext });
            saveUserSettings({ userDefinedContext: updatedContext });
        },
        removeFromUserDefinedContext: (context) => {
            const updatedContext = get().userDefinedContext.filter(item => item !== context);
            set({ userDefinedContext: updatedContext });
            saveUserSettings({ userDefinedContext: updatedContext });
        },
        clearUserDefinedContext: () => {
            set({ userDefinedContext: [] });
            saveUserSettings({ userDefinedContext: [] });
        },
        onSendToGeminiContext: (contextText) => {
            get().actions.addMessage({ role: 'system', text: contextText });
        },
    }
}));
