import React from 'react';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';

interface ConfigToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const ConfigToggle: React.FC<ConfigToggleProps> = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <Label htmlFor={id} className="font-semibold">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

export default ConfigToggle;