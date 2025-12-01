// src/components/layout/TabNavigation.tsx
import * as React from 'react';
import { useEffect, useRef } from 'react';
// connection/chat stores not directly used here; handled in per-tab components when needed
import { cn } from '@/lib/utils';
import { Plugin } from '@/types/plugin';
import { useAnimatedTabs } from '@/hooks/useAnimatedTabs';
import useConfigStore from '@/store/configStore';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import gsap from 'gsap';

interface SortableTabProps {
    tab: Plugin;
    isActive: boolean;
    registerTab: (tabKey: string, el: HTMLButtonElement | null) => void;
    setActiveTab: (id: string) => void;
    handleTabClick: (tabKey: string, onClick: (tab: string) => void) => (e: any) => void;
}

const SortableTab: React.FC<SortableTabProps> = (props: SortableTabProps) => {
    const { tab, isActive, registerTab, setActiveTab, handleTabClick } = props;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
    const containerRef = useRef<HTMLButtonElement | null>(null);
    const iconRef = useRef<HTMLElement | null>(null);
    const labelRef = useRef<HTMLSpanElement | null>(null);
    const isPressedRef = useRef<boolean>(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
        // width will be animated by GSAP to produce the "expand when active" effect
        width: undefined as any,
        // set line width CSS variable when active; computed later in effect
        ['--lineWidth' as any]: undefined as any,
    } as React.CSSProperties;

    const Icon = tab.icon;

    // GSAP animations: hover scale, active label pop-out, fluid icon motion, drag state styling
    useEffect(() => {
        // Ensure we're running in a browser environment and refs are present
        if (typeof window === 'undefined' || !containerRef.current) return;

        const btn = containerRef.current;

        // Respect user's reduce-motion preference (guard for environments without matchMedia)
        const prefersReduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false;

        // Hover/idle animation handlers (guard ref presence at call time)
        const hoverIn = () => {
            if (prefersReduced || !iconRef.current) return;
            try { gsap.to(iconRef.current, { scale: 1.06, duration: 0.18, ease: 'power2.out' }); } catch (e) {}
        };
        const hoverOut = () => {
            if (prefersReduced || !iconRef.current) return;
            try { gsap.to(iconRef.current, { scale: 1, duration: 0.26, ease: 'power2.out' }); } catch (e) {}
        };

        btn.addEventListener('pointerenter', hoverIn);
        btn.addEventListener('pointerleave', hoverOut);

        // Cursor behavior: default cursor normally. When the user presses/holds the
        // tab (pointerdown) set cursor to `grab`. When dragging (isDragging) set
        // to `grabbing`. On pointerup or leave, clear cursor unless dragging.
        const onPointerDown = () => {
            isPressedRef.current = true;
            try { btn.style.cursor = 'grab'; } catch (e) {}
        };

        const onPointerUp = () => {
            isPressedRef.current = false;
            try {
                // If currently dragging, show grabbing; otherwise clear to default
                btn.style.cursor = isDragging ? 'grabbing' : '';
            } catch (e) {}
        };

        const onPointerLeave = () => {
            isPressedRef.current = false;
            try { btn.style.cursor = isDragging ? 'grabbing' : ''; } catch (e) {}
        };

        btn.addEventListener('pointerdown', onPointerDown);
        btn.addEventListener('pointerup', onPointerUp);
        btn.addEventListener('pointerleave', onPointerLeave);

    // Label pop-out timeline for active state
        let labelTimeline: gsap.core.Timeline | null = null;
        // Floating icon animation (yoyo)
        let floatTween: gsap.core.Tween | null = null;
    // Width tween for expansion/collapse
    let widthTween: gsap.core.Tween | null = null;

        const setupActiveAnimations = () => {
            // label pops out with slight scale + fade + slide
            labelTimeline = gsap.timeline();
            labelTimeline.set(labelRef.current, { autoAlpha: 0, x: -8, scale: 0.96 });
            labelTimeline.to(labelRef.current, { autoAlpha: 1, x: 0, scale: 1, duration: 0.26, ease: 'power3.out' });

            // icon shifts a bit to the left while label appears
            labelTimeline.to(iconRef.current, { x: -6, duration: 0.26, ease: 'power3.out' }, 0);

            // NOTE: avoid resolving CSS variables and applying inline color styles here.
            // Let the stylesheet (CSS variables + utility classes) control text/icon color so
            // theme changes propagate automatically. We keep GSAP animations for transform/opacity
            // only to avoid writing inline `color` styles which would override CSS variables.

            // continuous subtle float (only when not preferring reduced motion), gentler motion
            if (!prefersReduced && iconRef.current) {
                try { floatTween = gsap.to(iconRef.current, { y: -2, repeat: -1, yoyo: true, duration: 3.6, ease: 'sine.inOut' }); } catch (e) { floatTween = null; }
            }
            // animate width to fit icon + label
            if (containerRef.current) {
                const { collapsed, expanded } = computeWidths();
                if (!prefersReduced) {
                    try { widthTween = gsap.to(containerRef.current, { width: expanded, duration: 0.36, ease: 'power3.out' }); } catch (e) { widthTween = null; }
                } else {
                    // ensure a deterministic collapsed width before expansion when reduced-motion is enabled
                    containerRef.current.style.width = `${collapsed}px`;
                    containerRef.current.style.width = `${expanded}px`;
                }
                // set the underline width variable based on label width
                try {
                    const labelW = labelRef.current ? Math.ceil(labelRef.current.getBoundingClientRect().width || labelRef.current.offsetWidth || 0) : 0;
                    containerRef.current.style.setProperty('--lineWidth', `${labelW}px`);
                } catch (e) {}
            }
        };

        const teardownActiveAnimations = () => {
            if (labelTimeline) { try { labelTimeline.kill(); } catch (e) {} labelTimeline = null; }
            if (floatTween) { try { floatTween.kill(); } catch (e) {} floatTween = null; }
            if (widthTween) { try { widthTween.kill(); } catch (e) {} widthTween = null; }
            if (iconRef.current) { try { gsap.to(iconRef.current, { x: 0, scale: 1, duration: 0.16, ease: 'power2.inOut' }); } catch (e) {} }
            if (labelRef.current) { try { gsap.to(labelRef.current, { autoAlpha: 0, x: -6, duration: 0.14, ease: 'power2.in' }); } catch (e) {} }
            // Avoid reverting colors via inline styles; CSS classes handle color states.
            // collapse back to icon-only width
            if (containerRef.current) {
                const { collapsed } = computeWidths();
                if (!prefersReduced) {
                    gsap.to(containerRef.current, { width: collapsed, duration: 0.18, ease: 'power2.inOut' });
                } else {
                    containerRef.current.style.width = `${collapsed}px`;
                }
            }
        };

        // compute collapsed (icon-only) and expanded (icon + label) widths in px
        const computeWidths = () => {
            if (!containerRef.current || !iconRef.current) return { collapsed: 0, expanded: 0 };
            const btn = containerRef.current;
            const iconEl = iconRef.current as HTMLElement;
            const labelEl = labelRef.current as HTMLElement | null;
            const iconW = Math.ceil(iconEl.getBoundingClientRect().width || iconEl.offsetWidth || 24);
            const labelW = labelEl ? Math.ceil(labelEl.getBoundingClientRect().width || labelEl.offsetWidth || 0) : 0;
            const style = window.getComputedStyle(btn);
            const padLeft = parseFloat(style.paddingLeft || '0') || 0;
            const padRight = parseFloat(style.paddingRight || '0') || 0;
            // tailwind gap-3 ~= 0.75rem = 12px (we increased spacing between tabs)
            const gap = 12;
            const collapsed = Math.ceil(iconW + padLeft + padRight);
            const expanded = Math.ceil(iconW + labelW + padLeft + padRight + gap);
            return { collapsed, expanded };
        };

        // set initial width (collapsed) and wire up resize observer
        const applyInitialWidth = () => {
            if (!containerRef.current) return;
            const { collapsed } = computeWidths();
            containerRef.current.style.width = `${collapsed}px`;
            // also set a sensible default line width for the underline (icon-only fallback)
            try {
                const labelW = labelRef.current ? Math.ceil(labelRef.current.getBoundingClientRect().width || labelRef.current.offsetWidth || 0) : 0;
                containerRef.current.style.setProperty('--lineWidth', `${labelW}px`);
            } catch (e) {}
        };

        applyInitialWidth();

        let resizeObserver: ResizeObserver | null = null;
        if (typeof window !== 'undefined' && (window as any).ResizeObserver && containerRef.current) {
            resizeObserver = new (window as any).ResizeObserver(() => {
                // recompute widths and adjust to current active state
                if (!containerRef.current) return;
                const { collapsed, expanded } = computeWidths();
                if (isActive) {
                    if (!prefersReduced) gsap.to(containerRef.current, { width: expanded, duration: 0.32, ease: 'power2.out' });
                    else containerRef.current.style.width = `${expanded}px`;
                } else {
                    if (!prefersReduced) gsap.to(containerRef.current, { width: collapsed, duration: 0.28, ease: 'power2.in' });
                    else containerRef.current.style.width = `${collapsed}px`;
                }
            });
            if (resizeObserver && containerRef.current) {
                try { resizeObserver.observe(containerRef.current); } catch (e) {}
            }
        }

        if (isActive) {
            setupActiveAnimations();
        } else {
            teardownActiveAnimations();
        }

        // Drag state visual feedback (guard for ref). Resolve CSS var(--shadow-primary) before animating.
        if (containerRef.current) {
            try {
                const resolveBoxShadow = (cssValue: string): string => {
                    if (typeof window === 'undefined') return cssValue;
                    try {
                        const span = document.createElement('span');
                        span.style.position = 'absolute';
                        span.style.left = '-9999px';
                        span.style.boxShadow = cssValue;
                        document.body.appendChild(span);
                        const computed = window.getComputedStyle(span).boxShadow;
                        document.body.removeChild(span);
                        return computed || cssValue;
                    } catch (e) {
                        return cssValue;
                    }
                };

                const shadowPrimary = resolveBoxShadow('var(--shadow-primary)');
                if (isDragging) {
                    gsap.to(containerRef.current, { scale: 0.98, boxShadow: shadowPrimary, duration: 0.12 });
                    try { containerRef.current.style.cursor = 'grabbing'; } catch (e) {}
                } else {
                    gsap.to(containerRef.current, { scale: 1, boxShadow: 'none', duration: 0.18 });
                    // restore cursor based on whether the pointer is pressed
                    try { containerRef.current.style.cursor = isPressedRef.current ? 'grab' : ''; } catch (e) {}
                }
            } catch (e) {}
        }

        // Cleanup on unmount
        return () => {
            try {
                if (btn) {
                    btn.removeEventListener('pointerenter', hoverIn);
                    btn.removeEventListener('pointerleave', hoverOut);
                    btn.removeEventListener('pointerdown', onPointerDown);
                    btn.removeEventListener('pointerup', onPointerUp);
                    btn.removeEventListener('pointerleave', onPointerLeave);
                }
            } catch (e) {}
            teardownActiveAnimations();
            if (resizeObserver) {
                try { resizeObserver.disconnect(); } catch (e) {}
            }
        };
    }, [isActive, isDragging]);

    return (
        <button
            ref={(el) => { setNodeRef(el); registerTab(tab.id, el); containerRef.current = el; }}
            onClick={handleTabClick(tab.id, setActiveTab)}
            aria-selected={isActive}
            data-active={isActive}
            {...attributes}
            {...listeners}
            style={style}
            className={cn(
                // make tabs compact by default (icon-only) and expand smoothly when active
                'tab-item inline-flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 relative z-10 h-full min-w-0',
                'group',
                'text-muted-foreground data-[active=true]:text-primary hover:text-accent',
                'hover:bg-gradient-to-br hover:from-muted/8 hover:to-accent/6',
                'data-[active=true]:bg-gradient-to-br data-[active=true]:from-primary/10 data-[active=true]:to-accent/6',
                'ripple-effect',
            )}
        >
            <span
                ref={iconRef as any}
                // Apply theme-aware text colors directly, using group state from the parent button.
                className={cn(
                    'tab-icon',
                    'flex-none w-6 h-6 flex items-center justify-center leading-none',
                    'text-muted-foreground group-data-[active=true]:text-primary group-hover:text-accent'
                )}
            >
                {/* ensure icon SVG scales to its container; svg set to block to avoid baseline clipping
                    Expect SVG to inherit currentColor; wrapping span sets color via CSS variables */}
                {Icon && <Icon className="w-full h-full block" />}
            </span>
            {/* label appears only when active; animated by GSAP */}
            <span
                ref={labelRef}
                className={cn(
                    'tab-label text-sm font-medium inline-block',
                    isActive ? 'active' : ''
                )}
                style={{ whiteSpace: 'nowrap' }}
            >
                {tab.name}
            </span>
        </button>
    );
};

interface TabNavigationProps {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    tabs: Plugin[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    activeTab,
    setActiveTab,
    tabs,
}: TabNavigationProps) => {
    // connection status selectors removed — icon coloring handled inside individual tab components if needed

    const { tabBarRef, registerTab, handleTabClick } = useAnimatedTabs(activeTab);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
    );

    // connection status is available from stores; per-tab icon coloring handled in individual tab renderers

    return (
    <nav
            ref={tabBarRef}
            className={cn(
        'prime-nav relative z-40 flex h-12 w-full items-center justify-between bg-card/80 px-4 shadow-md backdrop-blur-md',
        // Subtle top gradient for polish (low-opacity)
        'before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:from-primary/30 before:via-accent/20 before:to-primary/30 before:bg-gradient-to-r before:opacity-70',
    // Active tab indicator: slimmer, softer gradient with reduced shadow
    'after:absolute after:bottom-0 after:left-[var(--indicator-left,0px)] after:h-[2px] after:w-[var(--indicator-width,0px)] after:rounded-full after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 after:opacity-[var(--indicator-opacity,0.95)] after:transition-[width,transform,opacity] after:duration-350 after:ease-in-out',
    // Soft glow for the indicator (muted)
    'after:shadow-[0_0_8px_var(--accent)/30] after:transition-shadow after:duration-350',
            )}
            aria-label="Primary"
        >
                        <div className="w-full px-4">
                            <div className="mx-auto w-full max-w-6xl flex items-center justify-center">
                                <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    if (!over) return;
                    const fromId = active.id as string;
                    const toId = over.id as string;
                    if (fromId === toId) return;
                    const { tabOrder, setTabOrder } = useConfigStore.getState();
                    if (!tabOrder) return;
                    const oldIndex = tabOrder.indexOf(fromId);
                    const newIndex = tabOrder.indexOf(toId);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const newOrder = arrayMove(tabOrder, oldIndex, newIndex);
                    setTabOrder(newOrder);
                }}
            >
                <SortableContext items={tabs.map((t: Plugin) => t.id)} strategy={horizontalListSortingStrategy}>
                    {tabs.map((tab: Plugin) => (
                        <SortableTab
                            key={tab.id}
                            tab={tab}
                            isActive={activeTab === tab.id}
                            registerTab={registerTab}
                            setActiveTab={setActiveTab}
                            handleTabClick={handleTabClick}
                        />
                    ))}
                                        </SortableContext>
                                </DndContext>
                            </div>
                        </div>
        </nav>
    );
};
