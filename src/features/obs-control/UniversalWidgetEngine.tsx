import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useObsWidget } from '@/hooks/useObsWidget';
import { UniversalWidgetConfig, WidgetControlType } from '@/types/universalWidget';
import { logger } from '@/utils/logger';

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
      <Card className="p-4 bg-red-50 border-red-200">
        <CardContent className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-red-800">{config.name}</Label>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <CardContent className="flex flex-col gap-2">
          <Label className="text-sm font-medium">{config.name}</Label>
          <div className="text-sm text-gray-500">Loading...</div>
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
            className="w-full bg-blue-500 hover:bg-blue-600"
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
              onCheckedChange={(checked) => handleValueChange(checked)}
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
              onValueChange={(value) => handleValueChange(value[0])}
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
                {options.map((option) => (
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
              onValueChange={(value) => handleValueChange(value[0])}
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
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <input
              type="color"
              value={config.state?.value || '#000000'}
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
              onChange={(e) => handleValueChange(e.target.value)}
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
                {options.map((option) => (
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
              onValueChange={(value) => handleValueChange(value[0])}
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
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${(meterValue / 100) * 100}%` }}
                aria-label={`Meter ${config.name} at ${meterValue}%`}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{meterValue}%</span>
          </div>
        );
      case WidgetControlType.CHART:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <div className="w-full h-32 bg-gray-200 rounded border" aria-label={`Chart ${config.name}`}>
              <p className="text-xs text-gray-500 p-2">Chart placeholder</p>
            </div>
          </div>
        );
      case WidgetControlType.CUSTOM:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{config.name}</Label>
            <div className="w-full p-2 bg-gray-100 rounded border" aria-label={`Custom widget ${config.name}`}>
              <p className="text-xs text-gray-500">Custom widget content</p>
            </div>
          </div>
        );
      default:
        return (
          <Card className="p-4">
            <CardContent>
              <Label className="text-sm font-medium">{config.name}</Label>
              <p className="text-sm text-gray-500">Control type not implemented yet</p>
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
          <p className="text-xs text-gray-500 mt-1">{config.name}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversalWidgetEngine;