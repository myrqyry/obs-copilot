import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Video } from 'lucide-react';

export const VideoGenerator: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Generation (Coming Soon)
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center text-gray-500">
        <p className="mb-4">
          AI video generation is on the horizon. Soon you'll be able to create
          short clips, animations, and dynamic video content.
        </p>
        <Button disabled>Coming Soon</Button>
      </CardContent>
    </Card>
  );
};