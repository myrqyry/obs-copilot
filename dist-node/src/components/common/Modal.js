import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
export const Modal = ({ title, children, onClose, isOpen = true, accentColorName, actions, size = 'md', blendMode }) => {
    const modalRef = useRef(null);
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl'
    };
    // Handle escape key
    useEffect(() => {
        const handleEscape = (event) => {
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
    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };
    if (!isOpen)
        return null;
    const modalContent = (<div className="fixed inset-0 bg-background/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm transition-opacity duration-300 ease-in-out" onClick={handleBackdropClick} style={blendMode ? { mixBlendMode: blendMode } : undefined}>
      <div ref={modalRef} className={`bg-card p-6 rounded-xl shadow-2xl w-full ${sizeClasses[size]} border border-border transform transition-all duration-300 ease-out animate-modal-appear`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold emoji-text text-primary">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="text-muted-foreground text-sm">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-2 flex-wrap">
          {actions && actions.length > 0 ? (<>
              {actions.map((action, index) => (<Button key={`${action.label}-${index}`} onClick={action.onClick} variant={action.variant || 'secondary'} accentColorName={accentColorName} disabled={action.disabled} className="text-sm">
                  {action.label}
                </Button>))}
              <Button onClick={onClose} variant="secondary" accentColorName={accentColorName} className="text-sm">
                Close
              </Button>
            </>) : (<Button onClick={onClose} variant="primary" accentColorName={accentColorName}>
              Close
            </Button>)}
        </div>
      </div>
      {/* Keyframes are now in src/index.css
            The .animate-modal-appear class in Tailwind expects these keyframes to be globally defined.
        */}
    </div>);
    // Use createPortal to render the modal directly to document.body
    return createPortal(modalContent, document.body);
};
