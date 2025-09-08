// src/components/layout/TabNavigation.tsx
import React, { useEffect, useRef } from 'react';
// connection/chat stores not directly used here; handled in per-tab components when needed
import { cn } from '@/lib/utils';
import { TabPlugin } from '@/types/plugins';
import { useAnimatedTabs } from '@/hooks/useAnimatedTabs';
import useSettingsStore from '@/store/settingsStore';
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
    tab: TabPlugin;
    isActive: boolean;
    registerTab: (tabKey: string, el: HTMLButtonElement | null) => void;
    setActiveTab: (id: string) => void;
    handleTabClick: (tabKey: string, onClick: (tab: string) => void) => (e: any) => void;
}

const SortableTab: React.FC<SortableTabProps> = ({ tab, isActive, registerTab, setActiveTab, handleTabClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id });
    const containerRef = useRef<HTMLButtonElement | null>(null);
    const iconRef = useRef<HTMLElement | null>(null);
    const labelRef = useRef<HTMLSpanElement | null>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        // width will be animated by GSAP to produce the "expand when active" effect
        width: undefined as any,
    } as React.CSSProperties;

    const Icon = tab.icon;

    // GSAP animations: hover scale, active label pop-out, fluid icon motion, drag state styling
    useEffect(() => {
        if (!iconRef.current || !labelRef.current || !containerRef.current) return;

        const btn = containerRef.current;

        // Respect user's reduce-motion preference
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Hover/idle animation handlers
        const hoverIn = () => {
            if (prefersReduced) return;
            gsap.to(iconRef.current, { scale: 1.08, duration: 0.12, ease: 'power2.out' });
        };
        const hoverOut = () => {
            if (prefersReduced) return;
            gsap.to(iconRef.current, { scale: 1, duration: 0.18, ease: 'power2.out' });
        };

        btn.addEventListener('pointerenter', hoverIn);
        btn.addEventListener('pointerleave', hoverOut);

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

            // continuous subtle float (only when not preferring reduced motion)
            if (!prefersReduced) {
                floatTween = gsap.to(iconRef.current, { y: -3, repeat: -1, yoyo: true, duration: 2.4, ease: 'sine.inOut' });
            }
            // animate width to fit icon + label
            if (containerRef.current) {
                const { collapsed, expanded } = computeWidths();
                if (!prefersReduced) {
                    widthTween = gsap.to(containerRef.current, { width: expanded, duration: 0.22, ease: 'power3.out' });
                } else {
                    // ensure a deterministic collapsed width before expansion when reduced-motion is enabled
                    containerRef.current.style.width = `${collapsed}px`;
                    containerRef.current.style.width = `${expanded}px`;
                }
            }
        };

        const teardownActiveAnimations = () => {
            if (labelTimeline) {
                labelTimeline.kill();
                labelTimeline = null;
            }
            if (floatTween) {
                floatTween.kill();
                floatTween = null;
            }
            if (widthTween) {
                widthTween.kill();
                widthTween = null;
            }
            gsap.to(iconRef.current, { x: 0, scale: 1, duration: 0.16, ease: 'power2.inOut' });
            gsap.to(labelRef.current, { autoAlpha: 0, x: -6, duration: 0.14, ease: 'power2.in' });
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
            // tailwind gap-2 ~= 0.5rem = 8px
            const gap = 8;
            const collapsed = Math.ceil(iconW + padLeft + padRight);
            const expanded = Math.ceil(iconW + labelW + padLeft + padRight + gap);
            return { collapsed, expanded };
        };

        // set initial width (collapsed) and wire up resize observer
        const applyInitialWidth = () => {
            if (!containerRef.current) return;
            const { collapsed } = computeWidths();
            containerRef.current.style.width = `${collapsed}px`;
        };

        applyInitialWidth();

        let resizeObserver: ResizeObserver | null = null;
        if (window.ResizeObserver && containerRef.current) {
            resizeObserver = new ResizeObserver(() => {
                // recompute widths and adjust to current active state
                if (!containerRef.current) return;
                const { collapsed, expanded } = computeWidths();
                if (isActive) {
                    if (!prefersReduced) gsap.to(containerRef.current, { width: expanded, duration: 0.18, ease: 'power2.out' });
                    else containerRef.current.style.width = `${expanded}px`;
                } else {
                    if (!prefersReduced) gsap.to(containerRef.current, { width: collapsed, duration: 0.18, ease: 'power2.in' });
                    else containerRef.current.style.width = `${collapsed}px`;
                }
            });
            resizeObserver.observe(containerRef.current);
        }

        if (isActive) {
            setupActiveAnimations();
        } else {
            teardownActiveAnimations();
        }

        // Drag state visual feedback
        if (isDragging) {
            gsap.to(containerRef.current, { scale: 0.98, boxShadow: 'var(--shadow-primary)', duration: 0.12 });
        } else {
            gsap.to(containerRef.current, { scale: 1, boxShadow: 'none', duration: 0.18 });
        }

        // Cleanup on unmount
        return () => {
            btn.removeEventListener('pointerenter', hoverIn);
            btn.removeEventListener('pointerleave', hoverOut);
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
                'tab-item inline-flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-150 relative z-10 h-full min-w-0',
                'group',
                'text-muted-foreground data-[active=true]:text-primary hover:text-accent',
                'hover:bg-gradient-to-br hover:from-muted/8 hover:to-accent/6',
                'data-[active=true]:bg-gradient-to-br data-[active=true]:from-primary/10 data-[active=true]:to-accent/6',
                'ripple-effect',
            )}
        >
            <span
                ref={iconRef as any}
                // use the tab-icon class so global CSS variables control the icon color
                className={cn(
                    'tab-icon',
                    'flex-none w-6 h-6 flex items-center justify-center leading-none'
                )}
            >
                {/* ensure icon SVG scales to its container; svg set to block to avoid baseline clipping
                    Expect SVG to inherit currentColor; wrapping span sets color via CSS variables */}
                <Icon className="w-full h-full block" />
            </span>
            {/* label appears only when active; animated by GSAP */}
            <span
                ref={labelRef}
                className={cn('text-sm font-medium', isActive ? '' : 'pointer-events-none')}
                style={{
                    whiteSpace: 'nowrap',
                    opacity: isActive ? 1 : 0,
                    display: 'inline-block',
                    // use theme variables for label color so theme updates propagate immediately
                    color: isActive ? 'hsl(var(--tab-active-text))' : 'hsl(var(--tab-inactive-text))',
                }}
            >
                {tab.name}
            </span>
        </button>
    );
};

interface TabNavigationProps {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    tabs: TabPlugin[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    activeTab,
    setActiveTab,
    tabs,
}) => {
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
                'prime-nav relative z-40 flex h-12 w-full items-center justify-between border-b bg-card/80 px-4 shadow-md backdrop-blur-md',
                // Enhanced gradient border on top for visual appeal
                'before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-primary/60 before:via-accent/40 before:to-primary/60',
                // Active tab indicator with enhanced styling
                'after:absolute after:bottom-0 after:left-[var(--indicator-left,0px)] after:h-[3px] after:w-[var(--indicator-width,0px)] after:rounded-full after:bg-gradient-to-r after:from-primary after:to-accent after:opacity-[var(--indicator-opacity,0)] after:transition-[width,transform,opacity] after:duration-300 after:ease-in-out',
                // Enhanced glow effect for the indicator
                'after:shadow-[0_0_12px_var(--primary),0_0_6px_var(--accent)] after:transition-shadow after:duration-300',
                'after:hover:shadow-[0_0_16px_var(--primary),0_0_8px_var(--accent),0_0_24px_var(--primary)]',
                // Interacting state with more prominent dual-color glow
                '[&.interacting::after]:shadow-[0_0_20px_var(--primary),0_0_12px_var(--accent),0_0_36px_var(--primary)]',
            )}
            aria-label="Primary"
        >
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    if (!over) return;
                    const fromId = active.id as string;
                    const toId = over.id as string;
                    if (fromId === toId) return;
                    const { tabOrder, setTabOrder } = useSettingsStore.getState();
                    if (!tabOrder) return;
                    const oldIndex = tabOrder.indexOf(fromId);
                    const newIndex = tabOrder.indexOf(toId);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const newOrder = arrayMove(tabOrder, oldIndex, newIndex);
                    setTabOrder(newOrder);
                }}
            >
                <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                    {tabs.map((tab) => (
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
        </nav>
    );
};
