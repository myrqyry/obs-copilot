import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Music } from 'lucide-react';

export const MusicGenerator: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Music Generation (Preview)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center text-gray-500">
        <p className="mb-4">
          AI-powered music generation is coming soon. Generate background music,
          sound effects, and more directly within the app.
        </p>
        <Button disabled>Coming Soon</Button>
      </CardContent>
    </Card>
  );
};