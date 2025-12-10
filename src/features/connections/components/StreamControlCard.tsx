import React, { useState } from 'react';
import useConnectionsStore from '@/app/store/connections';
import { useLockStore } from '@/app/store/lockStore';
import { useChatStore } from '@/app/store/chatStore';
import { Button } from '@/shared/components/ui/Button';
import { CollapsibleCard } from '@/shared/components/common/CollapsibleCard';
import { LockToggle } from '@/shared/components/common/LockToggle';
import { handleAppError } from '@/shared/lib/errorUtils';

export const StreamControlCard: React.FC = () => {
  const [openStream, setOpenStream] = useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const obsClient = useConnectionsStore((state) => state.obs);
  const streamStatus = useConnectionsStore((state) => state.streamStatus);
  const recordStatus = useConnectionsStore((state) => state.recordStatus);

  const {
    actions: { setGlobalErrorMessage: setErrorMessage },
  } = useChatStore();
  const { isLocked } = useLockStore();
  const STREAM_RECORD_LOCK = 'streamRecord';

  const onRefreshData = async () => {
    if (!obsClient) return;
    const { scenes } = await obsClient.call('GetSceneList');
    const { currentProgramSceneName } = await obsClient.call('GetCurrentProgramScene');
    const { sceneItems } = await obsClient.call('GetSceneItemList', { sceneName: currentProgramSceneName });
    const streamStatusData = await obsClient.call('GetStreamStatus');
    const recordStatusData = await obsClient.call('GetRecordStatus');
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
      streamStatus: streamStatusData,
      recordStatus: recordStatusData,
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

  const toggleStream = () => {
    if (!obsClient) return;
    if (streamStatus?.outputActive) {
      handleAction(() => obsClient.call('StopStream'));
    } else {
      handleAction(() => obsClient.call('StartStream'));
    }
  };

  const toggleRecord = () => {
    if (!obsClient) return;
    if (recordStatus?.outputActive) {
      handleAction(() => obsClient.call('StopRecord'));
    } else {
      handleAction(() => obsClient.call('StartRecord'));
    }
  };

  return (
    <CollapsibleCard
      title="Stream & Record"
      emoji="📡"
      className="relative group"
      isOpen={openStream}
      onToggle={() => setOpenStream(!openStream)}
    >
      <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
        <LockToggle lockKey={STREAM_RECORD_LOCK} />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-center mb-1">
        <Button
          onClick={toggleStream}
          disabled={isLocked(STREAM_RECORD_LOCK) || isLoading}
          variant={streamStatus?.outputActive ? 'destructive' : 'default'}
          className="w-full sm:flex-1"
          size="sm"
        >
          {streamStatus?.outputActive ? 'Stop Streaming' : 'Start Streaming'}
        </Button>
        <Button
          onClick={toggleRecord}
          disabled={isLocked(STREAM_RECORD_LOCK) || isLoading}
          variant={recordStatus?.outputActive ? 'destructive' : 'accent'}
          className="flex-1"
          size="sm"
        >
          {recordStatus?.outputActive ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </div>
      <div className="text-xs text-foreground">
        Stream: {streamStatus?.outputActive ? '🟢 Live' : '🔴 Stopped'} | Record:{' '}
        {recordStatus?.outputActive ? '🟢 Recording' : '🔴 Stopped'}
      </div>
    </CollapsibleCard>
  );
};

export default StreamControlCard;