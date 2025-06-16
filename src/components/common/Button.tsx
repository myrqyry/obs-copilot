

import React from 'react';
import { CatppuccinAccentColorName } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  accentColorName?: CatppuccinAccentColorName;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  accentColorName,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg focus:outline-none transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center focus:ring-2 focus:ring-offset-2 focus:ring-offset-background';

  const getVariantStyles = () => {
    let styles = '';
    switch (variant) {
      case 'primary':
        styles = `bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring`;
        break;
      case 'secondary':
        styles = `bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-ring`;
        break;
      case 'danger':
        styles = `bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-ring`;
        break;
      case 'success':
        styles = `bg-green-600 text-white hover:bg-green-700 focus:ring-ring`;
        break;
      case 'warning':
        styles = `bg-orange-600 text-white hover:bg-orange-700 focus:ring-ring`;
        break;
      default:
        styles = `bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring`;
    }
    return `${styles} hover:scale-[1.03] hover:-translate-y-0.5 focus:scale-[1.03] focus:-translate-y-0.5 active:scale-[0.98]`;
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
      className={`${baseStyles} ${getVariantStyles()} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : buttonContent}
    </button>
  );
};
