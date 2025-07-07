import React from 'react';
import { CollapsibleCard } from './CollapsibleCard';
export const CollapsibleSection = ({ isOpen, onToggle, title, emoji, accentColor, children }) => {
    return (<CollapsibleCard isOpen={isOpen} onToggle={onToggle} title={title} emoji={emoji} accentColor={accentColor}>
      <div className="space-y-4">
        {children}
      </div>
    </CollapsibleCard>);
};
