import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface EnhancedKnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  onValueChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
}

export const EnhancedKnob: React.FC<EnhancedKnobProps> = ({
  value,
  min,
  max,
  step = 1,
  size = 'md',
  color = 'blue',
  label,
  showValue = true,
  disabled = false,
  onValueChange,
  onValueCommit
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const knobRef = useRef<HTMLDivElement>(null);

  const rotation = useMotionValue(0);
  const scale = useMotionValue(1);

  // Size configurations
  const sizeConfig = {
    sm: { size: 40, strokeWidth: 3, fontSize: 'text-xs' },
    md: { size: 60, strokeWidth: 4, fontSize: 'text-sm' },
    lg: { size: 80, strokeWidth: 5, fontSize: 'text-base' }
  };

  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;

  // Convert value to rotation (-135° to 135° = 270° total range)
  const valueToRotation = useCallback((val: number) => {
    const percentage = (val - min) / (max - min);
    return (percentage * 270) - 135;
  }, [min, max]);

  // Convert rotation to value
  const rotationToValue = useCallback((rot: number) => {
    const normalizedRot = (rot + 135) / 270;
    const rawValue = min + (normalizedRot * (max - min));
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  // Update rotation when value changes
  useEffect(() => {
    const targetRotation = valueToRotation(value);
    animate(rotation, targetRotation, {
      type: "spring",
      stiffness: 300,
      damping: 30
    });
  }, [value, rotation, valueToRotation]);

  // Handle mouse/touch start
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;

    event.preventDefault();
    setIsDragging(true);
    setStartY(event.clientY);
    setStartValue(value);
    animate(scale, 1.05, { duration: 0.1 });

    if (knobRef.current) {
      knobRef.current.setPointerCapture(event.pointerId);
    }
  }, [disabled, value, scale]);

  // Handle mouse/touch move
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging || disabled) return;

    const deltaY = startY - event.clientY; // Inverted for natural feel
    const sensitivity = (max - min) / 200; // Adjust sensitivity
    const newValue = Math.max(min, Math.min(max, startValue + (deltaY * sensitivity)));
    const steppedValue = Math.round(newValue / step) * step;

    onValueChange(steppedValue);
  }, [isDragging, disabled, startY, startValue, min, max, step, onValueChange]);

  // Handle mouse/touch end
  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    animate(scale, 1, { duration: 0.1 });

    if (knobRef.current) {
      knobRef.current.releasePointerCapture(event.pointerId);
    }

    if (onValueCommit) {
      onValueCommit(value);
    }
  }, [isDragging, scale, value, onValueCommit]);

  // Calculate progress for arc
  const progress = (value - min) / (max - min);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <label className={`font-medium text-gray-700 ${config.fontSize}`}>
          {label}
        </label>
      )}

      <div className="relative">
        {/* Background Circle */}
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`text-${color}-500 transition-all duration-200`}
          />
        </svg>

        {/* Knob */}
        <motion.div
          ref={knobRef}
          className={`
            absolute inset-2 rounded-full cursor-pointer select-none
            bg-gradient-to-br from-white to-gray-100
            shadow-lg border-2 border-gray-300
            flex items-center justify-center
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
            ${isDragging ? 'shadow-xl' : ''}
          `}
          style={{
            rotate: rotation,
            scale: scale
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          {/* Indicator dot */}
          <div
            className={`
              w-2 h-2 rounded-full bg-${color}-500
              absolute top-2 transform -translate-x-1/2
            `}
          />

          {/* Center dot */}
          <div className={`w-1 h-1 rounded-full bg-gray-400`} />
        </motion.div>
      </div>

      {showValue && (
        <div className={`${config.fontSize} font-mono text-center min-w-12`}>
          <span className="text-gray-900">{value}</span>
          {typeof min === 'number' && typeof max === 'number' && (
            <div className="text-xs text-gray-500">
              {min} - {max}
            </div>
          )}
        </div>
      )}
    </div>
  );
};