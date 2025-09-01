import React, { useState } from 'react';
import { GlobeAltIcon, CameraIcon } from '@heroicons/react/24/solid';
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
                        <Tooltip content={useGoogleSearch ? "Web search enabled" : "Click to enable web search"}>
                            <PromptInputButton
                                onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                                disabled={!isGeminiClientInitialized}
                                className={`${useGoogleSearch
                                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                                aria-label={useGoogleSearch ? "Disable web search" : "Enable web search"}
                                aria-pressed={useGoogleSearch}
                            >
                                <GlobeAltIcon className="w-4 h-4" />
                            </PromptInputButton>
                        </Tooltip>
                        <Tooltip content={isConnected && currentProgramScene ? "Take screenshot of current scene" : "Connect to OBS to take screenshots"}>
                            <PromptInputButton
                                onClick={onScreenshot}
                                disabled={!isGeminiClientInitialized || !isConnected || !currentProgramScene}
                                className={`${isConnected && currentProgramScene
                                    ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10'
                                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                                    }`}
                                aria-label="Take screenshot of current scene"
                            >
                                <CameraIcon className="w-4 h-4" />
                            </PromptInputButton>
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
