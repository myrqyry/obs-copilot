# Design System Guide

This document outlines the design system methodology, tokens, and utilities available in the application. We utilize Tailwind CSS for utility-first styling, enhanced with custom configuration for our specific needs like glassmorphism, neon effects, and OBS-specific statuses.

## Colors

### Core Colors
Standard semantic colors map to CSS variables for theming support.
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-destructive` / `text-destructive-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-popover` / `text-popover-foreground`

### OBS Status Colors
Specialized colors for OBS connection and streaming states.
- `text-obs-connected` - OBS connected state
- `text-obs-disconnected` - OBS disconnected state
- `text-obs-recording` - Active recording state
- `text-obs-streaming` - Active streaming state

### Status Indicators
General status colors.
- `bg-status-live` - Live status
- `bg-status-offline` - Offline status
- `bg-status-pending` - Pending/Loading status

## Shadows & Effects

### Glow Effects
Used for emphasizing active or high-priority elements.
- `shadow-glow` - Standard primary glow
- `shadow-glow-lg` - Large primary glow
- `shadow-glow-accent` - Accent colored glow
- `shadow-glow-accent-lg` - Large accent glow
- `shadow-inner-glow` - Inner glow effect

### Neon Effects
High intensity lighting effects for cyberpunk/futuristic aesthetic.
- `shadow-neon` - Standard neon
- `shadow-neon-lg` - Large neon

### Glassmorphism
Backdrop blur and translucency for panels and overlays.
- `shadow-glass`
- `shadow-glass-lg`
- `shadow-glass-xl`
- `.glass-panel` - Utility class for quick glass panel styling
- `.glass-panel-dark` - Darker variant
- `.glass-effect`
- `.glass-effect-dark`

### Soft Shadows
Subtle depth for cleaner UI sections.
- `shadow-soft`
- `shadow-soft-lg`

## Typography
We use standard Tailwind typography scales with additional utilities:
- `.text-balance` - Balanced text wrapping
- `.text-pretty` - Pretty text wrapping
- `.text-gradient` - Gradient text using primary and accent colors

## Animations
Custom animations for dynamic interfaces.
- `animate-ripple`
- `animate-gradient`
- `animate-gradient-shift`
- `animate-spin-slow` / `animate-spin-fast`
- `animate-ping-slow`
- `animate-pulse-slow`
- `animate-bounce-slow`
- `animate-float`
- `animate-sink`
- `animate-glow`
- `animate-shimmer`
- `animate-morph`

## Component Variants
We use `class-variance-authority` (CVA) for component variants.

### Card Variants
Managed via `cardVariants` in `src/shared/components/ui/variants.ts`.
- `default`
- `glass`
- `elevated`
- `outlined`
- `gradient`
- `neon`
- `frosted`
- `minimal`
- `accent-gradient`
- `accent-outline`
- `primary-glow`

### Badge Variants
Managed via `badgeVariants`.
- `default`
- `success`
- `warning`
- `error`
- `info`
