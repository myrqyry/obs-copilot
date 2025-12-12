import React, { useState, useCallback } from 'react';
import { Slider } from '@/shared/components/ui/slider';
import { useWidgetsStore } from '@/app/store/widgetsStore';
import ComprehensiveErrorBoundary from '@/shared/components/common/ComprehensiveErrorBoundary';
import { UniversalWidgetConfig } from '@/shared/types/universalWidget';

interface UniversalSliderProps {
  config: UniversalWidgetConfig;
}

export const UniversalSlider: React.FC<UniversalSliderProps> = ({ config }) => {
  const { id, valueMapping } = config;
  const [value, setValue] = useState<number>(valueMapping?.defaultValue || 0);
  const [error, setError] = useState<string | null>(null);
  const { executeAction } = useWidgetsStore();

  const handleValueChange = useCallback(async (newValue: number | number[]) => {
    const normalized = Array.isArray(newValue) ? newValue[0] : newValue;
    setValue(normalized);
    try {
      await executeAction(id, 'setProperty' as any, normalized, { targetType: config.targetType, targetName: config.targetName });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [id, executeAction, config.targetType, config.targetName]);

  if (error) {
    return (
      <div className="p-2 bg-error/10 text-error rounded">
        Error: {error}
        <button onClick={() => setError(null)} className="ml-2 px-2 py-1 bg-error/100 text-foreground rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <ComprehensiveErrorBoundary>
      <div className="p-2 border rounded bg-background">
        <Slider 
          value={value} 
          onChange={handleValueChange} 
          min={valueMapping?.min || 0} 
          max={valueMapping?.max || 100} 
          step={valueMapping?.step || 1}
          className="w-full"
        />
      </div>
    </ComprehensiveErrorBoundary>
  );
};