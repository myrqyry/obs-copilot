import { Tooltip } from "@/components/ui";

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '@/lib/utils';

import useConnectionsStore from '@/store/connections';
import { ConnectionStatus } from '@/services/obsClient';

interface ConnectionStatusIconProps {
  onClick?: () => void;
  className?: string;
}

export const ConnectionStatusIcon: React.FC<ConnectionStatusIconProps> = ({ onClick }) => {
  const status = useConnectionsStore(state => state.obsStatus);
  const statusDotRef = useRef<HTMLDivElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);

  const getStatusInfo = (status: ConnectionStatus): { color: string; title: string; isConnecting: boolean } => {
    switch (status) {
      case 'connected':
        return { color: 'bg-green-500', title: 'OBS Connected', isConnecting: false };
      case 'connecting':
        return { color: 'bg-yellow-500', title: 'OBS Connecting...', isConnecting: true };
      case 'reconnecting':
        return { color: 'bg-yellow-500', title: 'OBS Reconnecting...', isConnecting: true };
      case 'error':
        return { color: 'bg-destructive', title: 'OBS Connection Error', isConnecting: false };
      case 'disconnected':
      default:
        return { color: 'bg-destructive', title: 'OBS Disconnected', isConnecting: false };
    }
  };

  const { color: dotColor, title, isConnecting } = getStatusInfo(status);

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
      if (isConnecting && !prefersReducedMotion()) {
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
  }, [isConnecting]);

  return (
    <Tooltip content={title}>
      <button
        ref={statusBtnRef}
        onClick={onClick} // Keep onClick, but allow it to be undefined
        className="relative p-2 rounded-full hover:bg-muted focus-ring enhanced-focus transition-all duration-150 ease-in-out"
        aria-label="Connection Status Icon" // Change label as it's not strictly for opening settings now
        {...(onClick ? {} : {tabIndex: -1})} // Make it unfocusable if no onClick is provided
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
