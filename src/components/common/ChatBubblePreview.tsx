import React from 'react';
import { CatppuccinChatBubbleColorName, catppuccinChatBubbleColorsHexMap, catppuccinMochaColors } from '../../types';

interface ChatBubblePreviewProps {
    userColor: CatppuccinChatBubbleColorName;
    modelColor: CatppuccinChatBubbleColorName;
    flipSides: boolean;
    extraDarkMode: boolean;
    customBackground?: string;
    bubbleFillOpacity?: number;
    backgroundOpacity?: number;
    chatBackgroundBlendMode?: React.CSSProperties['mixBlendMode'];
    chatBubbleBlendMode?: React.CSSProperties['mixBlendMode']; // New: blend mode for chat bubble fills
}

export const ChatBubblePreview: React.FC<ChatBubblePreviewProps> = ({
    userColor,
    modelColor,
    flipSides,
    extraDarkMode,
    customBackground,
    bubbleFillOpacity = 0.85,
    backgroundOpacity = 0.7,
    chatBackgroundBlendMode = 'normal',
    chatBubbleBlendMode = 'normal',
}) => {
    // Helper to convert hex to rgba
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

    // Should we apply glass effect?
    const shouldUseGlassEffect = customBackground && bubbleFillOpacity < 1;

    // Dark base color for outlines and dark fills
    const darkColor = catppuccinMochaColors.base; // #1e1e2e

    // Get colors
    const userColorHex = catppuccinChatBubbleColorsHexMap[userColor];
    const modelColorHex = catppuccinChatBubbleColorsHexMap[modelColor];

    // Apply color logic based on mode for user bubble
    let userBgColor: string;
    let userBorderColor: string;
    let userTextColor: string;

    if (extraDarkMode) {
        // Extra dark mode: dark fill, chosen color for text and border
        userBgColor = hexToRgba(darkColor, bubbleFillOpacity);
        userBorderColor = hexToRgba(userColorHex, 0.8);
        userTextColor = userColorHex;
    } else {
        // Regular mode: chosen color fill, dark text and border  
        userBgColor = hexToRgba(userColorHex, bubbleFillOpacity);
        userBorderColor = hexToRgba(darkColor, 0.8);
        userTextColor = darkColor;
    }

    // Apply color logic based on mode for model bubble
    let modelBgColor: string;
    let modelBorderColor: string;
    let modelTextColor: string;

    if (extraDarkMode) {
        // Extra dark mode: dark fill, chosen color for text and border
        modelBgColor = hexToRgba(darkColor, bubbleFillOpacity);
        modelBorderColor = hexToRgba(modelColorHex, 0.8);
        modelTextColor = modelColorHex;
    } else {
        // Regular mode: chosen color fill, dark text and border
        modelBgColor = hexToRgba(modelColorHex, bubbleFillOpacity);
        modelBorderColor = hexToRgba(darkColor, 0.8);
        modelTextColor = darkColor;
    }

    // Glass effect classes
    const glassEffectClass = shouldUseGlassEffect
        ? extraDarkMode
            ? 'chat-bubble-glass-extra-dark'
            : 'chat-bubble-glass'
        : '';

    const userStyle: React.CSSProperties = {
        backgroundColor: userBgColor,
        borderColor: userBorderColor,
        color: userTextColor,
        borderWidth: '2px',
        borderStyle: 'solid',
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
        transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s, align-self 0.3s ease-in-out', // Added align-self transition
        mixBlendMode: chatBubbleBlendMode,
    };

    const modelStyle: React.CSSProperties = {
        backgroundColor: modelBgColor,
        borderColor: modelBorderColor,
        color: modelTextColor,
        borderWidth: '2px',
        borderStyle: 'solid',
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
        transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s, align-self 0.3s ease-in-out', // Added align-self transition
        mixBlendMode: chatBubbleBlendMode,
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
                        mixBlendMode: chatBackgroundBlendMode,
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
            <div className={`${glassEffectClass}`} style={{ ...userStyle, position: 'relative', zIndex: 2 }}>
                <span role="img" aria-label="User" className="mr-2">🧑</span>
                <span>User: Hello!</span>
            </div>
            <div className={`${glassEffectClass}`} style={{ ...modelStyle, position: 'relative', zIndex: 2 }}>
                <span role="img" aria-label="Model" className="mr-2">🤖</span>
                <span>Model: Hi there!</span>
            </div>
        </div>
    );
};
