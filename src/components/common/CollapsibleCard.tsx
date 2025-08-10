import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { FaviconIcon } from '@/components/common/FaviconIcon';
import Tooltip from '@/components/ui/Tooltip';

interface CollapsibleCardProps {
    isOpen: boolean;
    onToggle: () => void;
    title: string;
    emoji?: string;
    domain?: string;
    customSvg?: string;
    children: React.ReactNode;
    accentColor?: string;
    className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
    isOpen,
    onToggle,
    title,
    emoji,
    domain,
    customSvg,
    children,
    accentColor = '#89b4fa',
    className = ''
}) => {
    return (
        <Card
            className={
                `glass-card shadow rounded-lg transition-all duration-200 p-0 ${isOpen ? 'ring-2 ring-accent/40 scale-[1.01]' : 'hover:scale-[1.01] hover:shadow-md'} ${className}`
            }
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
                className="w-full flex items-center gap-2 px-2 py-1.5 min-h-0 bg-transparent rounded-t-lg group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
            >
                {domain && (
                    <Tooltip content={domain}>
                        {/* Ensure the span itself is not focusable if the button handles focus */}
                        <span className="flex items-center gap-1" aria-hidden="true">
                            <FaviconIcon domain={domain} size={24} />
                        </span>
                    </Tooltip>
                )}
                {customSvg && <span className="w-6 h-6" style={{ color: accentColor }} dangerouslySetInnerHTML={{ __html: customSvg }} aria-hidden="true" />}
                {emoji && <span className="text-2xl select-none" style={{ color: accentColor }} aria-hidden="true">{emoji}</span>}
                <span className="text-lg font-semibold flex-1 text-left truncate" style={{ color: accentColor }}>
                    {title}
                </span>
                <svg aria-hidden="true" className={`w-5 h-5 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <CardContent
                    id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    className="px-1 pb-1 pt-0 animate-fade-in"
                >
                    {children}
                </CardContent>
            )}
        </Card>
    );
}; 