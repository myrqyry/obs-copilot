import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

type TabsContextType = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

export const Tabs: React.FC<{
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children?: ReactNode;
  className?: string;
}> = ({ defaultValue = '', value, onValueChange, children, className }) => {
  const [internal, setInternal] = useState<string>(defaultValue);

  const active = value ?? internal;
  const setValue = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };

  const ctx = useMemo(() => ({ value: active, setValue }), [active]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div role="tablist" className={className} {...props}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  className?: string;
  children?: ReactNode;
}> = ({ value, className, children }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) return <button className={className}>{children}</button>;

  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={className}
      data-value={value}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children?: ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const ctx = useContext(TabsContext);
  if (!ctx) return null;
  return <div role="tabpanel" hidden={ctx.value !== value} className={className}>{children}</div>;
};

export default Tabs;
