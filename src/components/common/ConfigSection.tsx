import React from 'react';

interface ConfigSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ title, children, className }) => {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
      {children}
    </div>
  );
};

export default ConfigSection;