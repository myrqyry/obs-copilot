import React, { useState } from 'react';
import { Globe, Camera } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { ZodError } from 'zod';
import { chatInputSchema } from '@/lib/validations';
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputButton,
    PromptInputSubmit,
    PromptInputTools,
    PromptInputToolbar,
} from '@/components/ai-elements/prompt-input';
import type { ChatStatus } from 'ai'; // Import ChatStatus from 'ai'
import { VoiceInput } from '@/components/ui/voice-input';

interface ChatInputProps {
    chatInputValue: string;
    onChatInputChange: (value: string) => void;
    isLoading: boolean;
    isGeminiClientInitialized: boolean;
    handleSend: () => void;
    useGoogleSearch: boolean;
    setUseGoogleSearch: (value: boolean) => void;
    isConnected: boolean;
    currentProgramScene: string | null;
    onScreenshot: () => void;
    onAudio: (audioBlob: Blob) => void;
    chatInputRef: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    chatInputValue,
    onChatInputChange,
    isLoading,
    isGeminiClientInitialized,
    handleSend,
    useGoogleSearch,
    setUseGoogleSearch,
    isConnected,
    currentProgramScene,
    onScreenshot,
    onAudio,
    chatInputRef,
}) => {
    const [error, setError] = useState<string | undefined>(undefined);

    const handleValidatedSend = () => {
        try {
            chatInputSchema.parse({ chatInputValue });
            setError(undefined);
            handleSend();
        } catch (err) {
            if (err instanceof ZodError) {
                setError(err.issues[0].message);
            }
        }
    };

    const chatStatus: ChatStatus | undefined = isLoading ? 'submitted' : undefined;

    return (
        <div className="p-3 border-t border-border bg-background rounded-b-lg">
            <PromptInput onSubmit={handleValidatedSend} className="!shadow-none !border-0 !rounded-none !bg-transparent">
                <PromptInputTextarea
                    ref={chatInputRef}
                    value={chatInputValue}
                    onChange={(e) => {
                        onChatInputChange(e.target.value);
                        if (error) setError(undefined);
                    }}
                    placeholder={isLoading ? 'Waiting for Gemini...' : 'Type your message...'}
                    disabled={isLoading || !isGeminiClientInitialized}
                    label="Type your message..."
                />
                <PromptInputToolbar className="!p-0 !pr-2">
                    <PromptInputTools>
                                                <Tooltip content={useGoogleSearch ? "Disable web search" : "Enable web search"}>
                            <PromptInputButton
                                onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                                disabled={!isGeminiClientInitialized}
                                className={`transition-all duration-200 ${useGoogleSearch 
                                    ? 'text-accent bg-accent/20 hover:bg-accent/30 border border-accent/40 shadow-glow-accent' 
                                    : 'text-muted-foreground hover:text-accent hover:bg-accent/10 border border-transparent'
                                }`}
                                aria-label={useGoogleSearch ? "Disable web search" : "Enable web search"}
                            >
                                <Globe className="w-4 h-4" />
                            </PromptInputButton>
                        </Tooltip>
                        <Tooltip content={isConnected && currentProgramScene ? "Take screenshot of current scene" : "Connect to OBS to take screenshots"}>
                            <PromptInputButton
                                onClick={onScreenshot}
                                disabled={!isGeminiClientInitialized || !isConnected || !currentProgramScene}
                                className={`transition-all duration-200 ${isConnected && currentProgramScene
                                    ? 'text-primary bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:text-primary-foreground hover:shadow-glow'
                                    : 'text-muted-foreground cursor-not-allowed opacity-50 border border-transparent'
                                    }`}
                                aria-label="Take screenshot of current scene"
                            >
                                <Camera className="w-4 h-4" />
                            </PromptInputButton>
                        </Tooltip>
                        <Tooltip content="Use voice input">
                            <VoiceInput onRecordStop={onAudio} />
                        </Tooltip>
                    </PromptInputTools>
                    <PromptInputSubmit
                        status={chatStatus}
                        disabled={isLoading || !isGeminiClientInitialized}
                        className="ml-auto"
                    >
                        Send
                    </PromptInputSubmit>
                </PromptInputToolbar>
            </PromptInput>
            {error && <p className="text-destructive text-xs mt-1 ml-14">{error}</p>}
        </div>
    );
};
