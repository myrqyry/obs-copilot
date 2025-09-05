import React from 'react';
import { Slider as ShadcnSlider } from '@/components/ui/slider'; // Assuming shadcn/ui slider is available
import { SliderProps } from '@/types/ui';

const Slider: React.FC<SliderProps> = ({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  onChangeEnd,
  disabled,
  className,
  unit,
}) => {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handleValueCommit = (values: number[]) => {
    if (onChangeEnd) {
      onChangeEnd(values[0]);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label} {unit && <span className="text-muted-foreground">({value}{unit})</span>}
        </label>
      )}
      <ShadcnSlider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};

export { Slider };