// src/components/ui/AdvancedPanel.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/Card';
import SnapshotManager from '@/shared/components/settings/SnapshotManager';

const AdvancedPanel: React.FC = () => {
  return (
    <Card className="shadow-lg p-6">
      <CardHeader>
        <CardTitle>Advanced Settings & Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This section is for advanced configuration and experimental features. You can add things like logging controls, debug tools, or new integrations here.
        </p>
        <SnapshotManager />
      </CardContent>
    </Card>
  );
};

export default AdvancedPanel;
