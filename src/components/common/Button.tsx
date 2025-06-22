
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { CatppuccinAccentColorName } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  accentColorName?: CatppuccinAccentColorName;
  withAnimation?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  accentColorName,
  withAnimation = true,
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

    // Hover animations
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

  const baseStyles = 'font-semibold rounded-lg transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus-ring enhanced-focus will-change-transform';

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg';
      case 'danger':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl';
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl';
      case 'warning':
        return 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl';
      case 'glass':
        return 'glass-button text-primary border hover:text-primary-foreground';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl';
    }
  };


  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs', // Reduced px
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

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
    "Close": "🚪"
  };

  let buttonContent = children;
  if (typeof children === 'string' && emojiMap[children]) {
    buttonContent = <><span role="img" aria-hidden="true" className="mr-1.5">{emojiMap[children]}</span> {children}</>;
  } else if (typeof children === 'string' && emojiMap[children.replace(/ [🔽🔼️]/, '')]) {
    buttonContent = <><span role="img" aria-hidden="true" className="mr-1.5">{emojiMap[children.replace(/ [🔽🔼️]/, '')]}</span> {children}</>;
  }


  return (
    <button
      ref={buttonRef}
      className={`${baseStyles} ${getVariantStyles()} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-2 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : buttonContent}
    </button>
  );
};
