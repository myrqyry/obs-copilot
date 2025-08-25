import React, { useState } from 'react';
import { GeminiChat } from './GeminiChat';
import { EnhancedGeminiChat } from './EnhancedGeminiChat';

interface ChatComparisonDemoProps {
    onRefreshData: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    onStreamerBotAction: (action: {
        type: string;
        args?: Record<string, unknown>;
    }) => Promise<void>;
}

export const ChatComparisonDemo: React.FC<ChatComparisonDemoProps> = ({
    onRefreshData,
    setErrorMessage,
    onStreamerBotAction,
}) => {
    const [activeTab, setActiveTab] = useState<'original' | 'enhanced'>('enhanced');
    const [chatInputValue, setChatInputValue] = useState('');
    const [enhancedChatInputValue, setEnhancedChatInputValue] = useState('');

    return (
        <div className="flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex border-b border-border bg-background">
                <button
                    onClick={() => setActiveTab('original')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'original'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Original Chat
                </button>
                <button
                    onClick={() => setActiveTab('enhanced')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'enhanced'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Enhanced Chat (AI Elements)
                </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1">
                {activeTab === 'original' ? (
                    <div className="h-full">
                        <div className="p-2 bg-muted/50 text-xs text-muted-foreground">
                            <strong>Original Implementation:</strong> Uses custom components with basic styling and functionality.
                        </div>
                        <GeminiChat
                            onRefreshData={onRefreshData}
                            setErrorMessage={setErrorMessage}
                            chatInputValue={chatInputValue}
                            onChatInputChange={setChatInputValue}
                            onStreamerBotAction={onStreamerBotAction}
                        />
                    </div>
                ) : (
                    <div className="h-full">
                        <div className="p-2 bg-primary/10 text-xs text-primary">
                            <strong>Enhanced Implementation:</strong> Uses AI Elements with improved components, better code blocks, and enhanced UX.
                        </div>
                        <EnhancedGeminiChat
                            onRefreshData={onRefreshData}
                            setErrorMessage={setErrorMessage}
                            chatInputValue={enhancedChatInputValue}
                            onChatInputChange={setEnhancedChatInputValue}
                            onStreamerBotAction={onStreamerBotAction}
                        />
                    </div>
                )}
            </div>

            {/* Feature Comparison */}
            <div className="p-4 bg-muted/20 border-t border-border">
                <h3 className="text-sm font-semibold mb-2">AI Elements Benefits:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                        <h4 className="font-medium text-green-600 mb-1">✅ Enhanced Features:</h4>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• Better code block syntax highlighting</li>
                            <li>• Improved message structure with AI Elements</li>
                            <li>• Enhanced input component with toolbar</li>
                            <li>• Better loading states with Loader component</li>
                            <li>• More accessible components</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-blue-600 mb-1">🔄 Easy Integration:</h4>
                        <ul className="space-y-1 text-muted-foreground">
                            <li>• Drop-in replacements for existing components</li>
                            <li>• Maintains all existing functionality</li>
                            <li>• Uses same props and interfaces</li>
                            <li>• Compatible with existing styling system</li>
                            <li>• Ready for future AI Elements updates</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatComparisonDemo;
