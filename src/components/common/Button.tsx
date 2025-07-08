import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { motion, HTMLMotionProps } from 'framer-motion';
import { CatppuccinAccentColorName } from '../../types';
import { cn } from '../../lib/utils';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'glass' | 'ghost' | 'outline' | 'gradient' | 'neon' | 'minimal' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  accentColorName?: CatppuccinAccentColorName;
  withAnimation?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loadingText?: string;
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children = null as React.ReactNode,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  accentColorName,
  withAnimation = true,
  icon,
  iconPosition = 'left',
  loadingText = 'Loading...',
  fullWidth = false,
  rounded = false,
  glow = false,
  type = "button", // Default type to "button"
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // GSAP animations
  useEffect(() => {
    if (!withAnimation || !buttonRef.current) return;

    const button = buttonRef.current;

    // Entrance animation
    gsap.set(button, { scale: 0.95, opacity: 0 });
    gsap.to(button, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: 'back.out(1.7)',
      delay: Math.random() * 0.1 // Slight stagger for multiple buttons
    });

    // Enhanced hover animations
    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        y: -2,
        duration: 0.2,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        y: 0,
        duration: 0.2,
        ease: 'power2.out'
      });
    };

    const handleMouseDown = () => {
      gsap.to(button, {
        scale: 0.98,
        duration: 0.1,
        ease: 'power2.out'
      });
    };

    const handleMouseUp = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.1,
        ease: 'power2.out'
      });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('mouseup', handleMouseUp);
    };
  }, [withAnimation]);

  const baseStyles = 'font-semibold transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none will-change-transform relative overflow-hidden';

  const getVariantStyles = () => {
    // Common focus ring style, adjust offset color as needed, e.g., focus:ring-offset-background
    const focusRingBase = 'focus:ring-2 focus:ring-offset-1 focus:ring-offset-background';

    switch (variant) {
      case 'primary':
        return `bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-105 border border-primary/20 ${focusRingBase} focus:ring-primary`;
      case 'secondary':
        return `bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg border border-secondary/20 ${focusRingBase} focus:ring-secondary`;
      case 'danger':
        return `bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl border border-destructive/20 ${focusRingBase} focus:ring-destructive`;
      case 'success':
        return `bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl border border-green-500/20 ${focusRingBase} focus:ring-green-600`;
      case 'warning':
        return `bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl border border-orange-500/20 ${focusRingBase} focus:ring-orange-600`;
      case 'glass':
        return `glass-button text-primary border border-white/20 hover:text-primary-foreground backdrop-blur-md shadow-glass hover:shadow-glass-lg ${focusRingBase} focus:ring-primary`; // Ring color might need adjustment for glass
      case 'ghost':
        return `bg-transparent hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-accent/20 ${focusRingBase} focus:ring-accent`;
      case 'outline':
        return `bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-md hover:shadow-lg ${focusRingBase} focus:ring-primary`;
      case 'gradient':
        return `bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl border border-primary/20 ${focusRingBase} focus:ring-primary`; // Or accent
      case 'neon':
        return `bg-primary/10 text-primary border border-primary/30 shadow-glow hover:shadow-glow-lg backdrop-blur-sm hover:bg-primary/20 ${focusRingBase} focus:ring-primary`;
      case 'minimal':
        return `bg-transparent text-foreground hover:bg-muted border border-border/50 hover:border-border ${focusRingBase} focus:ring-ring`; // Using generic ring
      case 'link':
        return `bg-transparent text-primary hover:text-primary/80 underline-offset-4 hover:underline p-0 h-auto ${focusRingBase} focus:ring-primary rounded-sm`; // Links might need slightly different focus
      default:
        return `bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl border border-primary/20 ${focusRingBase} focus:ring-primary`;
    }
  };

  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const borderRadiusStyles = rounded ? 'rounded-full' : 'rounded-lg';
  const widthStyles = fullWidth ? 'w-full' : '';
  const glowStyles = glow ? 'shadow-glow hover:shadow-glow-lg' : '';

  const emojiMap: Record<string, string> = {
    "Connect to OBS": "🔗",
    "Disconnect from OBS": "🔌",
    "Start Streaming": "▶️",
    "Stop Streaming": "⏹️",
    "Start Recording": "🔴",
    "Stop Recording": "⏹️",
    "Refresh Data": "🔄",
    "Save Video Settings": "💾",
    "Send": "➡️",
    "Show": "👁️",
    "Hide": "🙈",
    "Show 🔽": "🔽",
    "Hide 🔼": "🔼",
    "Close": "🚪",
    "Settings": "⚙️",
    "Advanced": "🔧",
    "Create": "✨",
    "Assets": "🎨"
  };

  let buttonContent = children;
  if (typeof children === 'string' && emojiMap[children]) {
    buttonContent = <><span role="img" aria-hidden="true" className="mr-1.5">{emojiMap[children]}</span> {children}</>;
  } else if (typeof children === 'string' && emojiMap[children.replace(/ [🔽🔼️]/, '')]) {
    buttonContent = <><span role="img" aria-hidden="true" className="mr-1.5">{emojiMap[children.replace(/ [🔽🔼️]/, '')]}</span> {children}</>;
  }

  const renderIcon = () => {
    if (!icon) return null;
    // If children are present, icon is decorative. Otherwise, it might be an icon-only button.
    const isDecorative = React.Children.count(children) > 0 || (typeof children === 'string' && children.trim() !== '');
    return (
      <span aria-hidden={isDecorative} className={cn(
        "inline-flex items-center transition-opacity duration-200",
        iconPosition === 'left' && (children || loadingText) ? 'mr-2' : '', // Only add margin if there's text next to it
        iconPosition === 'right' && (children || loadingText) ? 'ml-2' : '', // Only add margin if there's text next to it
        isLoading && 'opacity-0'
      )}>
        {icon}
      </span>
    );
  };

  const renderLoadingSpinner = () => (
    <svg 
      className="animate-spin h-4 w-4 mr-2" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      ref={buttonRef}
      className={cn(
        baseStyles, 
        getVariantStyles(), 
        sizeStyles[size], 
        borderRadiusStyles,
        widthStyles,
        glowStyles,
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && renderLoadingSpinner()}
      {isLoading && loadingText ? (
        <span className="transition-opacity duration-200">{loadingText}</span>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          <span className="transition-opacity duration-200">{buttonContent as React.ReactNode}</span>
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </motion.button>
  );
};
