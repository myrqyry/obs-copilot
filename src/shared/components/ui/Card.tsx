import React, { useRef, useEffect } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn, safeGsapTo, safeGsapSet } from '@/shared/lib/utils';
import { cardVariants, badgeVariants } from './variants';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  accentColor?: string;
  withAnimation?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant,
  size,
  hover,
  accentColor,
  withAnimation = true,
  interactive,
  glow,
  children,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

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
      className={cn(cardVariants({ variant, size, hover, glow, interactive, className }))}
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

export const CardBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>> = ({
  className,
  variant,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    >
      {children}
    </span>
  );
};
