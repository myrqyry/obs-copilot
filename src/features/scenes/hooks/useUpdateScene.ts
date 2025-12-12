// src/features/scenes/hooks/useUpdateScene.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryClient';
import type { OBSScene } from '@/shared/types/obs';
import { obsClient } from '@/shared/services/obsClient';

export function useUpdateScene() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scene: Partial<OBSScene> & { sceneName: string }) => {
      // Use obsClient to switch scene via WebSocket
      await obsClient.call('SetCurrentProgramScene', { sceneName: scene.sceneName });
      return { sceneName: scene.sceneName };
    },
    onMutate: async (newScene) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.obs.scenes() });

      // Snapshot the previous value
      const previousScenes = queryClient.getQueryData(queryKeys.obs.scenes());

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.obs.scenes(), (old: OBSScene[] | undefined) =>
        old?.map((scene) =>
          scene.sceneName === newScene.sceneName ? { ...scene, ...newScene } : scene
        )
      );

      // Return context with the snapshot
      return { previousScenes };
    },
    onError: (err, newScene, context) => {
      // Rollback on error
      if (context?.previousScenes) {
        queryClient.setQueryData(queryKeys.obs.scenes(), context.previousScenes);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.obs.scenes() });
    },
    meta: {
      successMessage: 'Scene updated successfully',
    },
  });
}
