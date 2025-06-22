
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { CatppuccinAccentColorName } from '../../types';
import { cn } from '../../lib/utils';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  accentColorName?: CatppuccinAccentColorName;
  variant?: 'default' | 'glass';
  withAnimation?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  id,
  error,
  className = '',
  accentColorName,
  variant = 'default',
  withAnimation = true,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);

  // GSAP animations
  useEffect(() => {
    if (!withAnimation || !inputRef.current) return;

    const input = inputRef.current;
    const label = labelRef.current;

    // Entrance animation
    gsap.set([input, label], { opacity: 0, y: 10 });
    gsap.to([input, label], {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.1
    });

    // Focus animations
    const handleFocus = () => {
      gsap.to(input, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out'
      });
      if (label) {
        gsap.to(label, {
          scale: 1.05,
          color: 'hsl(var(--primary))',
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    };

    const handleBlur = () => {
      gsap.to(input, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      });
      if (label) {
        gsap.to(label, {
          scale: 1,
          color: 'hsl(var(--foreground))',
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    };

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);

    return () => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
    };
  }, [withAnimation]);

  const getInputStyles = () => {
    const baseStyles = `text-foreground placeholder-muted-foreground text-sm rounded-lg block w-full p-2.5 
                       transition-all duration-200 ease-in-out will-change-transform`;

    if (variant === 'glass') {
      return `${baseStyles} glass-input focus-ring`;
    }

    const errorStyles = error ? 'border-destructive' : 'border-border';
    const focusStyles = `focus-ring enhanced-focus hover:border-input`;

    return `${baseStyles} bg-background ${errorStyles} ${focusStyles} shadow-sm`;
  };

  return (
    <div className="w-full">
      {label && (
        <label
          ref={labelRef}
          htmlFor={id}
          className="block text-sm font-medium text-foreground mb-1 transition-all duration-200 will-change-transform"
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        className={cn(getInputStyles(), className)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive animate-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
