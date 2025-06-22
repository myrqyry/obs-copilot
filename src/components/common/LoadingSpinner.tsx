
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'pulse' | 'dots' | 'bars';
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 8,
  className,
  variant = 'default',
  color = 'primary'
}) => {
  const spinnerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spinnerRef.current) return;

    const element = spinnerRef.current;

    switch (variant) {
      case 'pulse':
        gsap.to(element, {
          scale: 1.2,
          opacity: 0.8,
          duration: 1,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
        break;

      case 'dots':
        if (dotsRef.current) {
          const dots = dotsRef.current.children;
          gsap.to(dots, {
            scale: 1.5,
            duration: 0.6,
            ease: 'power2.inOut',
            stagger: 0.2,
            repeat: -1,
            yoyo: true
          });
        }
        break;

      case 'bars':
        if (barsRef.current) {
          const bars = barsRef.current.children;
          gsap.to(bars, {
            scaleY: 2,
            duration: 0.8,
            ease: 'power2.inOut',
            stagger: 0.1,
            repeat: -1,
            yoyo: true
          });
        }
        break;

      default:
        gsap.to(element.querySelector('.spinner-circle'), {
          rotation: 360,
          duration: 1,
          ease: 'none',
          repeat: -1
        });
    }
  }, [variant]);

  const getColorStyles = () => {
    switch (color) {
      case 'accent': return 'text-accent border-accent bg-accent';
      case 'success': return 'text-green-500 border-green-500 bg-green-500';
      case 'warning': return 'text-orange-500 border-orange-500 bg-orange-500';
      case 'destructive': return 'text-destructive border-destructive bg-destructive';
      default: return 'text-primary border-primary bg-primary';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'accent': return 'text-accent border-accent';
      case 'success': return 'text-green-500 border-green-500';
      case 'warning': return 'text-orange-500 border-orange-500';
      case 'destructive': return 'text-destructive border-destructive';
      default: return 'text-primary border-primary';
    }
  };

  const sizeClasses = {
    4: 'h-4 w-4',
    5: 'h-5 w-5',
    6: 'h-6 w-6',
    8: 'h-8 w-8',
    10: 'h-10 w-10',
    12: 'h-12 w-12'
  };

  const sizeClass = sizeClasses[size as keyof typeof sizeClasses] || `h-${size} w-${size}`;

  if (variant === 'dots') {
    const colorStyles = getColorStyles();
    return (
      <div ref={spinnerRef} className={cn('flex items-center justify-center space-x-1', className)}>
        <div ref={dotsRef} className="flex space-x-1">
          <div className={cn('rounded-full h-2 w-2', colorStyles.split(' ')[2])}></div>
          <div className={cn('rounded-full h-2 w-2', colorStyles.split(' ')[2])}></div>
          <div className={cn('rounded-full h-2 w-2', colorStyles.split(' ')[2])}></div>
        </div>
      </div>
    );
  }

  if (variant === 'bars') {
    const colorStyles = getColorStyles();
    return (
      <div ref={spinnerRef} className={cn('flex items-center justify-center space-x-1', className)}>
        <div ref={barsRef} className="flex items-end space-x-1">
          <div className={cn('rounded-sm w-1 h-4', colorStyles.split(' ')[2])}></div>
          <div className={cn('rounded-sm w-1 h-6', colorStyles.split(' ')[2])}></div>
          <div className={cn('rounded-sm w-1 h-4', colorStyles.split(' ')[2])}></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={spinnerRef} className={cn(sizeClass, 'relative', className)}>
      <div className={cn(
        'spinner-circle rounded-full border-2 border-transparent',
        sizeClass,
        getColorClass()
      )}>
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent border-t-current',
          variant === 'pulse' ? 'animate-pulse' : ''
        )}></div>
      </div>
    </div>
  );
};
