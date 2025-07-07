import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { FaviconIcon } from './FaviconIcon';
import Tooltip from '../ui/Tooltip';
export const CollapsibleCard = ({ isOpen, onToggle, title, emoji, domain, customSvg, children, accentColor = '#89b4fa', className = '' }) => {
    return (<Card className={`glass-card shadow rounded-lg transition-all duration-200 p-0 ${isOpen ? 'ring-2 ring-accent/40 scale-[1.01]' : 'hover:scale-[1.01] hover:shadow-md'} ${className}`}>
            <button className="w-full flex items-center gap-2 px-2 py-0 min-h-0 bg-transparent rounded-t-lg focus:outline-none group" onClick={onToggle} aria-expanded={isOpen}>
                {domain && (<Tooltip content={domain}>
                        <span className="flex items-center gap-1">
                            <FaviconIcon domain={domain} size={24}/>
                        </span>
                    </Tooltip>)}
                {customSvg && <span className="w-6 h-6" style={{ color: accentColor }} dangerouslySetInnerHTML={{ __html: customSvg }}/>}
                {emoji && <span className="text-2xl select-none" style={{ color: accentColor }}>{emoji}</span>}
                <span className="text-lg font-semibold flex-1 text-left truncate" style={{ color: accentColor }}>
                    {title}
                </span>
                <svg className={`w-5 h-5 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
            {isOpen && (<CardContent className="px-1 pb-1 pt-0 animate-fade-in">
                    {children}
                </CardContent>)}
        </Card>);
};
