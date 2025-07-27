import React from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { GlobeAltIcon, CameraIcon } from '@heroicons/react/24/solid';
import Tooltip from '../ui/Tooltip';

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
    accentColorName?: string;
    chatInputRef: React.RefObject<HTMLInputElement>;
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
    accentColorName,
    chatInputRef,
}) => {
    return (
        <div className="p-3 border-t border-border bg-background rounded-b-lg">
            <div className="flex items-center space-x-2 relative">
                <div className="relative flex-grow">
                    <div className="flex items-center">
                        <input
                            ref={chatInputRef}
                            id="gemini-input"
                            type="text"
                            value={chatInputValue}
                            onChange={(e) => onChatInputChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isLoading && isGeminiClientInitialized && chatInputValue.trim()) {
                                    handleSend();
                                }
                            }}
                            className="w-full pl-14 pr-3 py-2 rounded-xl bg-[rgba(34,37,51,0.92)] border border-[rgba(80,80,120,0.25)] text-[var(--text-color)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200 shadow-lg backdrop-blur-md disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder={isLoading ? 'Waiting for Gemini...' : 'Type your message...'}
                            disabled={isLoading || !isGeminiClientInitialized}
                            autoComplete="off"
                            spellCheck={true}
                        />
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleSend}
                            disabled={isLoading || !chatInputValue.trim()}
                            className="ml-2 flex items-center justify-center"
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
                        </Button>
                    </div>
                </div>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-1">
                    <Tooltip content={useGoogleSearch ? "Web search enabled" : "Click to enable web search"}>
                        <button
                            onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                            disabled={!isGeminiClientInitialized}
                            className={`p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50 ${useGoogleSearch
                                ? 'text-primary bg-primary/10 hover:bg-primary/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                } ${!isGeminiClientInitialized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            aria-label={useGoogleSearch ? "Disable web search" : "Enable web search"}
                            aria-pressed={useGoogleSearch}
                        >
                            <GlobeAltIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content={isConnected && currentProgramScene ? "Take screenshot of current scene" : "Connect to OBS to take screenshots"}>
                        <button
                            onClick={onScreenshot}
                            disabled={!isGeminiClientInitialized || !isConnected || !currentProgramScene}
                            className={`p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500/50 ${isConnected && currentProgramScene
                                ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10'
                                : 'text-muted-foreground cursor-not-allowed opacity-50'
                                }`}
                            aria-label="Take screenshot of current scene"
                        >
                            <CameraIcon className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};
