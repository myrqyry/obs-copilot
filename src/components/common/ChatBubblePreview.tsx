import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { getWcagTextColor } from '@/utils/contrast';
import gsap from 'gsap';

// WCAG helpers are implemented in src/utils/contrast.ts

interface ChatBubblePreviewProps {
    userColor: string; // Color name from current theme
    modelColor: string; // Color name from current theme
    flipSides: boolean;
    extraDarkMode: boolean;
    customBackground?: string;
    bubbleFillOpacity?: number;
    // secondaryAccent passed from SettingsTab so system messages can use it
    secondaryAccent?: string;
    chatBubbleBlendMode?: React.CSSProperties['mixBlendMode'];
}

export const ChatBubblePreview: React.FC<ChatBubblePreviewProps> = ({
    userColor,
    modelColor,
    flipSides,
    extraDarkMode,
    customBackground,
    bubbleFillOpacity = 0.85,
    secondaryAccent,
    chatBubbleBlendMode = 'normal',
}: ChatBubblePreviewProps) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const userRef = useRef<HTMLDivElement | null>(null);
    const modelRef = useRef<HTMLDivElement | null>(null);
    const systemRef = useRef<HTMLDivElement | null>(null);
    
    // Resolve color names to hex values
    const userHex = theme?.accentColors?.[userColor] || '#89dceb'; // fallback to sky
    const modelHex = theme?.accentColors?.[modelColor] || '#cba6f7'; // fallback to mauve
    
    // Helper to convert hex to rgba
    function hexToRgba(hex: string, alpha: number) {
        if (!hex) return `rgba(137, 220, 235, ${alpha})`; // fallback rgba
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // NOTE: WCAG helpers are implemented at module scope and exported above.

    // Should we apply glass effect?
    const shouldUseGlassEffect = customBackground && bubbleFillOpacity < 1;

    // Dark base color for outlines and dark fills
    const darkColor = (typeof theme?.colors?.base === 'string' ? theme.colors.base : '#1e1e2e');

    // Get colors from theme
    const userColorHex = userHex;
    const modelColorHex = modelHex;
    // use secondaryAccent prop if present, otherwise fall back to theme.secondaryAccent
    const resolvedSecondaryAccent = secondaryAccent || (theme as any)?.secondaryAccent;

    // Compute bubble colors (simple, prefer Tailwind for spacing/shape)
    const userBgColor = extraDarkMode ? hexToRgba(darkColor, bubbleFillOpacity) : hexToRgba(userColorHex, bubbleFillOpacity);
    const userBorderColor = extraDarkMode ? hexToRgba(userColorHex, 0.8) : hexToRgba(darkColor, 0.8);
    // When extraDarkMode is disabled (light/accent bubbles), choose a readable text color
    const userTextColor = extraDarkMode ? userColorHex : getWcagTextColor(userColorHex, 4.5);

    const modelBgColor = extraDarkMode ? hexToRgba(darkColor, bubbleFillOpacity) : hexToRgba(modelColorHex, bubbleFillOpacity);
    const modelBorderColor = extraDarkMode ? hexToRgba(modelColorHex, 0.8) : hexToRgba(darkColor, 0.8);
    const modelTextColor = extraDarkMode ? modelColorHex : getWcagTextColor(modelColorHex, 4.5);

    // For system messages we want the secondary accent color (if available)
    const secondaryAccentHex = resolvedSecondaryAccent ? (theme?.accentColors?.[resolvedSecondaryAccent] || '') : '';
    // If extraDarkMode is enabled, system messages should use the dark bubble
    const systemBgColor = extraDarkMode
        ? hexToRgba(darkColor, bubbleFillOpacity)
        : (secondaryAccentHex ? hexToRgba(secondaryAccentHex, bubbleFillOpacity) : hexToRgba('#94a3b8', bubbleFillOpacity));
    const systemBorderColor = extraDarkMode
        ? (secondaryAccentHex ? hexToRgba(secondaryAccentHex, 0.9) : hexToRgba('#94a3b8', 0.9))
        : (secondaryAccentHex ? hexToRgba(secondaryAccentHex, 0.9) : hexToRgba('#94a3b8', 0.9));
    // When dark bubbles are enabled, prefer the secondary accent for system text so it stands out
    // Fallback to white for readability if secondary accent is not present
    // When dark bubbles are disabled, system text should match user/model text color
    const systemTextColor = extraDarkMode
        ? (secondaryAccentHex || '#ffffff')
        : (secondaryAccentHex ? getWcagTextColor(secondaryAccentHex, 4.5) : userTextColor || modelTextColor || darkColor);

    const glassEffectClass = shouldUseGlassEffect ? (extraDarkMode ? 'chat-bubble-glass-extra-dark' : 'chat-bubble-glass') : '';

    // animate swap when flipSides toggles using GSAP (transform-only)
    useEffect(() => {
        if (!userRef.current || !modelRef.current || !systemRef.current) return;
        const u = userRef.current;
        const m = modelRef.current;
        const s = systemRef.current;
    // make the slide more pronounced for a clearer swap animation
    const amount = 32;

        // clear any inline transforms first
        gsap.killTweensOf([u, m, s]);

        // use a slide with a gentle overshoot for a satisfying visual swap
    const slideDuration = 0.64; // slightly slower for a smoother slide
        const slideEase = 'back.out(1.1)';
        if (flipSides) {
            // user moves from right to left (slide left then settle)
            gsap.fromTo(u, { x: amount }, { x: 0, duration: slideDuration, ease: slideEase });
            gsap.fromTo(m, { x: -amount }, { x: 0, duration: slideDuration, ease: slideEase });
        } else {
            gsap.fromTo(u, { x: -amount }, { x: 0, duration: slideDuration, ease: slideEase });
            gsap.fromTo(m, { x: amount }, { x: 0, duration: slideDuration, ease: slideEase });
        }
        // system message does a subtle pop (not side-dependent)
        gsap.fromTo(s, { scale: 0.98, opacity: 0.9 }, { scale: 1, opacity: 1, duration: 0.36, ease: 'power2.out' });
    }, [flipSides, userRef, modelRef, systemRef]);

    return (
        <div ref={containerRef} className="flex flex-col items-stretch justify-center w-full py-3 px-3 rounded-lg border border-border bg-background/60 relative overflow-hidden">
            {/* Constrain inner area so bubbles don't overflow */}
            <div className="w-full max-w-full min-h-[88px] overflow-hidden">
            {/* Only chat bubbles in this preview: system (secondary), user, model */}
            {/* system messages are centered but constrained so they don't span full width */}
            <div ref={systemRef} className={`mx-auto w-auto max-w-[68%] min-w-[120px] px-4 py-2 rounded-xl my-2 shadow-sm text-sm preview-bubble ${glassEffectClass}`} style={{ backgroundColor: systemBgColor, border: `2px solid ${systemBorderColor}`, color: systemTextColor, mixBlendMode: chatBubbleBlendMode as React.CSSProperties['mixBlendMode'], zIndex: 2 }}>
                <span className="font-medium">System: rules applied</span>
            </div>

            <div className={`flex flex-col gap-1 w-full px-2` }>
                {/* user bubble: limit width and add a small outer margin on the side opposite the speaker */}
                <div ref={userRef} className={`w-auto max-w-[68%] min-w-[120px] p-3 rounded-2xl shadow-sm text-sm preview-bubble ${flipSides ? 'self-start mr-4' : 'self-end ml-4'} ${glassEffectClass}`} style={{ backgroundColor: userBgColor, border: `2px solid ${userBorderColor}`, color: userTextColor, mixBlendMode: chatBubbleBlendMode as React.CSSProperties['mixBlendMode'], zIndex: 2 }}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">👤</span>
                        <span className="truncate">User: Hello, this is a preview message to show bubble sizing.</span>
                    </div>
                </div>

                {/* model bubble: mirror spacing logic of the user bubble */}
                <div ref={modelRef} className={`w-auto max-w-[68%] min-w-[120px] p-3 rounded-2xl shadow-sm text-sm preview-bubble ${flipSides ? 'self-end ml-4' : 'self-start mr-4'} ${glassEffectClass}`} style={{ backgroundColor: modelBgColor, border: `2px solid ${modelBorderColor}`, color: modelTextColor, mixBlendMode: chatBubbleBlendMode as React.CSSProperties['mixBlendMode'], zIndex: 2 }}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🤖</span>
                        <span className="truncate">Model: Hi! This shows how model bubbles look in the theme.</span>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};
