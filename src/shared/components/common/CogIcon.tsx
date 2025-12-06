import React from 'react';

export const CogIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.25 2.25c.966 0 1.75.784 1.75 1.75v.5a7.5 7.5 0 013.5 1.5l.354-.354a1.75 1.75 0 112.475 2.475l-.354.354a7.5 7.5 0 011.5 3.5h.5a1.75 1.75 0 110 3.5h-.5a7.5 7.5 0 01-1.5 3.5l.354.354a1.75 1.75 0 11-2.475 2.475l-.354-.354a7.5 7.5 0 01-3.5 1.5v.5a1.75 1.75 0 11-3.5 0v-.5a7.5 7.5 0 01-3.5-1.5l-.354.354a1.75 1.75 0 11-2.475-2.475l.354-.354a7.5 7.5 0 01-1.5-3.5h-.5a1.75 1.75 0 110-3.5h.5a7.5 7.5 0 011.5-3.5l-.354-.354A1.75 1.75 0 115.646 4.646l.354.354a7.5 7.5 0 013.5-1.5v-.5c0-.966.784-1.75 1.75-1.75zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"
        />
    </svg>
);
