import React, { useState, useRef } from 'react';
import { Paperclip } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ZodError } from 'zod';
import { chatInputSchema } from '@/shared/lib/validations';
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputButton,
    PromptInputSubmit,
    PromptInputTools,
    PromptInputToolbar,
} from '@/shared/components/ai-elements/prompt-input';
// Local ChatStatus type to avoid depending on external 'ai' types at runtime
type ChatStatus = 'submitted' | 'streaming' | 'error' | undefined;
import { VoiceInput } from '@/shared/components/ui/voice-input';

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
    onImageSelect?: (file: File, base64: string) => void;
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
    onImageSelect,
    chatInputRef,
}) => {
    const [error, setError] = useState<string | undefined>(undefined);
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
                        {/* Attachments popover: groups screenshot, upload image, record audio, and web-search toggle */}
                        <PopoverPrimitive.Root open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
                            <PopoverPrimitive.Trigger asChild>
                                <PromptInputButton
                                    onClick={() => setAttachmentsOpen((v) => !v)}
                                    disabled={!isGeminiClientInitialized}
                                    aria-label="Attachments"
                                    className="transition-all duration-200 text-muted-foreground hover:text-accent hover:bg-accent/10"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </PromptInputButton>
                            </PopoverPrimitive.Trigger>
                            <PopoverPrimitive.Content sideOffset={6} align="start" className="w-56 p-2 bg-popover rounded-md shadow-md">
                                <div className="flex flex-col gap-1">
                                    <button
                                        className={`w-full text-left px-2 py-1.5 rounded hover:bg-accent/10 ${(!isConnected || !currentProgramScene) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        onClick={() => { if (isConnected && currentProgramScene) { onScreenshot(); setAttachmentsOpen(false); } }}
                                        disabled={!isConnected || !currentProgramScene}
                                    >
                                        📸 Take screenshot
                                    </button>
                                    <button
                                        className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/10"
                                        onClick={() => {
                                            fileInputRef.current?.click();
                                        }}
                                    >
                                        🖼️ Upload image
                                    </button>
                                    <div className="px-2 py-1.5">
                                        <VoiceInput onRecordStop={(blob) => { onAudio(blob); setAttachmentsOpen(false); }} />
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-1.5">
                                        <div className="text-sm">Use web search</div>
                                        <input
                                            type="checkbox"
                                            checked={useGoogleSearch}
                                            onChange={() => setUseGoogleSearch(!useGoogleSearch)}
                                            aria-label="Toggle web search"
                                        />
                                    </div>
                                </div>
                                {/* hidden file input for image upload */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            const result = reader.result as string;
                                            const base64 = result.split(',')[1] || '';
                                            // call optional prop handler
                                            if (typeof (onAudio) === 'function') {
                                                // noop for audio
                                            }
                                            // If parent provided an onImageSelect prop, call it
                                            // @ts-ignore - optional prop exists in runtime when provided
                                            if (typeof (onImageSelect as any) === 'function') {
                                                // @ts-ignore
                                                onImageSelect(file, base64);
                                            }
                                            setAttachmentsOpen(false);
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                            </PopoverPrimitive.Content>
                        </PopoverPrimitive.Root>
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
