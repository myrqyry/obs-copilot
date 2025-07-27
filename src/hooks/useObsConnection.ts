import { useCallback } from 'react';
import OBSWebSocket from 'obs-websocket-js';
import { useConnectionStore } from '../store/connectionStore';
import { useObsStore } from '../store/obsStore';
import { ObsClientImpl } from '../services/ObsClient';
import { OBSScene, OBSSource } from '../types';

export const useObsConnection = (
    setObs: (obs: any) => void,
    setActiveTab: (tab: any) => void,
    setErrorMessage: (message: string | null) => void,
) => {
    const { setConnecting, setConnected, setDisconnected, setObsServiceInstance } = useConnectionStore(state => state.actions);
    const { updateOBSData } = useObsStore(state => state.actions);

    const fetchData = useCallback(async (service: ObsClientImpl) => {
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
            if (currentProgramSceneData.currentProgramSceneName) {
                const sourcesData = await service.getSceneItemList(currentProgramSceneData.currentProgramSceneName);
                sources = (sourcesData.sceneItems as unknown as OBSSource[]).map((item: any) => ({
                    sourceName: String(item.sourceName ?? ''),
                    sceneItemId: Number(item.sceneItemId ?? 0),
                    sceneItemEnabled: Boolean(item.sceneItemEnabled ?? false),
                    inputKind: String(item.inputKind ?? '')
                }));
            }

            const obsData = {
                scenes: (scenesData.scenes as unknown as OBSScene[]),
                currentProgramScene: currentProgramSceneData.currentProgramSceneName,
                sources: sources,
                streamStatus: streamStatusData,
                recordStatus: recordStatusData,
                videoSettings: videoSettingsData,
                streamerName: null, // You might want to fetch this as well
            };

            setConnected(obsData);
            updateOBSData(obsData);
        } catch (error: any) {
            setErrorMessage(`Error fetching OBS data: ${error.message}`);
            if (error.message?.toLowerCase().includes('not connected')) {
                setDisconnected('Connection to OBS lost.');
                setActiveTab('connections');
            }
        }
    }, [updateOBSData, setDisconnected, setActiveTab, setErrorMessage]);

    const handleConnect = useCallback(async (address: string, password?: string) => {
        setConnecting();
        let NewOBSWebSocket: any = OBSWebSocket;
        if (OBSWebSocket && typeof OBSWebSocket === 'object' && 'default' in OBSWebSocket) {
            NewOBSWebSocket = (OBSWebSocket as any).default;
        }
        const newObs = new NewOBSWebSocket();

        try {
            await newObs.connect(address, password, { eventSubscriptions: 0xFFFFFFFF });
            setObs(newObs);
            const newObsService = new ObsClientImpl();
            newObsService.obs = newObs;
            setObsServiceInstance(newObsService);
            await fetchData(newObsService);
        } catch (error: any) {
            setDisconnected(error.message || "Failed to connect to OBS WebSocket.");
            setObs(null);
        }
    }, [setConnecting, setConnected, setDisconnected, setObsServiceInstance, fetchData, setObs]);

    const handleDisconnect = useCallback(async (obs: any): Promise<void> => {
        if (obs) {
            await obs.disconnect();
            setObs(null);
            setDisconnected();
            setObsServiceInstance(null);
        }
        return Promise.resolve();
    }, [setObs, setDisconnected, setObsServiceInstance]);

    return { handleConnect, handleDisconnect, fetchData };
};
