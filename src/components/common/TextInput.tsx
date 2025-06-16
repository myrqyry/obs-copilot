
import React from 'react';
import { CatppuccinAccentColorName } from '../../types';
import { cn } from '../../lib/utils';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  accentColorName?: CatppuccinAccentColorName;
}

export const TextInput: React.FC<TextInputProps> = ({ label, id, error, className = '', accentColorName, ...props }) => {
  const focusStyles = `focus:ring-2 focus:ring-ring focus:border-ring`;
  const errorStyles = error ? 'border-destructive ring-destructive' : 'border-border';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          `bg-background ${errorStyles} text-foreground placeholder-muted-foreground 
           text-sm rounded-lg block w-full p-2.5 transition-all duration-200 ease-in-out shadow-sm
           focus:outline-none ${focusStyles}
           hover:border-input
           focus:shadow-[0_0_0_3px_hsl(var(--ring)_/_0.3)]`,
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
};
