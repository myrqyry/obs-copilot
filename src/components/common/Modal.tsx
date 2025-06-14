
import React from 'react';
import { Button } from './Button';
import { CatppuccinAccentColorName } from '../../types';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isOpen?: boolean;
  accentColorName?: CatppuccinAccentColorName;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose, accentColorName }) => {
  return (
    <div className="fixed inset-0 bg-[var(--ctp-crust)] bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300 ease-in-out">
      <div className="bg-[var(--ctp-mantle)] p-6 rounded-xl shadow-2xl w-full max-w-md border border-[var(--ctp-surface1)] transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-appear">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold emoji-text" style={{ color: 'var(--dynamic-accent)' }}>{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--ctp-overlay1)] hover:text-[var(--ctp-text)] transition-colors p-1 rounded-full hover:bg-[var(--ctp-surface0)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)]"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-[var(--ctp-subtext1)] text-sm">
          {children}
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onClose}
            variant="primary"
            accentColorName={accentColorName}
          >
            Close
          </Button>
        </div>
      </div>
      {/* Keyframes are now in src/index.css 
          The .animate-modal-appear class in Tailwind expects these keyframes to be globally defined.
      */}
    </div>
  );
};