import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { GlobeAltIcon, CameraIcon } from '@heroicons/react/24/solid';
import { ZodError } from 'zod';
import { chatInputSchema } from '@/lib/validations';

// Import AI Elements components
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
    PromptInputButton,
    PromptInputSubmit
} from '@/components/ai-elements';

interface EnhancedChatInputProps {
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
    chatInputRef: React.RefObject<HTMLInputElement | null>;
}

export const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
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

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleValidatedSend();
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChatInputChange(e.target.value);
        if (error) setError(undefined);
    };

    return (
        <div className="p-3 border-t border-border bg-background rounded-b-lg">
            <div className="flex items-center space-x-2 relative">
                <div className="relative flex-grow">
                    <PromptInput onSubmit={handleFormSubmit} className="w-full">
                        <PromptInputTextarea
                            ref={chatInputRef as any}
                            value={chatInputValue}
                            onChange={handleTextareaChange}
                            placeholder={isLoading ? 'Waiting for Gemini...' : 'Type your message...'}
                            disabled={isLoading || !isGeminiClientInitialized}
                        />

                        <PromptInputToolbar>
                            <PromptInputTools>
                                <PromptInputButton
                                    onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                                    disabled={!isGeminiClientInitialized}
                                    title={useGoogleSearch ? "Web search enabled" : "Click to enable web search"}
                                >
                                    <GlobeAltIcon className="w-4 h-4" />
                                </PromptInputButton>

                                <PromptInputButton
                                    onClick={onScreenshot}
                                    disabled={!isGeminiClientInitialized || !isConnected || !currentProgramScene}
                                    title={isConnected && currentProgramScene ? "Take screenshot of current scene" : "Connect to OBS to take screenshots"}
                                >
                                    <CameraIcon className="w-4 h-4" />
                                </PromptInputButton>
                            </PromptInputTools>

                            <PromptInputSubmit
                                disabled={isLoading || !isGeminiClientInitialized}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-1">
                                        <LoadingSpinner size={3} />
                                        <span>Sending</span>
                                    </div>
                                ) : (
                                    <>
                                        <span role="img" aria-label="Send" className="mr-1">🚀</span>Send
                                    </>
                                )}
                            </PromptInputSubmit>
                        </PromptInputToolbar>
                    </PromptInput>
                </div>
                {error && <p className="text-destructive text-xs mt-1 ml-14">{error}</p>}
            </div>
        </div>
    );
};

export default EnhancedChatInput;
