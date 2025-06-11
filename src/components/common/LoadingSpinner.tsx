
import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 8 }) => {
  return (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-t-2 border-b-2 border-[var(--ctp-sky)]`}></div>
  );
};
