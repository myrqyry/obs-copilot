import { renderHook, act, waitFor } from '@testing-library/react';
import { useObsConnection } from '../useObsConnection';
import { useConnectionManagerStore } from '../../store/connectionManagerStore';
import { useToast } from '@/components/ui/use-toast';
import { ConnectionManagerState } from '../../store/connectionManagerStore';
import { ObsClientImpl } from '../../services/ObsClient';
import { mockConnect, mockCall, mockOn, mockDisconnect } from '../../services/__mocks__/obs-websocket-js'; // Import named mocks
jest.mock('../../services/ObsClient'); // Auto-mock ObsClientImpl

// Mock OBSWebSocket globally (its mock implementation is in __mocks__/obs-websocket-js.ts)
jest.mock('obs-websocket-js');

// Mock Zustand store
jest.mock('../../store/connectionManagerStore', () => ({
  useConnectionManagerStore: jest.fn(),
}));

// Mock useToast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));


describe('useObsConnection', () => {
  let mockSetConnecting: jest.Mock;
  let mockSetConnected: jest.Mock;
  let mockSetDisconnected: jest.Mock;
  let mockSetObsServiceInstance: jest.Mock;
  let mockUpdateOBSData: jest.Mock;
  let mockSetObs: jest.Mock;
  let mockSetActiveTab: jest.Mock;
  let mockSetErrorMessage: jest.Mock;
  let mockToast: jest.Mock;
  let mockObsClientImpl: jest.Mocked<ObsClientImpl>;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test

    mockSetConnecting = jest.fn();
    mockSetConnected = jest.fn();
    mockSetDisconnected = jest.fn();
    mockSetObsServiceInstance = jest.fn();
    mockUpdateOBSData = jest.fn();
    mockSetObs = jest.fn();
    mockSetActiveTab = jest.fn();
    mockSetErrorMessage = jest.fn();
    mockToast = jest.fn();

    (useConnectionManagerStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({
        actions: {
          setConnecting: mockSetConnecting,
          setConnected: mockSetConnected,
          setDisconnected: mockSetDisconnected,
          setObsServiceInstance: mockSetObsServiceInstance,
          updateOBSData: mockUpdateOBSData,
        },
      });
    });

    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });

    // Reset the mock implementation of ObsClientImpl before each test
    (ObsClientImpl as jest.MockedClass<typeof ObsClientImpl>).mockImplementation(() => ({
      obs: {
        connect: mockConnect,
        disconnect: mockDisconnect,
        call: mockCall,
        on: mockOn,
      },
      connect: jest.fn(),
      disconnect: jest.fn(),
      getSceneList: jest.fn(),
      getCurrentProgramScene: jest.fn(),
      setCurrentProgramScene: jest.fn(),
      getSceneItemList: jest.fn(),
      setSceneItemEnabled: jest.fn(),
      getSceneItemId: jest.fn(),
      getStreamStatus: jest.fn(),
      startStream: jest.fn(),
      stopStream: jest.fn(),
      toggleStream: jest.fn(),
      getRecordStatus: jest.fn(),
      startRecord: jest.fn(),
      stopRecord: jest.fn(),
      toggleRecord: jest.fn(),
      getVideoSettings: jest.fn(),
      setVideoSettings: jest.fn(),
      createInput: jest.fn(),
      setInputSettings: jest.fn(),
      getInputSettings: jest.fn(),
      getSourceFilterList: jest.fn(),
      getSourceFilter: jest.fn(),
      createScene: jest.fn(),
      removeScene: jest.fn(),
      removeInput: jest.fn(),
      duplicateSceneItem: jest.fn(),
      setSceneItemTransform: jest.fn(),
      getSceneItemTransform: jest.fn(),
      createSourceFilter: jest.fn(),
      removeSourceFilter: jest.fn(),
      setSourceFilterEnabled: jest.fn(),
      setSourceFilterSettings: jest.fn(),
      setSourceFilterIndex: jest.fn(),
      setSourceFilterName: jest.fn(),
      duplicateSourceFilter: jest.fn(),
      getInputVolume: jest.fn(),
      setInputVolume: jest.fn(),
      setInputMute: jest.fn(),
      getVirtualCamStatus: jest.fn(),
      startVirtualCam: jest.fn(),
      stopVirtualCam: jest.fn(),
      toggleStudioMode: jest.fn(),
      getStudioModeEnabled: jest.fn(),
      openInputFiltersDialog: jest.fn(),
      openInputPropertiesDialog: jest.fn(),
      openInputInteractDialog: jest.fn(),
      getOutputStatus: jest.fn(),
      getStreamerUsername: jest.fn(),
      getSourceScreenshot: jest.fn(),
      getCurrentSceneScreenshot: jest.fn(),
      startReplayBuffer: jest.fn(),
      saveReplayBuffer: jest.fn(),
      stopReplayBuffer: jest.fn(),
      getReplayBufferStatus: jest.fn(),
      triggerStudioModeTransition: jest.fn(),
      setStudioModeEnabled: jest.fn(),
      setInputAudioMonitorType: jest.fn(),
      setSceneItemBlendMode: jest.fn(),
      refreshBrowserSource: jest.fn(),
      triggerHotkeyByName: jest.fn(),
      triggerHotkeyByKeySequence: jest.fn(),
      getHotkeyList: jest.fn(),
      getStats: jest.fn(),
      getLogFileList: jest.fn(),
      uploadLog: jest.fn(),
      getSourceFilterSettings: jest.fn(),
      getSourceFilterDefaultSettings: jest.fn(),
      setSceneName: jest.fn(),
      getCurrentProfile: jest.fn(),
      setCurrentProfile: jest.fn(),
      getCurrentSceneCollection: jest.fn(),
      setCurrentSceneCollection: jest.fn(),
      addBrowserSource: jest.fn(),
      addImageSource: jest.fn(),
      addMediaSource: jest.fn(),
      addSvgAsBrowserSource: jest.fn(),
      addEmojiAsBrowserSource: jest.fn(),
      subscribeToEvents: jest.fn(),
      unsubscribeFromEvents: jest.fn(),
      getInputs: jest.fn(),
      // Add all other public methods of ObsClientImpl as jest.fn() here

      // Add mock implementations for private methods
      callObs: jest.fn(),
      validateString: jest.fn(),
      validateNumber: jest.fn(),
      validateBoolean: jest.fn(),
    }) as unknown as ObsClientImpl);
    // Intentionally left blank. mockObsClientImpl will be assigned within test cases.

  });

  it('should handle successful connection and fetch data', async () => {
    mockConnect.mockResolvedValue(undefined);
    // Provide full mock return values for type compatibility
    (mockObsClientImpl.getSceneList as jest.Mock).mockResolvedValue({
      currentProgramSceneName: 'Scene 1',
      currentPreviewSceneName: null,
      scenes: [{ sceneIndex: 0, sceneName: 'Scene 1', sceneItems: [] }],
    });
    (mockObsClientImpl.getCurrentProgramScene as jest.Mock).mockResolvedValue({
      sceneIndex: 0,
      sceneName: 'Scene 1',
      sceneItems: [],
    });
    (mockObsClientImpl.getStreamStatus as jest.Mock).mockResolvedValue({
      outputActive: false,
      outputPaused: false,
      outputSkippedFrames: 0,
      outputTotalFrames: 0,
      outputBytes: 0,
      outputDuration: 0,
      outputCongestion: 0,
      outputReconnecting: false,
      active: false,
      starting: false,
      stopping: false,
      recordin: false,
      // Add other required StreamStatus properties if missing
    });
    (mockObsClientImpl.getRecordStatus as jest.Mock).mockResolvedValue({
      outputActive: false,
      outputPaused: false,
      outputSkippedFrames: 0,
      outputTotalFrames: 0,
      outputBytes: 0,
      outputDuration: 0,
      outputTimecode: '00:00:00.000',
      // Add other required RecordStatus properties if missing
    });
    (mockObsClientImpl.getVideoSettings as jest.Mock).mockResolvedValue({
      fpsNumerator: 60,
      fpsDenominator: 1,
      baseWidth: 1920,
      baseHeight: 1080,
      outputWidth: 1920,
      outputHeight: 1080,
      scaleFiltering: 'Bicubic',
      colorSpace: 'SRGB',
      colorRange: 'Full',
      colorFormat: 'RGBA',
      // Add other required VideoSettings properties if missing
    });
    (mockObsClientImpl.getSceneItemList as jest.Mock).mockResolvedValue({ sceneItems: [] });

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleConnect('ws://localhost:4455', 'password');
    });

    expect(mockSetConnecting).toHaveBeenCalledTimes(1);
    expect(ObsClientImpl).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith('ws://localhost:4455', 'password', {
      eventSubscriptions: 0xffffffff,
    });
    expect(mockSetObs).toHaveBeenCalledWith(expect.any(Object));
    expect(mockSetObsServiceInstance).toHaveBeenCalledWith(mockObsClientImpl);
    expect(mockObsClientImpl.getSceneList).toHaveBeenCalledTimes(1);
    expect(mockSetConnected).toHaveBeenCalledWith(expect.any(Object));
    expect(mockUpdateOBSData).toHaveBeenCalledWith(expect.any(Object));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OBS Connection',
        description: 'Successfully connected to OBS.',
      }),
    );
  });

  it('should handle connection failure', async () => {
    const connectionError = new Error('Connection refused');
    mockConnect.mockRejectedValue(connectionError);

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleConnect('ws://localhost:4455', 'password');
    });

    expect(mockSetConnecting).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith('ws://localhost:4455', 'password', {
      eventSubscriptions: 0xffffffff,
    });
    expect(mockSetDisconnected).toHaveBeenCalledWith('Connection refused');
    expect(mockSetObs).toHaveBeenCalledWith(null);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OBS Connection Failed',
        description: 'Failed to connect to OBS: Connection refused',
      }),
    );
  });

  it('should handle successful disconnection', async () => {
    mockObsClientImpl.obs.disconnect.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleDisconnect(mockObsClientImpl.obs);
    });

    expect(mockObsClientImpl.obs.disconnect).toHaveBeenCalledTimes(1);
    expect(mockSetObs).toHaveBeenCalledWith(null);
    expect(mockSetDisconnected).toHaveBeenCalledTimes(1);
    expect(mockSetObsServiceInstance).toHaveBeenCalledWith(null);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OBS Disconnected',
        description: 'Successfully disconnected from OBS.',
      }),
    );
  });

  it('should handle disconnection failure', async () => {
    const disconnectionError = new Error('Failed to close connection');
    mockObsClientImpl.obs.disconnect.mockRejectedValue(disconnectionError);

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleDisconnect(mockObsClientImpl.obs);
    });

    expect(mockObsClientImpl.obs.disconnect).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OBS Disconnection Error',
        description: 'Error disconnecting from OBS: Failed to close connection',
      }),
    );
  });

  it('should handle fetch data failure and set error message', async () => {
    mockConnect.mockResolvedValue(undefined);
    const fetchDataError = new Error('OBS data fetch failed');
    mockObsClientImpl.getSceneList.mockRejectedValue(fetchDataError);

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleConnect('ws://localhost:4455', 'password');
    });

    expect(mockSetConnecting).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockObsClientImpl.getSceneList).toHaveBeenCalledTimes(1);
    expect(mockSetErrorMessage).toHaveBeenCalledWith('OBS data fetch failed');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OBS Data Error',
        description: 'Error fetching OBS data: OBS data fetch failed',
      }),
    );
    expect(mockSetDisconnected).not.toHaveBeenCalledWith(expect.stringContaining('Connection to OBS lost.'));
  });

  it('should call setDisconnected and setActiveTab if fetch data error is "not connected"', async () => {
    mockConnect.mockResolvedValue(undefined);
    const notConnectedError = new Error('WebSocket Error: Not connected');
    mockObsClientImpl.getSceneList.mockRejectedValue(notConnectedError);

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleConnect('ws://localhost:4455', 'password');
    });

    expect(mockSetDisconnected).toHaveBeenCalledWith('Connection to OBS lost.');
    expect(mockSetActiveTab).toHaveBeenCalledWith('connections');
  });
});