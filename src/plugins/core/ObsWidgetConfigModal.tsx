import React, { useState } from 'react';
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
import { ObsActionType, ObsWidgetConfig, ControlKind, ObsControlConfig } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming checkbox is available
import { Textarea } from '@/components/ui/textarea'; // Assuming textarea is available

interface ObsWidgetConfigModalProps {
  onSave: (config: ObsWidgetConfig) => void;
  scenes: string[];
  sources: string[];
}

const ObsWidgetConfigModal: React.FC<ObsWidgetConfigModalProps> = ({ onSave, scenes, sources }) => {
  const [label, setLabel] = useState('');
  const [actionType, setActionType] = useState<ObsActionType>('toggle_mute');
  const [widgetType, setWidgetType] = useState<'action' | 'control'>('action'); // 'action' or 'control'
  const [sceneName, setSceneName] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [controlKind, setControlKind] = useState<ControlKind>('slider');
  const [controlMin, setControlMin] = useState(0);
  const [controlMax, setControlMax] = useState(100);
  const [controlStep, setControlStep] = useState(1);
  const [controlUnit, setControlUnit] = useState('');
  const [controlProperty, setControlProperty] = useState('');
  const [controlSendMethod, setControlSendMethod] = useState('');
  const [controlDebounceMs, setControlDebounceMs] = useState(300);
  const [controlThrottleMs, setControlThrottleMs] = useState(0); // 0 means no throttle

  const handleSave = () => {
    const normalizedScene = sceneName === '__none__' ? '' : sceneName;
    const normalizedSource = sourceName === '__none__' ? '' : sourceName;

    const newConfig: ObsWidgetConfig = {
      id: new Date().toISOString(),
      label,
      type: 'toggle_mute', // Default type, will be overridden
    };

    if (widgetType === 'control') {
      newConfig.type = 'control';
      newConfig.control = {
        kind: controlKind,
        min: controlMin,
        max: controlMax,
        step: controlStep,
        unit: controlUnit,
        sourceName: sourceName || '',
        property: controlProperty || '',
        sendMethod: controlSendMethod || '',
        debounceMs: controlDebounceMs,
        throttleMs: controlThrottleMs,
      };
    } else {
      newConfig.type = actionType as any;
  newConfig.sceneName = actionType === 'switch_scene' ? (normalizedScene || undefined) : undefined;
  newConfig.sourceName = actionType === 'toggle_mute' ? (normalizedSource || undefined) : undefined;
    }

    onSave(newConfig);
  };

  // Use store values as a fallback so lists populate even if parent doesn't supply them
  const { scenes: storeScenes, sources: storeSources } = useConnectionsStore();

  const scenesList = (scenes && scenes.length > 0) ? scenes : (storeScenes || []).map((s) => s.sceneName);
  const sourcesList = (sources && sources.length > 0) ? sources : (storeSources || []).map((s) => s.sourceName);
  const { currentProgramScene } = useConnectionsStore();

  // If switching to scene action and no sceneName selected, default to current program scene
  React.useEffect(() => {
    if (actionType === 'switch_scene' && !sceneName && currentProgramScene) {
      setSceneName(currentProgramScene);
    }
  }, [actionType, currentProgramScene]);

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
            <Select onValueChange={(value: 'action' | 'control') => {
                setWidgetType(value);
                // Reset actionType if switching to control, or vice-versa to a default
                if (value === 'action') {
                  setActionType('toggle_mute');
                } else {
                  // Optionally reset control specific fields when switching from action to control
                  setControlKind('slider');
                  setControlMin(0);
                  setControlMax(100);
                  setControlStep(1);
                  setControlUnit('');
                  setControlProperty('');
                  setControlSendMethod('');
                  setControlDebounceMs(300);
                  setControlThrottleMs(0);
                }
              }} value={widgetType}>
              <SelectTrigger>
                <SelectValue placeholder="Select widget type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="action">Action Widget</SelectItem>
                <SelectItem value="control">Control Widget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {widgetType === 'action' && (
            <>
              <div>
                <Label htmlFor="action-type">Action</Label>
                <Select onValueChange={(value: ObsActionType) => setActionType(value)} value={actionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="toggle_mute">Toggle Mute</SelectItem>
                    <SelectItem value="switch_scene">Switch Scene</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {actionType === 'switch_scene' && (
                <div>
                  <Label htmlFor="scene-name">Scene</Label>
                  <Select onValueChange={setSceneName} value={sceneName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scene" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenesList.length === 0 ? (
                        // Radix Select requires non-empty values on SelectItem; use a sentinel and disabled
                        <SelectItem value="__none__" disabled>
                          No scenes available
                        </SelectItem>
                      ) : (
                        scenesList
                          .filter((s) => s != null && s !== '')
                          .map((scene) => (
                            <SelectItem key={scene} value={scene}>
                              {scene}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {actionType === 'toggle_mute' && (
                <div>
                  <Label htmlFor="source-name">Source</Label>
                  <Select onValueChange={setSourceName} value={sourceName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourcesList.length === 0 ? (
                        // Radix Select requires non-empty values on SelectItem; use a sentinel and disabled
                        <SelectItem value="__none__" disabled>
                          No sources available
                        </SelectItem>
                      ) : (
                        sourcesList
                          .filter((s) => s != null && s !== '')
                          .map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {widgetType === 'control' && (
            <>
              <div>
                <Label htmlFor="control-kind">Control Type</Label>
                <Select onValueChange={(value: ControlKind) => setControlKind(value)} value={controlKind}>
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
                <Select onValueChange={setSourceName} value={sourceName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourcesList
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
                <Input id="control-property" value={controlProperty} onChange={(e) => setControlProperty(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="control-send-method">Send Method</Label>
                <Input id="control-send-method" value={controlSendMethod} onChange={(e) => setControlSendMethod(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="control-min">Min Value</Label>
                <Input id="control-min" type="number" value={controlMin} onChange={(e) => setControlMin(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="control-max">Max Value</Label>
                <Input id="control-max" type="number" value={controlMax} onChange={(e) => setControlMax(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="control-step">Step</Label>
                <Input id="control-step" type="number" value={controlStep} onChange={(e) => setControlStep(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="control-unit">Unit</Label>
                <Input id="control-unit" value={controlUnit} onChange={(e) => setControlUnit(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="control-debounce-ms">Debounce (ms)</Label>
                <Input id="control-debounce-ms" type="number" value={controlDebounceMs} onChange={(e) => setControlDebounceMs(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="control-throttle-ms">Throttle (ms)</Label>
                <Input id="control-throttle-ms" type="number" value={controlThrottleMs} onChange={(e) => setControlThrottleMs(Number(e.target.value))} />
              </div>
            </>
          )}

          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObsWidgetConfigModal;
