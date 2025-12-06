import React from 'react';
import { KnobProps } from '@/types/ui';

// Placeholder for a Shadcn-like Knob component.
// In a real application, you would integrate a proper Knob component,
// potentially from a UI library like shadcn/ui or a custom implementation.
// For now, we use a basic input range to unblock development.

const Knob: React.FC<KnobProps> = ({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  onChangeEnd,
  size = 48, // Not used by input[type="range"] but kept for future compatibility
  disabled,
  className,
  unit,
}) => {
  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    if (onChangeEnd) {
      onChangeEnd(Number(event.currentTarget.value));
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label} {unit && <span className="text-muted-foreground">({value}{unit})</span>}
        </label>
      )}
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleValueChange}
        onMouseUp={handleMouseUp}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500"
        style={{ width: `${size}px`, height: `${size}px`, transform: 'rotate(270deg)' }} // Rotate to simulate knob
      />
    </div>
  );
};

export { Knob };