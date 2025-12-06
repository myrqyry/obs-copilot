import React from 'react';
import { CollapsibleCard } from './CollapsibleCard';

interface CollapsibleSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  emoji: string;
  accentColor: string;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  isOpen,
  onToggle,
  title,
  emoji,
  accentColor,
  children
}) => {
  return (
    <CollapsibleCard
      isOpen={isOpen}
      onToggle={onToggle}
      title={title}
      emoji={emoji}
      accentColor={accentColor}
    >
      <div className="space-y-4">
        {children}
      </div>
    </CollapsibleCard>
  );
};
