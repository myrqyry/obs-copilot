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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming checkbox is available
import { Textarea } from '@/components/ui/textarea'; // Assuming textarea is available

interface ObsWidgetConfigModalProps {
  onSave: (config: ObsWidgetConfig) => void;
  scenes: string[];
  sources: string[];
}

const ObsWidgetConfigModal: React.FC<ObsWidgetConfigModalProps> = ({ onSave, scenes, sources }) => {
  const [label, setLabel] = useState('');
  const [actionType, setActionType] = useState<ObsActionType | 'control'>('toggle_mute');
  const [sceneName, setSceneName] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [isControlWidget, setIsControlWidget] = useState(false);
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
    const newConfig: ObsWidgetConfig = {
      id: new Date().toISOString(),
      label,
    };

    if (isControlWidget) {
      newConfig.control = {
        kind: controlKind,
        min: controlMin,
        max: controlMax,
        step: controlStep,
        unit: controlUnit,
        sourceName: sourceName || undefined,
        property: controlProperty || undefined,
        sendMethod: controlSendMethod || undefined,
        debounceMs: controlDebounceMs,
        throttleMs: controlThrottleMs,
      };
      // For control widgets, type is not directly used for action, but might be useful for categorization
      // Setting a default or leaving undefined based on how it's consumed
      newConfig.type = 'toggle_mute'; // Default action type for controls if needed, or remove if not applicable
    } else {
      newConfig.type = actionType;
      newConfig.sceneName = actionType === 'switch_scene' ? sceneName : undefined;
      newConfig.sourceName = actionType === 'toggle_mute' ? sourceName : undefined;
    }

    onSave(newConfig);
  };
 43 |
 44 |   return (
 45 |     <Dialog>
 46 |       <DialogTrigger asChild>
 47 |         <Button>Add Widget</Button>
 48 |       </DialogTrigger>
 49 |       <DialogContent>
 50 |         <DialogHeader>
 51 |           <DialogTitle>Add OBS Widget</DialogTitle>
 52 |           <DialogDescription>Configure an OBS action widget you can trigger quickly.</DialogDescription>
 53 |         </DialogHeader>
 54 |         <div className="space-y-4">
 55 |           <div>
 56 |             <Label htmlFor="widget-label">Label</Label>
 57 |             <Input
 58 |               id="widget-label"
 59 |               value={label}
 60 |               onChange={(e) => setLabel(e.target.value)}
 61 |             />
 62 |           </div>
 63 |           <div>
 64 |             <Label htmlFor="action-type">Action</Label>
 65 |             <Select onValueChange={(value: ObsActionType) => setActionType(value)} value={actionType}>
 66 |               <SelectTrigger>
 67 |                 <SelectValue placeholder="Select action type" />
 68 |               </SelectTrigger>
 69 |               <SelectContent>
 70 |                 <SelectItem value="toggle_mute">Toggle Mute</SelectItem>
 71 |                 <SelectItem value="switch_scene">Switch Scene</SelectItem>
 72 |               </SelectContent>
 73 |             </Select>
 74 |           </div>
 75 |           {actionType === 'switch_scene' && (
 76 |             <div>
 77 |               <Label htmlFor="scene-name">Scene</Label>
 78 |               <Select onValueChange={setSceneName} value={sceneName}>
 79 |                 <SelectTrigger>
 80 |                   <SelectValue placeholder="Select scene" />
 81 |                 </SelectTrigger>
 82 |                 <SelectContent>
 83 |                   {scenes.map((scene) => (
 84 |                     <SelectItem key={scene} value={scene}>
 85 |                       {scene}
 86 |                     </SelectItem>
 87 |                   ))}
 88 |                 </SelectContent>
 89 |               </Select>
 90 |             </div>
 91 |           )}
 92 |           {actionType === 'toggle_mute' && (
 93 |             <div>
 94 |               <Label htmlFor="source-name">Source</Label>
 95 |               <Select onValueChange={setSourceName} value={sourceName}>
 96 |                 <SelectTrigger>
 97 |                   <SelectValue placeholder="Select source" />
 98 |                 </SelectTrigger>
 99 |                 <SelectContent>
100 |                   {sources.map((source) => (
101 |                     <SelectItem key={source} value={source}>
102 |                       {source}
103 |                     </SelectItem>
104 |                   ))}
105 |                 </SelectContent>
106 |               </Select>
107 |             </div>
108 |           )}
109 |           <Button onClick={handleSave}>Save</Button>
110 |         </div>
111 |       </DialogContent>
112 |     </Dialog>
113 |   );
114 | };
115 |
116 | export default ObsWidgetConfigModal;

  const handleSave = () => {
    onSave({
      id: new Date().toISOString(),
      type: actionType,
      label,
      sceneName: actionType === 'switch_scene' ? sceneName : undefined,
      sourceName: actionType === 'toggle_mute' ? sourceName : undefined,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Widget</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add OBS Widget</DialogTitle>
          <DialogDescription>Configure an OBS action widget you can trigger quickly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="widget-label">Label</Label>
            <Input
              id="widget-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
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
                  {scenes.map((scene) => (
                    <SelectItem key={scene} value={scene}>
                      {scene}
                    </SelectItem>
                  ))}
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
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ObsWidgetConfigModal;
