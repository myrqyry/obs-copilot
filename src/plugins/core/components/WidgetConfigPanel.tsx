import React, { useState, useCallback } from 'react';
import { X, Save, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useWidgetStore, { useWidget } from '@/features/obs-control/widgetStore';
import { WidgetControlType, UniversalWidgetConfig } from '@/types/universalWidget';
import useConnectionsStore from '@/store/connectionsStore';

interface WidgetConfigPanelProps {
  widgetId: string;
  onClose: () => void;
}

export const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({ widgetId, onClose }) => {
  const { config, updateConfig } = useWidget(widgetId);
  const { sources, scenes } = useConnectionsStore(state => ({
    sources: state.sources,
    scenes: state.scenes
  }));

  const [localConfig, setLocalConfig] = useState<Partial<UniversalWidgetConfig>>(config || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  React.useEffect(() => {
    setLocalConfig(config || {});
  }, [config]);

  if (!config) {
    return (
      <div className="w-80 bg-white border-l shadow-lg flex items-center justify-center">
        <p>Widget not found</p>
      </div>
    );
  }

  const handleConfigChange = useCallback((key: string, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const handleDeepConfigChange = useCallback((path: string, value: any) => {
    setLocalConfig(prev => {
        const newConfig = { ...prev };
        const keys = path.split('.');
        let current: any = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]] = { ...current[keys[i]] };
        }
        current[keys[keys.length - 1]] = value;
        return newConfig;
    });
    setHasUnsavedChanges(true);
  }, []);


  const handleSave = useCallback(() => {
    if (localConfig) {
      updateConfig(localConfig);
      setHasUnsavedChanges(false);
    }
  }, [localConfig, updateConfig]);

  const handleReset = useCallback(() => {
    setLocalConfig(config);
    setHasUnsavedChanges(false);
  }, [config]);

  return (
    <div className="w-80 bg-white border-l shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Configure Widget</h3>
          <p className="text-sm text-gray-600">{localConfig.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Configuration Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="general" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="obs">OBS</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="general" className="p-4 space-y-4">
              {/* Basic Configuration */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="widget-name">Widget Name</Label>
                  <Input
                    id="widget-name"
                    value={localConfig.name || ''}
                    onChange={(e) => handleConfigChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="widget-type">Control Type</Label>
                  <Select
                    value={localConfig.controlType}
                    onValueChange={(value) => handleConfigChange('controlType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WidgetControlType).map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Value Mapping for numeric controls */}
                {localConfig.controlType && [WidgetControlType.SLIDER, WidgetControlType.KNOB, WidgetControlType.STEPPER].includes(localConfig.controlType) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Value Range</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Min</Label>
                          <Input
                            type="number"
                            value={localConfig.valueMapping?.min || 0}
                            onChange={(e) => handleDeepConfigChange('valueMapping.min', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Max</Label>
                          <Input
                            type="number"
                            value={localConfig.valueMapping?.max || 100}
                            onChange={(e) => handleDeepConfigChange('valueMapping.max', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Step</Label>
                        <Input
                          type="number"
                          value={localConfig.valueMapping?.step || 1}
                          onChange={(e) => handleDeepConfigChange('valueMapping.step', Number(e.target.value))}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="obs" className="p-4 space-y-4">
              {/* OBS Configuration */}
              <div className="space-y-3">
                <div>
                  <Label>OBS Request</Label>
                  <Input
                    value={localConfig.obsConfig?.obsRequest || ''}
                    onChange={(e) => handleDeepConfigChange('obsConfig.obsRequest', e.target.value)}
                    placeholder="e.g., SetInputVolume"
                  />
                </div>

                {/* Source Selection */}
                {sources.length > 0 && (
                  <div>
                    <Label>Target Source</Label>
                    <Select
                      value={localConfig.obsConfig?.obsParams?.inputName || ''}
                      onValueChange={(value) => handleDeepConfigChange('obsConfig.obsParams.inputName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(source => (
                          <SelectItem key={source.sourceName} value={source.sourceName}>
                            {source.sourceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Scene Selection */}
                {scenes.length > 0 && localConfig.controlType === WidgetControlType.PICKER && (
                  <div>
                    <Label>Available Scenes</Label>
                    <div className="space-y-2 max-h-32 overflow-auto">
                      {scenes.map(scene => (
                        <div key={scene.sceneName} className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {scene.sceneName}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="visual" className="p-4 space-y-4">
              {/* Visual Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Show Label</Label>
                  <Switch
                    checked={localConfig.visualConfig?.showLabel !== false}
                    onCheckedChange={(checked) => handleDeepConfigChange('visualConfig.showLabel', checked)}
                  />
                </div>

                <div>
                  <Label>Color Theme</Label>
                  <Select
                    value={localConfig.visualConfig?.color || 'blue'}
                    onValueChange={(value) => handleDeepConfigChange('visualConfig.color', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Size</Label>
                  <Select
                    value={localConfig.visualConfig?.size || 'medium'}
                    onValueChange={(value) => handleDeepConfigChange('visualConfig.size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t bg-gray-50 space-y-2">
        {hasUnsavedChanges && (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              Reset
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};