import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ObsActionType, ObsWidgetConfig } from '@/types/obs';

interface ObsWidgetConfigModalProps {
  onSave: (config: ObsWidgetConfig) => void;
  scenes: string[];
  sources: string[];
}

const ObsWidgetConfigModal: React.FC<ObsWidgetConfigModalProps> = ({ onSave, scenes, sources }) => {
  const [label, setLabel] = useState('');
  const [actionType, setActionType] = useState<ObsActionType>('toggle_mute');
  const [sceneName, setSceneName] = useState('');
  const [sourceName, setSourceName] = useState('');

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
