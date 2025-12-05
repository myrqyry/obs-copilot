// src/components/common/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  animation = 'pulse',
}) => {
  const baseClass = 'bg-muted';
  const variantClass = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  }[variant];

  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  }[animation];

  return (
    <div className={cn(baseClass, variantClass, animationClass, className)} />
  );
};
