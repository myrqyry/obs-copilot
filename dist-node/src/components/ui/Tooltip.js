import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store/appStore';
import { catppuccinAccentColorsHexMap, catppuccinMochaColors } from '../../types';
/**
 * Theme-fitting Tooltip component for consistent tooltips across the app.
 * Usage:
 * <Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>
 */
const Tooltip = ({ content, children, className = '', delay = 200, }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState(null);
    const [mouse, setMouse] = useState(null);
    const [tooltipId] = useState(() => Math.random().toString(36).slice(2));
    const timeout = useRef(null);
    const childRef = useRef(null);
    const lastMouse = useRef(null);
    // Global tooltip state
    useEffect(() => {
        if (!window.__activeTooltip) {
            window.__activeTooltip = null;
        }
    }, []);
    // Smoother mouse tracking for tooltip
    const showTooltip = (e) => {
        if (e) {
            lastMouse.current = { x: e.clientX, y: e.clientY };
        }
        if (timeout.current)
            clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
            // Hide any other tooltip
            if (window.__activeTooltip && window.__activeTooltip !== tooltipId) {
                window.__activeTooltipHide && window.__activeTooltipHide();
            }
            window.__activeTooltip = tooltipId;
            window.__activeTooltipHide = hideTooltip;
            setVisible(true);
            if (lastMouse.current) {
                setMouse({ ...lastMouse.current });
            }
            else if (childRef.current) {
                const rect = childRef.current.getBoundingClientRect();
                setCoords({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
            }
        }, delay);
    };
    const hideTooltip = () => {
        if (timeout.current)
            clearTimeout(timeout.current);
        setVisible(false);
        setMouse(null);
        lastMouse.current = null;
        if (window.__activeTooltip === tooltipId) {
            window.__activeTooltip = null;
            window.__activeTooltipHide = null;
        }
    };
    useEffect(() => {
        return () => {
            if (window.__activeTooltip === tooltipId) {
                window.__activeTooltip = null;
                window.__activeTooltipHide = null;
            }
        };
    }, [tooltipId]);
    // Tooltip position logic: always above and centered on the cursor, but never out of viewport
    let tooltipStyle = { zIndex: 9999, pointerEvents: 'none', opacity: visible ? 1 : 0, transition: 'opacity 0.18s cubic-bezier(.4,1.2,.6,1), transform 0.18s cubic-bezier(.4,1.2,.6,1)' };
    let calculatedLeft = undefined;
    let calculatedTop = undefined;
    let transform = 'translate(-50%, -100%) scale(1)';
    if (mouse) {
        calculatedLeft = mouse.x;
        calculatedTop = mouse.y - 18;
    }
    else if (coords && childRef.current) {
        const rect = childRef.current.getBoundingClientRect();
        calculatedLeft = coords.left + rect.width / 2;
        calculatedTop = coords.top - 8;
    }
    // Clamp tooltip position to viewport
    if (typeof window !== 'undefined' && calculatedLeft !== undefined && calculatedTop !== undefined && visible) {
        const tooltipWidth = 260; // Estimate, or could use a ref for actual width
        const tooltipHeight = 48; // Estimate, or could use a ref for actual height
        const padding = 8;
        const vw = window.innerWidth;
        // Clamp horizontally
        if (calculatedLeft - tooltipWidth / 2 < padding) {
            calculatedLeft = padding + tooltipWidth / 2;
        }
        else if (calculatedLeft + tooltipWidth / 2 > vw - padding) {
            calculatedLeft = vw - padding - tooltipWidth / 2;
        }
        // Clamp vertically (above cursor preferred, but fallback below if needed)
        if (calculatedTop - tooltipHeight < padding) {
            // Not enough space above, show below
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
    const accentColorName = useAppStore(state => state.theme.accent);
    const extraDarkMode = useAppStore(state => state.extraDarkMode);
    const accentColor = catppuccinAccentColorsHexMap[accentColorName] || catppuccinMochaColors.mauve;
    const textColor = extraDarkMode ? accentColor : catppuccinMochaColors.crust;
    const tooltipBg = extraDarkMode
        ? `rgba(17, 17, 27, 0.98)`
        : accentColor + 'F2'; // add alpha for light mode
    const tooltipBorder = accentColor;
    // Glass effect (optional, can be tweaked)
    const glassClass = extraDarkMode ? 'chat-bubble-glass-extra-dark' : 'chat-bubble-glass';
    return (<div ref={childRef} className="inline-block" onMouseEnter={e => showTooltip(e)} onMouseMove={e => showTooltip(e)} onMouseLeave={hideTooltip} onFocus={() => showTooltip()} onBlur={hideTooltip} tabIndex={0} style={{ outline: 'none' }}>
            {children}
            {visible && (mouse || coords) && createPortal(<div className={`fixed pointer-events-none px-3 py-2 rounded-2xl shadow-xl border font-sans text-xs font-medium ${glassClass} ${className}`} style={{
                position: 'absolute',
                ...tooltipStyle,
                background: tooltipBg,
                color: textColor,
                borderColor: tooltipBorder,
                borderWidth: '2px',
                borderStyle: 'solid',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
                fontStyle: 'normal',
                zIndex: 9999,
            }} role="tooltip">
                    {content}
                </div>, document.body)}
        </div>);
};
export default Tooltip;
