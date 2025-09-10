import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePortal } from '@/lib/portalUtils';
import useSettingsStore from '@/store/settingsStore';
import { catppuccinAccentColorsHexMap, catppuccinMochaColors } from '@/types';
import { useTooltip } from '@/contexts/TooltipContext';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    delay?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Theme-fitting Tooltip component for consistent tooltips across the app.
 * Usage:
 * <Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>
 */
const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    className = '',
    delay = 200,
}) => {
    const { activeTooltip, showTooltip, hideTooltip } = useTooltip();
    const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
    const [tooltipId] = useState(() => Math.random().toString(36).slice(2));
    const timeout = useRef<NodeJS.Timeout | null>(null);
    const childRef = useRef<HTMLDivElement>(null);
    const lastMouse = useRef<{ x: number; y: number } | null>(null);
    const visible = activeTooltip === tooltipId;

    const handleShow = useCallback((e?: React.MouseEvent) => {
        if (e) {
            lastMouse.current = { x: e.clientX, y: e.clientY };
        }
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
            showTooltip(tooltipId);
            if (lastMouse.current) {
                setMouse({ ...lastMouse.current });
            } else if (childRef.current) {
                const rect = childRef.current.getBoundingClientRect();
                setMouse({ top: rect.top + window.scrollY, left: rect.left + window.scrollX } as any);
            }
        }, delay);
    }, [delay, tooltipId, showTooltip]);

    const handleHide = useCallback(() => {
        if (timeout.current) clearTimeout(timeout.current);
        hideTooltip(tooltipId);
        setMouse(null);
        lastMouse.current = null;
    }, [tooltipId, hideTooltip]);

    // Tooltip position logic
    let tooltipStyle: React.CSSProperties = { zIndex: 9999, pointerEvents: 'none', opacity: visible ? 1 : 0, transition: 'opacity 0.18s cubic-bezier(.4,1.2,.6,1), transform 0.18s cubic-bezier(.4,1.2,.6,1)' };
    let calculatedLeft: number | undefined;
    let calculatedTop: number | undefined;
    let transform = 'translate(-50%, -100%) scale(1)';

    if (mouse) {
        calculatedLeft = mouse.x;
        calculatedTop = mouse.y - 18;
    } else if (childRef.current) {
        const rect = childRef.current.getBoundingClientRect();
        calculatedLeft = rect.left + rect.width / 2;
        calculatedTop = rect.top - 8;
    }

    if (typeof window !== 'undefined' && calculatedLeft !== undefined && calculatedTop !== undefined && visible) {
        const tooltipWidth = 260;
        const tooltipHeight = 48;
        const padding = 8;
        const vw = window.innerWidth;

        if (calculatedLeft - tooltipWidth / 2 < padding) {
            calculatedLeft = padding + tooltipWidth / 2;
        } else if (calculatedLeft + tooltipWidth / 2 > vw - padding) {
            calculatedLeft = vw - padding - tooltipWidth / 2;
        }

        if (calculatedTop - tooltipHeight < padding) {
            calculatedTop = (mouse ? mouse.y : calculatedTop) + 24;
            transform = 'translate(-50%, 0) scale(1)';
        }
    }

    tooltipStyle = {
        ...tooltipStyle,
        left: calculatedLeft,
        top: calculatedTop,
        transform: visible ? transform : transform.replace('scale(1)', 'scale(0.95)'),
    };

    // Theme and mode
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const themeFromStore = useSettingsStore(state => state.theme.base);
    const isDarkModeActive = themeFromStore === 'dark' || (themeFromStore === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || catppuccinMochaColors.mauve;
    const textColor = isDarkModeActive ? accentColor : catppuccinMochaColors.crust;
    const tooltipBg = isDarkModeActive
        ? `rgba(17, 17, 27, 0.98)`
        : accentColor + 'F2';
    const tooltipBorder = accentColor;
    const glassClass = isDarkModeActive ? 'chat-bubble-glass-extra-dark' : 'chat-bubble-glass';

    const renderPortal = usePortal({
        isOpen: visible && (mouse !== null || childRef.current !== null),
        onClose: handleHide,
        closeOnEscape: true,
        closeOnBackdropClick: false,
        preventBodyScroll: false,
        portalId: 'tooltip-portal-root',
    });

    return (
        <div
            ref={childRef}
            className="inline-block outline-none"
            onMouseEnter={handleShow}
            onMouseMove={handleShow}
            onMouseLeave={handleHide}
            onFocus={() => handleShow()}
            onBlur={handleHide}
            tabIndex={0}
        >
            {children}
            {renderPortal(
                <div
                    className={`fixed pointer-events-none px-3 py-2 rounded-2xl shadow-xl border font-sans text-xs font-medium ${glassClass} ${className}`}
                    style={{
                        position: 'absolute',
                        ...tooltipStyle,
                        background: tooltipBg,
                        color: textColor,
                        borderColor: tooltipBorder,
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
                        fontStyle: 'normal',
                        zIndex: 20,
                    }}
                    role="tooltip"
                >
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
 
// Compatibility shims for Radix-style named imports used elsewhere in the codebase.
// These are intentionally minimal wrappers that preserve render semantics for now.
// If richer behavior is needed later, replace these with a more full-featured implementation.
export const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => {
    // Radix's TooltipTrigger often uses `asChild` to forward children as trigger.
    // Our shim simply renders the child directly.
    return <>{children}</>;
};

export const TooltipContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // When files import TooltipContent and render it, show the content directly.
    return <>{children}</>;
};
