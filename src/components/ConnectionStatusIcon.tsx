
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface ConnectionStatusIconProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: boolean;
  onClick: () => void;
}

export const ConnectionStatusIcon: React.FC<ConnectionStatusIconProps> = ({ isConnected, isConnecting, error, onClick }) => {
  const statusDotRef = useRef<HTMLDivElement>(null);

  let dotColor = 'bg-[var(--ctp-red)]'; // Default to red (disconnected/error)
  let title = 'OBS Disconnected';

  if (isConnecting) {
    dotColor = 'bg-[var(--ctp-yellow)]';
    title = 'OBS Connecting...';
  } else if (isConnected) {
    dotColor = 'bg-[var(--ctp-green)]';
    title = 'OBS Connected';
  } else if (error) {
    dotColor = 'bg-[var(--ctp-red)]';
    title = 'OBS Connection Error';
  }

  useEffect(() => {
    const dot = statusDotRef.current;
    if (dot) {
      if (isConnecting) {
        gsap.to(dot, {
          scale: 1.5,
          opacity: 0.6,
          repeat: -1,
          yoyo: true,
          duration: 0.7,
          ease: 'power1.inOut',
        });
      } else {
        gsap.killTweensOf(dot);
        gsap.set(dot, { scale: 1, opacity: 1 }); 
      }
    }
    return () => {
      if (dot) gsap.killTweensOf(dot);
    };
  }, [isConnecting]);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-[var(--ctp-surface1)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)] focus:ring-offset-2 focus:ring-offset-[var(--ctp-base)] transition-all duration-150 ease-in-out"
      aria-label="Open Connection Settings"
      title={title}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--ctp-overlay2)] group-hover:text-[var(--ctp-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <div 
        ref={statusDotRef}
        className={`absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-[var(--ctp-base)] ${dotColor} transition-colors duration-200`}
        aria-hidden="true"
      />
    </button>
  );
};
