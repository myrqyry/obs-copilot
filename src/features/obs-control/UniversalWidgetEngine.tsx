import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Slider } from '@/shared/components/ui/slider';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useObsWidget } from '@/shared/hooks/useObsWidget';
import { UniversalWidgetConfig, WidgetControlType } from '@/shared/types/universalWidget';
import { logger } from '@/shared/utils/logger';

interface UniversalWidgetEngineProps {
  config: UniversalWidgetConfig;
  onUpdate?: (id: string, value: any) => void;
}

const UniversalWidgetEngine: React.FC<UniversalWidgetEngineProps> = ({ config, onUpdate }) => {
  const { options, isLoading, error, executeAction, updateState } = useObsWidget(config);

  const handleValueChange = (value: any) => {
    updateState({ value });
    if (onUpdate) onUpdate(config.id, value);
  };

  if (error) {
    return (
      <Card className="p-4 bg-error/10 border-error/20">
        <CardContent className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-error">{config.name}</Label>
          <p className="text-sm text-error">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <CardContent className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{config.name}</Label>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const renderWidget = () => {
    switch (config.controlType) {
      case WidgetControlType.BUTTON:
        return (
          <Button
            onClick={() => executeAction(null)}
            className="w-full bg-primary hover:bg-primary"
            disabled={isLoading}
            aria-label={`Button ${config.name}`}
          >
            {config.name}
          </Button>
        );
      case WidgetControlType.SWITCH:
        const boolValue = config.state?.value === true || config.state?.value === 'true';
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={boolValue}
              onCheckedChange={(checked: boolean) => handleValueChange(checked)}
              disabled={isLoading}
              aria-label={`Switch ${config.name}`}
            />
            <Label className="text-sm font-medium">{config.name}</Label>
          </div>
        );
      case WidgetControlType.SLIDER:
        const numValue = Number(config.state?.value) || 0;
        const { min = 0, max = 100, step = 1 } = config.valueMapping || {};
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Slider
              value={[numValue]}
              onValueChange={(value: number[]) => handleValueChange(value[0])}
              min={min}
              max={max}
              step={step}
              disabled={isLoading}
              className="w-full"
              aria-label={`Slider ${config.name}`}
            />
          </div>
        );
      case WidgetControlType.PICKER:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Select value={config.state?.value || ''} onValueChange={handleValueChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options
                  .filter((opt: string | null | undefined) => opt !== '' && opt != null)
                  .map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );
      case WidgetControlType.STEPPER:
        const stepValue = Number(config.state?.value) || 0;
        const { min: stepMin = 0, max: stepMax = 10, step: stepStep = 1 } = config.valueMapping || {};
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Slider
              value={[stepValue]}
              onValueChange={(value: number[]) => handleValueChange(value[0])}
              min={stepMin}
              max={stepMax}
              step={stepStep}
              disabled={isLoading}
              className="w-full"
              aria-label={`Stepper ${config.name}`}
            />
          </div>
        );
      case WidgetControlType.COLOR:
        // Ensure color values are valid hex for input[type=color]
        const normalizeColor = (c: any) => {
          if (!c) return '#000000';
          if (typeof c === 'string' && /^#([0-9A-Fa-f]{6})$/.test(c)) return c;
          return '#000000';
        };

        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <input
              type="color"
              value={normalizeColor(config.state?.value)}
              onChange={(e) => handleValueChange(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 border rounded"
              aria-label={`Color picker ${config.name}`}
            />
          </div>
        );
      case WidgetControlType.TEXT:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Input
              value={config.state?.value || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
              disabled={isLoading}
              className="w-full"
              aria-label={`Text input ${config.name}`}
            />
          </div>
        );
      case WidgetControlType.MULTI:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Select value={config.state?.value || ''} onValueChange={handleValueChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {options
                  .filter((opt: string | null | undefined) => opt !== '' && opt != null)
                  .map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        );
      case WidgetControlType.STATUS:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Badge variant="secondary" className="text-xs">
              {config.state?.value || 'Status'}
            </Badge>
          </div>
        );
      case WidgetControlType.PROGRESS:
        const progressValue = Number(config.state?.value) || 0;
        const { min: progressMin = 0, max: progressMax = 100 } = config.valueMapping || {};
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <Slider
              value={[progressValue]}
              onValueChange={(value: number[]) => handleValueChange(value[0])}
              min={progressMin}
              max={progressMax}
              step={1}
              disabled={isLoading}
              className="w-full"
              aria-label={`Progress bar ${config.name}`}
            />
          </div>
        );
      case WidgetControlType.METER:
        const meterValue = Number(config.state?.value) || 0;
        const { min: meterMin = 0, max: meterMax = 100 } = config.valueMapping || {};
        const percentage = meterMax > meterMin ? ((meterValue - meterMin) / (meterMax - meterMin)) * 100 : 0;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${clampedPercentage}%` }}
                aria-label={`Meter ${config.name} at ${clampedPercentage.toFixed(0)}%`}
              ></div>
            </div>
            <span className="text-xs text-muted-foreground">{clampedPercentage.toFixed(0)}%</span>
          </div>
        );
      case WidgetControlType.CHART:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <div className="w-full h-32 bg-muted rounded border" aria-label={`Chart ${config.name}`}>
              <p className="text-xs text-muted-foreground p-2">Chart placeholder</p>
            </div>
          </div>
        );
      case WidgetControlType.CUSTOM:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <div className="w-full p-2 bg-muted/30 rounded border" aria-label={`Custom widget ${config.name}`}>
              <p className="text-xs text-muted-foreground">Custom widget content</p>
            </div>
          </div>
        );
      default:
        return (
          <Card className="p-4">
            <CardContent>
              <Label className="text-sm font-medium">{config.name}</Label>
              <p className="text-sm text-muted-foreground">Control type not implemented yet</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Card className={`p-4 ${config.visualConfig?.color ? `border-${config.visualConfig.color}` : ''}`}>
      <CardContent>
        {renderWidget()}
        {config.visualConfig?.showLabel && (
          <p className="text-xs text-muted-foreground mt-1">{config.name}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(UniversalWidgetEngine);