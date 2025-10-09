import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ConfigInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

const ConfigInput: React.FC<ConfigInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id} className="font-semibold">{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default ConfigInput;