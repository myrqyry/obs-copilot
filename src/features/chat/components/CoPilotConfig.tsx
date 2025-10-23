import React from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import useConfigStore from '@/store/configStore';

export const CoPilotConfig: React.FC = () => {
  const { useCoPilot, setUseCoPilot } = useConfigStore();

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">AI Co-pilot Configuration</h3>
      <div className="flex items-center justify-between">
        <Label htmlFor="copilot-switch">Enable Co-pilot</Label>
        <Switch
          id="copilot-switch"
          checked={useCoPilot}
          onCheckedChange={setUseCoPilot}
        />
      </div>
    </Card>
  );
};
