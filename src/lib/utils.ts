import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { gsap } from "gsap";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Utility to check if user prefers reduced motion
 * Used by GSAP components to respect accessibility preferences
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Safe GSAP animation that respects user preferences
 * Returns whether animation was actually started
 */
export function safeGsapTo(target: any, vars: any): boolean {
    if (prefersReducedMotion()) {
        // Apply final state immediately without animation
        if (vars.scale !== undefined) target.style.transform = `scale(${vars.scale})`;
        if (vars.y !== undefined) target.style.transform += ` translateY(${vars.y}px)`;
        if (vars.opacity !== undefined) target.style.opacity = vars.opacity;
        return false;
    }

    gsap.to(target, vars);
    return true;
}

/**
 * Safe GSAP set that respects user preferences
 */
export function safeGsapSet(target: any, vars: any): void {
    gsap.set(target, vars);
}
