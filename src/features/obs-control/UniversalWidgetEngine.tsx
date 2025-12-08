import React, { useMemo } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Label } from '@/shared/components/ui/label';
import { useObsWidget } from '@/shared/hooks/useObsWidget';
import { UniversalWidgetConfig } from '@/shared/types/universalWidget';
import { getWidgetComponent } from './renderers/registry';
import { cn } from '@/shared/lib/utils';

interface UniversalWidgetEngineProps {
  config: UniversalWidgetConfig;
  onUpdate?: (id: string, value: any) => void;
  className?: string;
}


const UniversalWidgetEngine: React.FC<UniversalWidgetEngineProps> = ({ 
  config, 
  onUpdate,
  className 
}) => {
  const { options, isLoading, error, executeAction, updateState } = useObsWidget(config);

  const handleValueChange = (newValue: any) => {
    // Optimistic update handled by hook/store, but we trigger the action here
    if (config.controlType === 'button') {
        executeAction(null); // Buttons usually just fire
    } else {
        executeAction(newValue);
    }
    // Notify parent if needed (legacy support)
    if (onUpdate) onUpdate(config.id, newValue);
  };

  // Resolve the correct renderer component
  const WidgetComponent = useMemo(() => getWidgetComponent(config.controlType), [config.controlType]);

  // Determine styling
  const colorTheme = config.visualConfig?.color || 'default';
  const borderColorClass = colorTheme !== 'default' ? `border-${colorTheme}-500/50` : '';

  if (error) {
    return (
      <Card className={cn("p-4 bg-destructive/10 border-destructive/20", className)}>
        <CardContent className="flex flex-col gap-2 p-0">
          <Label className="text-sm font-medium text-destructive truncate">{config.name}</Label>
          <p className="text-xs text-destructive break-words">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", borderColorClass, className)}>
      <CardContent className="p-4">
        {/* Render the specific widget strategy. */}
        <WidgetComponent
          config={config}
          value={config.state?.value ?? config.valueMapping?.defaultValue}
          onChange={handleValueChange}
          isLoading={isLoading}
          options={options}
        />
        {/* Footer/Label if not handled by the specific renderer */}
        {config.visualConfig?.showLabel && !['switch', 'slider'].includes(config.controlType) && (
           <p className="text-xs text-muted-foreground mt-2 text-center">{config.name}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(UniversalWidgetEngine);