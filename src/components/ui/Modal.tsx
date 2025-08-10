import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { CatppuccinAccentColorName } from '@/types';

interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isOpen?: boolean;
  accentColorName?: CatppuccinAccentColorName;
  actions?: ModalAction[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  blendMode?: React.CSSProperties['mixBlendMode'];
}

export const Modal: React.FC<ModalProps> = ({
  title,
  children,
  onClose,
  isOpen = true,
  accentColorName,
  actions,
  size = 'md',
  blendMode
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const contentId = React.useId();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Handle click outside
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-background/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      onClick={handleBackdropClick}
      style={blendMode ? { mixBlendMode: blendMode } : undefined}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId}
        className={`bg-card p-6 rounded-xl shadow-2xl w-full ${sizeClasses[size]} border border-border transform transition-all duration-300 ease-out animate-modal-appear`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id={titleId} className="text-xl font-semibold emoji-text text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-card"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id={contentId} className="text-muted-foreground text-sm">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-2 flex-wrap">
          {actions && actions.length > 0 ? (
            <>
              {actions.map((action, index) => (
                <Button
                  key={`${action.label}-${index}`}
                  onClick={action.onClick}
                  variant={action.variant === 'danger' ? 'destructive' : action.variant === 'primary' ? 'default' : (action.variant === 'success' ? 'default' : (action.variant === 'warning' ? 'destructive' : 'secondary'))}
                  disabled={action.disabled}
                  className="text-sm"
                >
                  {action.label}
                </Button>
              ))}
              <Button
                onClick={onClose}
                variant="secondary"
                className="text-sm"
              >
                Close
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              variant="default"
            >
              Close
            </Button>
          )}
        </div>
      </div>
      {/* Keyframes are now in src/index.css 
          The .animate-modal-appear class in Tailwind expects these keyframes to be globally defined.
      */}
    </div>
  );

  // Use createPortal to render the modal directly to document.body
  return createPortal(modalContent, document.body);
};