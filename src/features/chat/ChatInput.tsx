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
    return (
        <form
            className="flex items-end gap-3 w-full"
            onSubmit={handleSubmit}
            autoComplete="off"
        >
            <div className="flex-1 flex flex-col gap-2">
                <Input
                    ref={chatInputRef}
                    value={chatInputValue}
                    onChange={(e) => onChatInputChange(e.target.value)}
                    placeholder={isConnected ? 'Type your message...' : 'Connect to start chatting'}
                    disabled={isLoading || !isConnected}
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-background/90 border border-border focus:ring-2 focus:ring-accent/60 shadow-inner transition"
                />
                <div className="flex gap-2 items-center">
                    {onScreenshot && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onScreenshot}
                            className="text-muted-foreground hover:text-accent rounded-full"
                            tabIndex={-1}
                        >
                            <CameraIcon className="w-5 h-5" />
                        </Button>
                    )}
                    {onAudio && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onAudio}
                            className="text-muted-foreground hover:text-accent rounded-full"
                            tabIndex={-1}
                        >
                            <MicIcon className="w-5 h-5" />
                        </Button>
                    )}
                    {onImageSelect && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onImageSelect}
                            className="text-muted-foreground hover:text-accent rounded-full"
                            tabIndex={-1}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
            <Button
                type="submit"
                disabled={isLoading || !isConnected || !chatInputValue.trim()}
                className="ml-2 px-5 py-2 rounded-xl bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 focus:ring-2 focus:ring-accent/60 transition"
            >
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
            </Button>
        </form>
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
