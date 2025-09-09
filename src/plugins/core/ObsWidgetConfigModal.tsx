import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ObsWidgetConfig, WidgetType } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { ActionConfigForm } from '@/components/obs-config-forms/ActionConfigForm';
import { ControlConfigForm } from '@/components/obs-config-forms/ControlConfigForm';

interface ObsWidgetConfigModalProps {
  onSave: (config: ObsWidgetConfig) => void;
  scenes: string[];
  sources: string[];
}

const ObsWidgetConfigModal: React.FC<ObsWidgetConfigModalProps> = ({ onSave, scenes, sources }) => {
  const [config, setConfig] = useState<Partial<ObsWidgetConfig>>({
    type: 'action',
    action: 'toggle_mute',
  });
  const [label, setLabel] = useState('');

  const handleSave = () => {
    const newConfig: ObsWidgetConfig = {
      id: new Date().toISOString(),
      label,
      ...config,
    } as ObsWidgetConfig;

    onSave(newConfig);
  };

  const { scenes: storeScenes, sources: storeSources, currentProgramScene } = useConnectionsStore();

  const scenesList = scenes.length > 0 ? scenes : (storeScenes || []).map((s) => s.sceneName);
  const sourcesList = sources.length > 0 ? sources : (storeSources || []).map((s) => s.sourceName);

  useEffect(() => {
    if (config.type === 'action' && config.action === 'switch_scene' && !config.sceneName && currentProgramScene) {
      setConfig(prev => ({...prev, sceneName: currentProgramScene}))
    }
  }, [config.type, config.action, currentProgramScene, config.sceneName]);

  const handleWidgetTypeChange = (widgetType: WidgetType) => {
    if (widgetType === 'action') {
      setConfig({
        type: 'action',
        action: 'toggle_mute',
      });
    } else {
      setConfig({
        type: 'control',
        control: {
          kind: 'slider',
          min: 0,
          max: 100,
          step: 1,
          unit: 'dB',
          sourceName: '',
          property: 'volume',
          sendMethod: 'SetInputVolume',
          debounceMs: 50,
          throttleMs: 16,
        },
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Widget</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add OBS Widget</DialogTitle>
          <DialogDescription>Configure an OBS widget you can trigger quickly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-full overflow-y-auto">
          <div>
            <Label htmlFor="widget-label">Label</Label>
            <Input
              id="widget-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="widget-type">Widget Type</Label>
            <Select onValueChange={handleWidgetTypeChange} value={config.type}>
              <SelectTrigger>
                <SelectValue placeholder="Select widget type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="action">Action Widget</SelectItem>
                <SelectItem value="control">Control Widget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.type === 'action' && (
            <ActionConfigForm
              config={config}
              onConfigChange={setConfig}
              scenes={scenesList}
              sources={sourcesList}
            />
          )}

          {config.type === 'control' && (
            <ControlConfigForm
              config={config}
              onConfigChange={setConfig}
              sources={sourcesList}
            />
          )}

          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObsWidgetConfigModal;
