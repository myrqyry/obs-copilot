
import React from 'react';
import { cn } from '../../lib/utils';

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 8, className }) => {
  return (
    <div className={cn(
      `animate-spin rounded-full h-${size} w-${size} border-t-2 border-b-2 border-primary`,
      className
    )}></div>
  );
};
