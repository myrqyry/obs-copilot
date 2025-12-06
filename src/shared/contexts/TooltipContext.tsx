import React, { createContext, useState, useContext, useCallback } from 'react';

interface TooltipContextType {
  activeTooltip: string | null;
  showTooltip: (id: string) => void;
  hideTooltip: (id: string) => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const showTooltip = useCallback((id: string) => {
    setActiveTooltip(id);
  }, []);

  const hideTooltip = useCallback((id: string) => {
    if (activeTooltip === id) {
      setActiveTooltip(null);
    }
  }, [activeTooltip]);

  return (
    <TooltipContext.Provider value={{ activeTooltip, showTooltip, hideTooltip }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};
