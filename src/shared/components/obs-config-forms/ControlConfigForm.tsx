import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ControlConfig, ControlKind, ObsControlConfig } from '@/types/obs';

interface ControlConfigFormProps {
  config: Partial<ControlConfig>;
  onConfigChange: (newConfig: Partial<ControlConfig>) => void;
  sources: string[];
}

export const ControlConfigForm: React.FC<ControlConfigFormProps> = ({
  config,
  onConfigChange,
  sources,
}) => {
  const handleControlChange = (newControlConfig: Partial<ObsControlConfig>) => {
    onConfigChange({
      ...config,
      type: 'control',
      control: { ...config.control, ...newControlConfig } as ObsControlConfig,
    });
  };

  return (
    <>
      <div>
        <Label htmlFor="control-kind">Control Type</Label>
        <Select
          onValueChange={(kind: ControlKind) => handleControlChange({ kind })}
          value={config.control?.kind}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select control type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slider">Slider</SelectItem>
            <SelectItem value="knob">Knob</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="control-source-name">Source Name</Label>
        <Select
          onValueChange={(sourceName) => handleControlChange({ sourceName })}
          value={config.control?.sourceName}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            {sources
              .filter((s) => s != null && s !== '')
              .map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="control-property">Property</Label>
        <Input
          id="control-property"
          value={config.control?.property || ''}
          onChange={(e) => handleControlChange({ property: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="control-send-method">Send Method</Label>
        <Input
          id="control-send-method"
          value={config.control?.sendMethod || ''}
          onChange={(e) => handleControlChange({ sendMethod: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="control-min">Min Value</Label>
        <Input
          id="control-min"
          type="number"
          value={config.control?.min || 0}
          onChange={(e) => handleControlChange({ min: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="control-max">Max Value</Label>
        <Input
          id="control-max"
          type="number"
          value={config.control?.max || 100}
          onChange={(e) => handleControlChange({ max: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="control-step">Step</Label>
        <Input
          id="control-step"
          type="number"
          value={config.control?.step || 1}
          onChange={(e) => handleControlChange({ step: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="control-unit">Unit</Label>
        <Input
          id="control-unit"
          value={config.control?.unit || ''}
          onChange={(e) => handleControlChange({ unit: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="control-debounce-ms">Debounce (ms)</Label>
        <Input
          id="control-debounce-ms"
          type="number"
          value={config.control?.debounceMs || 300}
          onChange={(e) => handleControlChange({ debounceMs: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="control-throttle-ms">Throttle (ms)</Label>
        <Input
          id="control-throttle-ms"
          type="number"
          value={config.control?.throttleMs || 0}
          onChange={(e) => handleControlChange({ throttleMs: Number(e.target.value) })}
        />
      </div>
    </>
  );
};
