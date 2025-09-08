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
  // Normalize incoming value and change callbacks to support both number and number[]
  const currentValue = Array.isArray(value) ? value[0] : value;

  const handleValueChange = (values: number[] | number) => {
    if (Array.isArray(values)) {
      onChange(values[0]);
    } else {
      onChange(values);
    }
  };

  const handleValueCommit = (values: number[] | number) => {
    if (!onChangeEnd) return;
    if (Array.isArray(values)) {
      onChangeEnd(values[0]);
    } else {
      onChangeEnd(values);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label} {unit && <span className="text-muted-foreground">({value}{unit})</span>}
        </label>
      )}
      {/* Cast to any to bridge differences between this wrapper's SliderProps and the underlying ShadcnSlider implementation */}
      <ShadcnSlider
        {...( {
          id,
          min,
          max,
          step,
          value: [currentValue],
          onValueChange: handleValueChange,
          onValueCommit: handleValueCommit,
          disabled,
          className: 'w-full'
        } as any )}
      />
    </div>
  );
};

export { Slider };