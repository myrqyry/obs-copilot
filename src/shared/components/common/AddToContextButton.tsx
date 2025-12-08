import React from 'react';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface AddToContextButtonProps {
  contextText: string;
  onAddToContext: (text: string) => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export const AddToContextButton: React.FC<AddToContextButtonProps> = ({
  contextText,
  onAddToContext,
  title = 'Add to chat context',
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={() => onAddToContext(contextText)}
      disabled={disabled}
      className={cn(
        `ml-2 p-1 rounded-full border border-border bg-card/90 text-muted-foreground
         hover:text-accent hover:bg-accent/10 shadow-md transition-all duration-200
         flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent/50`,
        className
      )}
      title={title}
      aria-label={title}
    >
      <PlusCircle className="w-4 h-4" />
    </button>
  );
};
