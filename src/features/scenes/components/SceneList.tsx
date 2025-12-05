// src/features/scenes/components/SceneList.tsx
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryClient';
import { SceneListSkeleton } from '@/components/common/SceneListSkeleton';
import { obsClient } from '@/services/obsClient';
import React from 'react';
import { OBSScene } from '@/types';

const SceneItem: React.FC<{ scene: OBSScene }> = ({ scene }) => (
  <div className="flex items-center gap-3 p-3 border rounded">
    <div className="w-12 h-12 bg-muted rounded" />
    <div className="flex-1">
      <div className="font-bold">{scene.sceneName}</div>
      <div className="text-sm text-muted-foreground">
        {scene.sources?.length || 0} sources
      </div>
    </div>
  </div>
);

export const SceneList: React.FC = () => {
  const {
    data: scenes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.obs.scenes(),
    queryFn: () => obsClient.getSceneList().then((data) => data.scenes),
  });

  if (isLoading) return <SceneListSkeleton />;
  if (isError) return <div>Error loading scenes</div>;

  return (
    <div>
      {(scenes || []).map((scene: any) => (
        <SceneItem key={scene.sceneName} scene={scene} />
      ))}
    </div>
  );
};
