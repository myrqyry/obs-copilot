import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'gradient' | 'neon' | 'frosted' | 'minimal';
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

  // GSAP animations
  useEffect(() => {
    if (!withAnimation || !cardRef.current) return;

    const card = cardRef.current;

    // Entrance animation
    gsap.set(card, { opacity: 0, y: 20, scale: 0.95 });
    gsap.to(card, {
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
        gsap.to(card, {
          y: -4,
          scale: 1.02,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
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

  const baseStyles = 'rounded-xl transition-all duration-300 ease-out relative overflow-hidden';
  
  const variantStyles = {
    default: 'bg-card border border-border shadow-sm hover:shadow-md',
    glass: 'glass-card backdrop-blur-md border border-white/10 shadow-glass hover:shadow-glass-lg',
    elevated: 'bg-card border border-border shadow-lg hover:shadow-xl hover:-translate-y-1',
    outlined: 'bg-transparent border-2 border-border hover:border-primary/50',
    gradient: 'bg-gradient-to-br from-card via-card/80 to-card/60 border border-border shadow-lg hover:shadow-xl',
    neon: 'bg-card/80 border border-primary/30 shadow-glow hover:shadow-glow-lg backdrop-blur-sm',
    frosted: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl',
    minimal: 'bg-transparent border border-border/50 hover:border-border'
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const hoverStyles = hover ? 'hover:scale-[1.02] hover:shadow-xl cursor-pointer' : '';
  const glowStyles = glow ? 'shadow-glow hover:shadow-glow-lg' : '';

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
    success: 'bg-green-500/10 text-green-500 border border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    error: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
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
