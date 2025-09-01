import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { CatppuccinAccentColorName } from '../../types';
import { cn } from '../../lib/utils';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  accentColorName?: CatppuccinAccentColorName;
  variant?: 'default' | 'glass' | 'outlined' | 'filled' | 'minimal' | 'expressive';
  size?: 'sm' | 'md' | 'lg';
  withAnimation?: boolean;
  floatLabel?: boolean; // New prop to control floating label behavior
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  fullWidth?: boolean;
  rounded?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  id,
  error,
  success,
  hint,
  className = '',
  accentColorName,
  variant = 'default',
  size = 'md',
  withAnimation = true,
  leftIcon,
  rightIcon,
  loading = false,
  clearable = false,
  onClear,
  fullWidth = false,
  rounded = false,
  value,
  onChange,
  floatLabel = false, // Default to false, enable for specific variants
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);

  const [isFocused, setIsFocused] = React.useState(false);

  // GSAP animations (restored)
  useEffect(() => {
    if (!withAnimation || !containerRef.current) return;

    const container = containerRef.current;

    // Entrance animation
    gsap.set(container, { opacity: 0, y: 20 });
    gsap.to(container, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
      delay: Math.random() * 0.1
    });

    return () => {
      gsap.killTweensOf(container);
    };
  }, [withAnimation]);

  // Floating label animation for 'outlined' and 'expressive' variants
  useEffect(() => {
    const shouldFloat = floatLabel || variant === 'expressive' || variant === 'outlined';

    if (shouldFloat && labelRef.current && inputRef.current) {
      const label = labelRef.current;
      const isActive = isFocused || (value && String(value).length > 0);

      if (isActive) {
        gsap.to(label, {
          top: '-0.75rem', // Adjust this value based on desired floating position
          fontSize: '0.75rem', // Smaller font size when floating
          duration: 0.2,
          ease: 'power2.out',
          color: error ? 'var(--destructive)' : success ? 'var(--green-600)' : 'var(--ring)'
        });
      } else {
        gsap.to(label, {
          top: '50%',
          fontSize: '1rem', // Original font size
          duration: 0.2,
          ease: 'power2.out',
          color: 'var(--muted-foreground)'
        });
      }
    }
  }, [isFocused, value, variant, error, success, floatLabel]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (withAnimation && containerRef.current && !floatLabel && variant !== 'expressive' && variant !== 'outlined') {
      gsap.to(containerRef.current, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (withAnimation && containerRef.current && !floatLabel && variant !== 'expressive' && variant !== 'outlined') {
      gsap.to(containerRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
    props.onBlur?.(e);
  };

  const handleClear = () => {
    if (inputRef.current) {
      if (onChange) {
        // Fire a synthetic event to clear the value.
        // Cast via unknown first to satisfy TypeScript's strict event type checks.
        const syntheticEvent = {
          ...new Event('input', { bubbles: true }),
          target: { value: '' }
        };
        onChange(syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement>);
      }
      inputRef.current.value = '';
      onClear?.();
      inputRef.current.focus();
    }
  };

  const getInputStyles = () => {
    const baseStyles = 'w-full transition-all duration-200 ease-in-out border focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      default: 'bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20',
      glass: 'glass-input border-white/10 text-foreground placeholder:text-muted-foreground focus:border-white/20 focus:ring-white/20 backdrop-blur-md',
      outlined: 'bg-transparent border-2 border-border text-foreground placeholder:text-transparent focus:border-ring focus:ring-ring/20 pt-6 pb-2', // Adjust padding for floating label
      filled: 'bg-muted border-transparent text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-ring focus:ring-ring/20',
      minimal: 'bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 rounded-none',
      expressive: 'bg-muted border-b-2 border-muted-foreground/50 text-foreground placeholder:text-transparent focus:border-ring focus:ring-ring/20 pt-6 pb-2' // Adjust padding for floating label
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-4 py-3 text-base'
    };

    const borderRadiusStyles = rounded ? 'rounded-full' : 'rounded-lg';
    const widthStyles = fullWidth ? 'w-full' : '';

    const stateStyles = error
      ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
      : success
        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
        : '';

    return cn(baseStyles, variantStyles[variant], sizeStyles[size], borderRadiusStyles, widthStyles, stateStyles);
  };

  const getLabelStyles = () => {
    const baseStyles = 'block text-sm font-medium transition-colors duration-200';
    const stateStyles = error
      ? 'text-destructive'
      : success
        ? 'text-green-600'
        : 'text-foreground';

    const shouldFloat = floatLabel || variant === 'expressive' || variant === 'outlined';

    if (shouldFloat) {
      return cn(
        'absolute left-3 -translate-y-1/2 pointer-events-none transform transition-all duration-200 ease-in-out',
        isFocused || (value && String(value).length > 0) ? 'text-xs top-2.5' : 'text-base top-1/2',
        error ? 'text-destructive' : success ? 'text-green-600' : 'text-muted-foreground'
      );
    }

    return cn(baseStyles, stateStyles);
  };

  const getHintStyles = () => {
    const baseStyles = 'mt-1 text-xs transition-colors duration-200';
    const stateStyles = error
      ? 'text-destructive'
      : success
        ? 'text-green-600'
        : 'text-muted-foreground';

    return cn(baseStyles, stateStyles);
  };

  const renderClearButton = () => {
    if (!clearable || !value) return null;

    return (
      <button
        type="button"
        onClick={handleClear}
        className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-full hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Clear input"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );
  };

  const renderLoadingSpinner = () => {
    if (!loading) return null;

    return (
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <svg
          className="animate-spin h-4 w-4 text-muted-foreground"
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
      </div>
    );
  };

  const shouldFloatLabel = floatLabel || variant === 'expressive' || variant === 'outlined';

  return (
    <div ref={containerRef} className={cn('space-y-1', className)}>
      <div className="relative">
        {label && shouldFloatLabel ? (
          <label
            ref={labelRef}
            htmlFor={id}
            className={getLabelStyles()}
          >
            {label}
          </label>
        ) : (
          label && (
            <label htmlFor={id} className={getLabelStyles()}>
              {label}
            </label>
          )
        )}

        {leftIcon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors duration-200",
            shouldFloatLabel && (isFocused || (value && String(value).length > 0)) ? 'top-2/3' : ''
          )}>
            {leftIcon}
          </div>
        )}

        <input
          ref={inputRef}
          id={id}
          className={cn(
            getInputStyles(),
            leftIcon && 'pl-10',
            (rightIcon || clearable || loading) && 'pr-10'
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={hint || error || success ? `${id}-description` : undefined}
          {...props}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {renderClearButton()}
          {renderLoadingSpinner()}
          {rightIcon && !loading && (
            <div className="text-muted-foreground transition-colors duration-200" aria-hidden="true">
              {rightIcon}
            </div>
          )}
        </div>
      </div>

      {(hint || error || success) && (
        <p id={`${id}-description`} className={getHintStyles()}>
          {error || success || hint}
        </p>
      )}
    </div>
  );
};
