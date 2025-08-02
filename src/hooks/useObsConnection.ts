import { useCallback } from 'react';
import OBSWebSocket, { SceneItem } from 'obs-websocket-js';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { ObsClientImpl } from '../services/obsClient';
import { OBSScene, OBSSource, AppTab } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '../utils/logger';

export const useObsConnection = (
  setObs: (obs: OBSWebSocket | null) => void,
  setActiveTab: (tab: AppTab) => void,
  setErrorMessage: (message: string | null) => void, // Keep this for direct error setting if needed
) => {
  const { setConnecting, setConnected, setDisconnected, setObsServiceInstance, updateOBSData } =
    useConnectionManagerStore((state) => state.actions);
  const { toast } = useToast();

  /**
   * Fetches initial OBS data (scenes, sources, status) after a successful connection.
   * @param service The ObsClientImpl instance.
   */
  const fetchData = useCallback(
    async (service: ObsClientImpl) => {
      try {
        const [
          scenesData,
          currentProgramSceneData,
          streamStatusData,
          recordStatusData,
          videoSettingsData,
        ] = await Promise.all([
          service.getSceneList(),
          service.getCurrentProgramScene(),
          service.getStreamStatus(),
          service.getRecordStatus(),
          service.getVideoSettings(),
        ]);

        let sources: OBSSource[] = [];
        if (currentProgramSceneData.sceneName) {
          const sourcesData = await service.getSceneItemList(currentProgramSceneData.sceneName);
          sources = (sourcesData.sceneItems as unknown as OBSSource[]).map((item: SceneItem) => ({
            sourceName: String(item.sourceName ?? ''),
            sceneItemId: Number(item.sceneItemId ?? 0),
            sceneItemEnabled: Boolean(item.sceneItemEnabled ?? false),
            inputKind: String(item.inputKind ?? ''),
          }));
        }

        const obsData = {
          scenes: scenesData.scenes as unknown as OBSScene[],
          currentProgramScene: currentProgramSceneData.sceneName,
          sources: sources,
          streamStatus: streamStatusData,
          recordStatus: recordStatusData,
          videoSettings: videoSettingsData,
          streamerName: null, // You might want to fetch this as well
        };

        setConnected(obsData);
        updateOBSData(obsData);
        toast({
          title: 'OBS Connection',
          description: 'Successfully connected to OBS.',
          variant: 'default',
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch OBS data.';
        logger.error('Error fetching OBS data:', error);
        setErrorMessage(errorMessage); // Keep for direct error display if needed
        toast({
          title: 'OBS Data Error',
          description: `Error fetching OBS data: ${errorMessage}`,
          variant: 'destructive',
        });
        if (error.message?.toLowerCase().includes('not connected')) {
          setDisconnected('Connection to OBS lost.');
          setActiveTab('connections');
        }
      }
    },
    [updateOBSData, setDisconnected, setActiveTab, setErrorMessage, toast, setConnected],
  );

  /**
   * Handles the connection process to OBS WebSocket.
   * @param address The OBS WebSocket address.
   * @param password Optional password for authentication.
   */
  const handleConnect = useCallback(
    async (address: string, password?: string) => {
      setConnecting();
      const newObs = new OBSWebSocket();

      try {
        await newObs.connect(address, password, { eventSubscriptions: 0xffffffff });
        setObs(newObs);
        const newObsService = new ObsClientImpl();
        newObsService.obs = newObs;
        setObsServiceInstance(newObsService);
        await fetchData(newObsService);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to connect to OBS WebSocket.';
        logger.error('OBS connection failed:', error);
        setDisconnected(errorMessage);
        setObs(null);
        toast({
          title: 'OBS Connection Failed',
          description: `Failed to connect to OBS: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    },
    [setConnecting, setConnected, setDisconnected, setObsServiceInstance, fetchData, setObs, toast],
  );

  // This useEffect handles cleaning up the OBS connection when the component unmounts.
  // It's important to disconnect from OBS to prevent memory leaks and ensure proper resource management.
  // However, the actual disconnection logic is handled by the handleDisconnect function,
  // which is called from the component where useObsConnection is used (e.g., ConnectionPanel.tsx).
  // This hook primarily provides the connection/disconnection handlers, and the component
  // is responsible for invoking them in its own useEffect with cleanup.
  // Therefore, no direct cleanup is needed within this hook's useEffects as it only provides callbacks.

  /**
   * Handles the disconnection process from OBS WebSocket.
   * @param obs The OBSWebSocket instance to disconnect.
   * @returns A Promise that resolves when disconnection is complete.
   */
  const handleDisconnect = useCallback(
    async (obs: OBSWebSocket | null): Promise<void> => {
      try {
        if (obs) {
          await obs.disconnect();
          setObs(null);
          setDisconnected();
          setObsServiceInstance(null);
          toast({
            title: 'OBS Disconnected',
            description: 'Successfully disconnected from OBS.',
            variant: 'default',
          });
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error disconnecting from OBS.';
        logger.error('Error disconnecting from OBS:', error);
        toast({
          title: 'OBS Disconnection Error',
          description: `Error disconnecting from OBS: ${errorMessage}`,
          variant: 'destructive',
        });
      }
      return Promise.resolve();
    },
    [setObs, setDisconnected, setObsServiceInstance, toast],
  );

  return { handleConnect, handleDisconnect, fetchData };
};
