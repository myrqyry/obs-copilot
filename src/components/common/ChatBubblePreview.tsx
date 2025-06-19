import React from 'react';
import { CatppuccinChatBubbleColorName, catppuccinChatBubbleColorsHexMap } from '../../types';

interface ChatBubblePreviewProps {
    userColor: CatppuccinChatBubbleColorName;
    modelColor: CatppuccinChatBubbleColorName;
    flipSides: boolean;
    extraDarkMode: boolean;
    customBackground?: string;
    bubbleFillOpacity?: number;
    backgroundOpacity?: number;
}

export const ChatBubblePreview: React.FC<ChatBubblePreviewProps> = ({
    userColor,
    modelColor,
    flipSides,
    extraDarkMode,
    customBackground,
    bubbleFillOpacity = 0.85,
    backgroundOpacity = 0.7,
}) => {
    // Convert hex color to rgba string with given alpha (0-1)
    function hexToRgba(hex: string, alpha: number) {
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // Solid color backgrounds with opacity for both modes
    const userBg = extraDarkMode
        ? {
            backgroundColor: `hsla(214, 13%, 14%, ${bubbleFillOpacity})`, // --secondary with opacity
            borderColor: `rgba(var(--user-chat-bubble-color-rgb), 0.60)`,
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(var(--user-chat-bubble-color-rgb), 0.20)'
        }
        : { backgroundColor: hexToRgba(catppuccinChatBubbleColorsHexMap[userColor], bubbleFillOpacity), borderColor: undefined };
    const modelBg = extraDarkMode
        ? {
            backgroundColor: `hsla(214, 13%, 14%, ${bubbleFillOpacity})`, // --secondary with opacity
            borderColor: `rgba(var(--model-chat-bubble-color-rgb), 0.60)`,
            boxShadow: '0 4px 12px 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(var(--model-chat-bubble-color-rgb), 0.20)'
        }
        : { backgroundColor: hexToRgba(catppuccinChatBubbleColorsHexMap[modelColor], bubbleFillOpacity), borderColor: undefined };

    const userStyle: React.CSSProperties = {
        ...userBg,
        borderWidth: 2,
        color: extraDarkMode ? catppuccinChatBubbleColorsHexMap[userColor] : '#1e1e2e',
        fontStyle: 'normal',
        fontSize: '0.9rem',
        maxWidth: 180,
        minWidth: 60,
        padding: '0.5rem 1rem',
        borderRadius: 18,
        margin: '0.25rem 0',
        alignSelf: flipSides ? 'flex-start' : 'flex-end',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
    };
    const modelStyle: React.CSSProperties = {
        ...modelBg,
        borderWidth: 2,
        color: extraDarkMode ? catppuccinChatBubbleColorsHexMap[modelColor] : '#1e1e2e',
        fontStyle: 'normal',
        fontSize: '0.9rem',
        maxWidth: 180,
        minWidth: 60,
        padding: '0.5rem 1rem',
        borderRadius: 18,
        margin: '0.25rem 0',
        alignSelf: flipSides ? 'flex-end' : 'flex-start',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
    };
    return (
        <div className="flex flex-col items-stretch justify-center w-full py-2 px-1 mb-2 rounded-lg border border-border bg-background/70 relative overflow-hidden">
            {/* Background image with opacity - separate from content */}
            {customBackground && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url(${customBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 'inherit',
                        zIndex: 0,
                    }}
                >
                    {/* Opacity layer */}
                    <div
                        className="absolute inset-0 bg-black"
                        style={{
                            opacity: 1 - backgroundOpacity,
                            zIndex: 1,
                        }}
                    />
                </div>
            )}

            {/* Content with proper z-index */}
            <div style={{ ...userStyle, position: 'relative', zIndex: 2 }}>
                <span role="img" aria-label="User" className="mr-2">🧑</span>
                <span>User: Hello!</span>
            </div>
            <div style={{ ...modelStyle, position: 'relative', zIndex: 2 }}>
                <span role="img" aria-label="Model" className="mr-2">🤖</span>
                <span>Model: Hi there!</span>
            </div>
        </div>
    );
};
