import * as React from "react";
import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { safeGsapTo } from '@/lib/utils';

import { cn } from "@/lib/utils";

interface TextareaProps extends React.ComponentPropsWithoutRef<"textarea"> {
  label?: string;
  id?: string;
  error?: string;
  success?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, error, success, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const labelRef = useRef<HTMLLabelElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isFocused, setIsFocused] = useState(false);

    // Combine the passed ref with the internal ref
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Floating label animation
    useEffect(() => {
      if (labelRef.current && textareaRef.current) {
        const labelElement = labelRef.current;
        const isActive = isFocused || (value && String(value).length > 0);

        if (isActive) {
          safeGsapTo(labelElement, {
            top: '-0.75rem', // Adjust this value based on desired floating position
            fontSize: '0.75rem', // Smaller font size when floating
            duration: 0.2,
            ease: 'power2.out',
            color: error ? 'var(--destructive)' : success ? 'var(--green-600)' : 'var(--ring)'
          });
        } else {
          safeGsapTo(labelElement, {
            top: '50%',
            fontSize: '1rem', // Original font size
            duration: 0.2,
            ease: 'power2.out',
            color: 'var(--muted-foreground)'
          });
        }
      }
    }, [isFocused, value, error, success]);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const getLabelStyles = () => {
      return cn(
        'absolute left-3 -translate-y-1/2 pointer-events-none transform transition-all duration-200 ease-in-out',
        isFocused || (value && String(value).length > 0) ? 'text-xs top-2.5' : 'text-base top-1/2',
        error ? 'text-destructive' : success ? 'text-accent' : 'text-muted-foreground'
      );
    };

    return (
      <div ref={containerRef} className="relative w-full">
        {label && (
          <label
            ref={labelRef}
            htmlFor={id}
            className={getLabelStyles()}
          >
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pt-6 pb-2", // Adjusted padding and placeholder
            className
          )}
          id={id}
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
