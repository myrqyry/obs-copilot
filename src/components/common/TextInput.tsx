
import React from 'react';
import { CatppuccinAccentColorName } from '../../types';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  accentColorName?: CatppuccinAccentColorName; 
}

export const TextInput: React.FC<TextInputProps> = ({ label, id, error, className = '', accentColorName, ...props }) => {
  const focusStyles = `focus:ring-2 focus:ring-offset-0 focus:ring-[var(--dynamic-accent)] focus:border-[var(--dynamic-accent)]`;
  const errorStyles = error ? 'border-[var(--ctp-red)] ring-[var(--ctp-red)]' : 'border-[var(--ctp-surface1)]';
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--ctp-lavender)] mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-[var(--ctp-surface0)] ${errorStyles} text-[var(--ctp-text)] placeholder-[var(--ctp-subtext0)] 
                   text-sm rounded-lg block w-full p-2.5 transition-all duration-200 ease-in-out shadow-sm
                   focus:outline-none ${focusStyles}
                   hover:border-[var(--ctp-overlay1)]
                   focus:shadow-[0_0_0_3px_color-mix(in_srgb,_var(--dynamic-accent)_30%,_transparent)]
                   ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[var(--ctp-red)]">{error}</p>}
    </div>
  );
};
