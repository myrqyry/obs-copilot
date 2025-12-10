import React, { useState } from 'react';
import useConnectionsStore from '@/app/store/connections';
import { useLockStore } from '@/app/store/lockStore';
import { useChatStore } from '@/app/store/chatStore';
import { OBSSource } from '@/shared/types';
import { Button } from '@/shared/components/ui/Button';
import { CollapsibleCard } from '@/shared/components/common/CollapsibleCard';
import { LockToggle } from '@/shared/components/common/LockToggle';
import { AddToContextButton } from '@/shared/components/common/AddToContextButton';
import { handleAppError } from '@/shared/lib/errorUtils';

export const SourcesCard: React.FC = () => {
  const [openSources, setOpenSources] = useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const obsClient = useConnectionsStore((state) => state.obs);
  const sources = useConnectionsStore((state) => state.sources);
  const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);
  const { actions: { addSystemMessageToChat, setGlobalErrorMessage: setErrorMessage } } = useChatStore();
  const { isLocked } = useLockStore();

  const onRefreshData = async () => {
    if (!obsClient) return;
    const { scenes } = await obsClient.call('GetSceneList');
    const { currentProgramSceneName } = await obsClient.call('GetCurrentProgramScene');
    const { sceneItems } = await obsClient.call('GetSceneItemList', { sceneName: currentProgramSceneName });
    const streamStatus = await obsClient.call('GetStreamStatus');
    const recordStatus = await obsClient.call('GetRecordStatus');
    const videoSettings = await obsClient.call('GetVideoSettings');
    useConnectionsStore.setState({
      scenes: scenes.map((s: any) => ({ sceneName: s.sceneName, sceneIndex: s.sceneIndex })),
      currentProgramScene: currentProgramSceneName,
      sources: sceneItems.map((item: any) => ({
        sourceName: item.sourceName,
        typeName: item.inputKind,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: item.sceneItemEnabled,
      })),
      streamStatus: streamStatus,
      recordStatus: recordStatus,
      videoSettings: videoSettings,
    });
  };

  const handleAction = async (action: () => Promise<unknown>) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (!obsClient) {
        throw new Error('OBS Service is not connected.');
      }
      await action();
      await onRefreshData();
    } catch (error: unknown) {
      setErrorMessage(handleAppError('OBS Action', error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSourceVisibility = (sceneName: string, sceneItemId: number, enabled: boolean) => {
    if (!obsClient || !sceneName) return;
    handleAction(() => obsClient.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: !enabled }));
  };

  return (
    <CollapsibleCard
      title="Sources"
      emoji="🖼️"
      className="relative group"
      isOpen={openSources}
      onToggle={() => setOpenSources(!openSources)}
    >
      <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
        <LockToggle lockKey="sources" />
      </div>
      <ul className="space-y-1.5">
        {sources.map((source: OBSSource) => (
          <li key={source.sceneItemId} className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="truncate text-sm">{source.sourceName}</span>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => {
                  if (currentProgramScene) toggleSourceVisibility(currentProgramScene, source.sceneItemId, source.sceneItemEnabled);
                }}
                disabled={isLocked('sources') || !currentProgramScene || isLoading}
                variant={source.sceneItemEnabled ? 'default' : 'outline'}
                size="sm"
              >
                {source.sceneItemEnabled ? 'Hide' : 'Show'}
              </Button>
              <AddToContextButton
                contextText={`OBS Source: '${source.sourceName}' is ${source.sceneItemEnabled ? 'visible' : 'hidden'} in scene '${currentProgramScene || ''}'`}
                onAddToContext={addSystemMessageToChat}
                disabled={isLocked('sources') || !currentProgramScene}
                title={`Add source '${source.sourceName}' to chat context`}
              />
            </div>
          </li>
        ))}
      </ul>
    </CollapsibleCard>
  );
};

export default SourcesCard;