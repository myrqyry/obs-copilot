import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface UsePortalOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  preventBodyScroll?: boolean;
  portalId?: string; // Optional ID for the portal root element
}

/**
 * A custom hook to manage portal rendering and common modal/tooltip behaviors.
 * Encapsulates logic for:
 * - Rendering content into a portal (outside the component's DOM hierarchy)
 * - Handling escape key to close
 * - Handling clicks outside the content to close (backdrop click)
 * - Preventing body scroll when the portal is open
 *
 * @param options Configuration options for the portal.
 * @returns A function that takes the portal content and returns a ReactNode (the portal).
 */
export function usePortal(options: UsePortalOptions) {
  const {
    isOpen,
    onClose,
    closeOnEscape = true,
    closeOnBackdropClick = true,
    preventBodyScroll = true,
    portalId = 'portal-root', // Default portal root ID
  } = options;

  const portalRootRef = useRef<HTMLElement | null>(null);

  // Ensure the portal root element exists in the DOM
  useEffect(() => {
    let element = document.getElementById(portalId);
    if (!element) {
      element = document.createElement('div');
      element.setAttribute('id', portalId);
      document.body.appendChild(element);
    }
    portalRootRef.current = element;
  }, [portalId]);

  // Handle escape key and body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    if (closeOnEscape) {
      document.addEventListener('keydown', handleEscape);
    }

    if (preventBodyScroll) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (closeOnEscape) {
        document.removeEventListener('keydown', handleEscape);
      }
      if (preventBodyScroll) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, onClose, closeOnEscape, preventBodyScroll]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnBackdropClick]
  );

  const renderPortal = useCallback(
    (content: React.ReactNode, backdropClassName?: string, backdropStyle?: React.CSSProperties) => {
      if (!isOpen || !portalRootRef.current) return null;

      const portalContent = (
        <div
          className={backdropClassName || "fixed inset-0 bg-background/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm transition-opacity duration-300 ease-in-out"}
          onClick={handleBackdropClick}
          style={backdropStyle}
        >
          {content}
        </div>
      );

      return createPortal(portalContent, portalRootRef.current);
    },
    [isOpen, handleBackdropClick, portalRootRef]
  );

  return renderPortal;
}
