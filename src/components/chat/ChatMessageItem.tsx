import React, { useRef, useState, useLayoutEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { CatppuccinAccentColorName, ChatMessage as BaseChatMessage, OBSSource } from '../../types';

interface ChatMessage extends BaseChatMessage {
    type?: "source-prompt";
    sourcePrompt?: string;
}

interface ChatMessageItemProps {
    message: ChatMessage;
    onSuggestionClick?: (prompt: string) => void;
    accentColorName?: CatppuccinAccentColorName;
    obsSources?: OBSSource[];
    onSourceSelect?: (sourceName: string) => void;
    flipSides: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
    message,
    flipSides
}) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [isShrunk, setIsShrunk] = useState(false);
    const [forceExpand, setForceExpand] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const bubbleRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (itemRef.current) {
            gsap.fromTo(
                itemRef.current,
                { opacity: 0, y: 15, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
            );
            // Shrink logic: if height > 320px, shrink (unless forceExpand)
            if (!forceExpand && itemRef.current.scrollHeight > 320) {
                setIsShrunk(true);
            } else {
                setIsShrunk(false);
            }
        }
    }, [message.text, forceExpand]);

    function handleBubbleScroll(event: React.UIEvent<HTMLDivElement>) {
        const target = event.target as HTMLDivElement;
        setIsScrolling(true);
        setIsScrolledFromTop(target.scrollTop > 10);

        // Check if scrolled to bottom (within 5px tolerance)
        const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 5;
        setIsScrolledToBottom(isAtBottom);

        clearTimeout((handleBubbleScroll as any)._scrollTimeout);
        (handleBubbleScroll as any)._scrollTimeout = setTimeout(() => setIsScrolling(false), 1000);
    }

    return (
        <div
            ref={itemRef}
            className={`flex ${(message.role === 'user' && !flipSides) || (message.role === 'model' && flipSides)
                ? 'justify-end'
                : (message.role === 'model' && !flipSides) || (message.role === 'user' && flipSides)
                    ? 'justify-start'
                    : 'justify-center'
                }`}
        >
            <div
                className={`chat-message max-w-xl rounded-2xl shadow-xl border border-[var(--ctp-surface2)] bg-[var(--ctp-surface0)] relative
          ${message.role === 'system'
                        ? 'px-4 py-2 text-xs font-extrabold leading-tight'
                        : 'p-4 leading-relaxed'}
        `}
                style={{
                    backgroundColor: message.role === 'user' ? 'var(--user-chat-bubble-color)' :
                        message.role === 'model' ? 'var(--model-chat-bubble-color)' :
                            'var(--dynamic-secondary-accent)',
                    color: 'var(--ctp-base)',
                    fontStyle: message.role === 'system' ? 'italic' : 'normal',
                    fontSize: message.role === 'system' ? '0.85rem' : '1rem',
                    position: 'relative',
                    ['--bubble-scrollbar-thumb' as any]: message.role === 'user'
                        ? 'var(--user-chat-bubble-color)'
                        : message.role === 'model'
                            ? 'var(--model-chat-bubble-color)'
                            : 'var(--dynamic-secondary-accent)',
                    ['--bubble-scrollbar-thumb-hover' as any]: message.role === 'user'
                        ? 'var(--ctp-blue)'
                        : message.role === 'model'
                            ? 'var(--ctp-lavender)'
                            : 'var(--dynamic-secondary-accent)',
                    ['--bubble-fade-color' as any]: message.role === 'user'
                        ? 'var(--user-chat-bubble-color)'
                        : message.role === 'model'
                            ? 'var(--model-chat-bubble-color)'
                            : 'var(--dynamic-secondary-accent)'
                }}
            >
                <div style={{ position: 'relative' }}>
                    <div
                        ref={bubbleRef}
                        className={`chat-scrollable-content
              ${isShrunk ? 'max-h-80 overflow-y-auto custom-scrollbar shrunk' : ''}
              ${isScrolling ? 'scrolling' : ''}
            `}
                        onScroll={isShrunk ? handleBubbleScroll : undefined}
                    >
                        <MarkdownRenderer content={message.text} />
                    </div>

                    {isShrunk && isScrolledFromTop && (
                        <div className="bubble-fade-top" />
                    )}

                    {isShrunk && !isScrolledToBottom && (
                        <div className={`bubble-fade-bottom ${isScrolling ? 'opacity-30' : 'opacity-100'}`} />
                    )}
                </div>

                {/* Timestamp outside of scrollable area */}
                <div className="text-xs mt-1.5 text-[var(--ctp-crust)] text-opacity-90 relative z-20">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Expand/collapse floating icon button (bottom right, more visible) */}
                {isShrunk && !forceExpand && (
                    <button
                        className="absolute right-3 bottom-3 z-40 bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--dynamic-accent)] hover:text-[var(--ctp-mauve)] p-2.5 rounded-full shadow-2xl border-2 border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--ctp-mauve)]"
                        style={{ fontSize: '1.7rem', lineHeight: 1, boxShadow: '0 6px 24px 0 rgba(0,0,0,0.22)' }}
                        onClick={() => setForceExpand(true)}
                        title="Expand bubble"
                        aria-label="Expand chat bubble"
                    >
                        <ChevronDownIcon className="w-7 h-7" />
                    </button>
                )}
                {forceExpand && (
                    <button
                        className="absolute right-3 bottom-3 z-40 bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--ctp-overlay1)] hover:text-[var(--ctp-mauve)] p-2.5 rounded-full shadow-2xl border-2 border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--ctp-mauve)]"
                        style={{ fontSize: '1.7rem', lineHeight: 1, boxShadow: '0 6px 24px 0 rgba(0,0,0,0.22)' }}
                        onClick={() => setForceExpand(false)}
                        title="Shrink bubble"
                        aria-label="Shrink chat bubble"
                    >
                        <ChevronUpIcon className="w-7 h-7" />
                    </button>
                )}
            </div>
        </div>
    );
};
