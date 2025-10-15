import React from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
}

export const Tabs: React.FC<TabsProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className }) => (
  <div role="tablist" className={className}>{children}</div>
);

export const TabsTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string }> = ({ children, className, ...props }) => (
  <button role="tab" type="button" className={className} {...props}>{children}</button>
);

export const TabsContent: React.FC<React.HTMLAttributes<HTMLDivElement> & { value?: string }> = ({ children, className }) => (
  <div role="tabpanel" className={className}>{children}</div>
);

export default Tabs;
