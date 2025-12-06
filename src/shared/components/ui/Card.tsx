import React, { useRef, useEffect } from 'react';
import { cn, safeGsapTo, safeGsapSet } from '@/shared/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient' | 'neon' | 'frosted' | 'minimal' | 'accent-gradient' | 'accent-outline' | 'primary-glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  accentColor?: string;
  withAnimation?: boolean;
  interactive?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  size = 'md',
  hover = false,
  accentColor,
  withAnimation = true,
  interactive = false,
  glow = false,
  children,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const baseStyles = 'rounded-xl transition-all duration-300 ease-out relative overflow-hidden';
  
  const variantStyles = {
    default: 'bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/20',
    glass: 'glass-card backdrop-blur-md border border-white/10 shadow-glass hover:shadow-glass-lg hover:border-accent/20',
    elevated: 'bg-card border border-border shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-primary/30',
    outlined: 'bg-transparent border-2 border-border hover:border-primary/50 hover:shadow-sm',
    gradient: 'bg-gradient-to-br from-card via-card/80 to-card/60 border border-border shadow-lg hover:shadow-xl hover:border-accent/40',
    neon: 'bg-card/80 border border-primary/30 shadow-glow hover:shadow-glow-lg backdrop-blur-sm hover:border-accent/50',
    frosted: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl hover:border-primary/20',
    minimal: 'bg-transparent border border-border/50 hover:border-accent/60',
    // New accent-focused variants
    'accent-gradient': 'bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 shadow-sm hover:shadow-md hover:border-accent/40',
    'accent-outline': 'bg-transparent border-2 border-accent/30 hover:border-accent hover:bg-accent/5 shadow-sm hover:shadow-md',
    'primary-glow': 'bg-card border border-primary/40 shadow-glow hover:shadow-glow-lg hover:border-primary/60 backdrop-blur-sm'
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const hoverStyles = hover ? 'hover:scale-[1.02] hover:shadow-xl cursor-pointer' : '';
  const glowStyles = glow ? 'shadow-glow hover:shadow-glow-lg' : '';

  // GSAP animations
  useEffect(() => {
    if (!withAnimation || !cardRef.current) return;

    const card = cardRef.current;

    // Entrance animation
    safeGsapSet(card, { opacity: 0, y: 20, scale: 0.95 });
    safeGsapTo(card, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
      delay: Math.random() * 0.1
    });

    // Interactive hover animations
    if (interactive) {
      const handleMouseEnter = () => {
        safeGsapTo(card, {
          y: -4,
          scale: 1.02,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      const handleMouseLeave = () => {
        safeGsapTo(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [withAnimation, interactive]);

  return (
    <div
      ref={cardRef}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        hoverStyles,
        glowStyles,
        interactive && 'cursor-pointer',
        className
      )}
      style={accentColor ? { '--accent-color': accentColor } as React.CSSProperties : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex items-center justify-between pt-4 border-t border-border/50', className)} {...props}>
    {children}
  </div>
);

export const CardBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-accent/10 text-accent border border-accent/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-info/10 text-info border border-info/20'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
