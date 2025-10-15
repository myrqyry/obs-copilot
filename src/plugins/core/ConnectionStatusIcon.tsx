import { Tooltip } from "@/components/ui";

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '@/lib/utils';

import useConnectionsStore from '@/store/connectionsStore';

interface ConnectionStatusIconProps {
  onClick?: () => void;
  className?: string;
  isConnected?: boolean;
  isConnecting?: boolean;
  error?: boolean;
}

export const ConnectionStatusIcon: React.FC<ConnectionStatusIconProps> = ({ onClick, isConnected, isConnecting, error }) => {
  // If status props are provided, use them; otherwise, fall back to store-driven OBS status
  const storeStatus = useConnectionsStore(state => state.obsStatus);
  let dotColor = 'bg-destructive';
  let title = 'Disconnected';
  let connecting = false;

  if (typeof isConnected === 'boolean' || typeof isConnecting === 'boolean' || typeof error === 'boolean') {
    if (error) {
      dotColor = 'bg-destructive';
      title = 'Connection Error';
    } else if (isConnected) {
      dotColor = 'bg-green-500';
      title = 'Connected';
    } else if (isConnecting) {
      dotColor = 'bg-yellow-500';
      title = 'Connecting...';
      connecting = true;
    } else {
      dotColor = 'bg-destructive';
      title = 'Disconnected';
    }
  } else {
    // Fallback to OBS status from store
    switch (storeStatus) {
      case 'connected':
        dotColor = 'bg-green-500';
        title = 'OBS Connected';
        break;
      case 'connecting':
        dotColor = 'bg-yellow-500';
        title = 'OBS Connecting...';
        connecting = true;
        break;
      case 'reconnecting':
        dotColor = 'bg-yellow-500';
        title = 'OBS Reconnecting...';
        connecting = true;
        break;
      case 'error':
        dotColor = 'bg-destructive';
        title = 'OBS Connection Error';
        break;
      case 'disconnected':
      default:
        dotColor = 'bg-destructive';
        title = 'OBS Disconnected';
        break;
    }
  }

  const statusDotRef = useRef<HTMLDivElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dot = statusDotRef.current;
    const button = statusBtnRef.current ?? null;
    if (button && !prefersReducedMotion()) {
      // Entrance animation for the whole button for polish
      try {
        gsap.fromTo(
          button,
          { opacity: 0, y: -6, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
        );
      } catch (e) {
        // ignore animation errors
      }
    }

    if (dot) {
      if (connecting && !prefersReducedMotion()) {
        try {
            gsap.to(dot, {
              scale: 1.5,
              opacity: 0.6,
              repeat: -1,
              yoyo: true,
              duration: 0.7,
              ease: 'power1.inOut',
            });
        } catch (e) {}
      } else {
        try {
            gsap.killTweensOf(dot);
            gsap.set(dot, { scale: 1, opacity: 1 });
        } catch (e) {}
      }
    }
    return () => {
        try {
            if (dot) gsap.killTweensOf(dot);
            if (button) gsap.killTweensOf(button);
        } catch(e) {}
    };
  }, [connecting]);

  return (
    <Tooltip content={title}>
      <button
        ref={statusBtnRef}
        onClick={onClick}
        className="relative p-2 rounded-full hover:bg-muted focus-ring enhanced-focus transition-all duration-150 ease-in-out"
        aria-label="Connection Status Icon"
        {...(onClick ? {} : {tabIndex: -1})}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <div
          ref={statusDotRef}
          className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-background ${dotColor} transition-colors duration-200`}
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  );
};
