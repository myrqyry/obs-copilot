import { renderHook, act } from '@testing-library/react';
import { useObsConnection } from '../useObsConnection';
import { useConnectionManagerStore } from '../../store/connectionManagerStore';
import { useToast } from '@/components/ui/use-toast';
import { ObsClientImpl } from '../../services/ObsClient';

jest.mock('../../services/ObsClient');
jest.mock('../../store/connectionManagerStore');
jest.mock('@/components/ui/use-toast');

describe('useObsConnection', () => {
  const mockSetConnecting = jest.fn();
  const mockSetConnected = jest.fn();
  const mockSetDisconnected = jest.fn();
  const mockSetObsServiceInstance = jest.fn();
  const mockUpdateOBSData = jest.fn();
  const mockSetObs = jest.fn();
  const mockSetActiveTab = jest.fn();
  const mockSetErrorMessage = jest.fn();
  const mockToast = jest.fn();
  const mockObsClient = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getSceneList: jest.fn(),
    getCurrentProgramScene: jest.fn(),
    getStreamStatus: jest.fn(),
    getRecordStatus: jest.fn(),
    getVideoSettings: jest.fn(),
    getSceneItemList: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useConnectionManagerStore as jest.Mock).mockReturnValue({
      actions: {
        setConnecting: mockSetConnecting,
        setConnected: mockSetConnected,
        setDisconnected: mockSetDisconnected,
        setObsServiceInstance: mockSetObsServiceInstance,
        updateOBSData: mockUpdateOBSData,
      },
    });
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    (ObsClientImpl as jest.Mock).mockImplementation(() => mockObsClient);
  });

  it('should handle successful connection and fetch data', async () => {
    mockObsClient.connect.mockResolvedValue(undefined);
    mockObsClient.getSceneList.mockResolvedValue({ scenes: [] });
    mockObsClient.getCurrentProgramScene.mockResolvedValue('Scene 1');
    mockObsClient.getStreamStatus.mockResolvedValue({});
    mockObsClient.getRecordStatus.mockResolvedValue({});
    mockObsClient.getVideoSettings.mockResolvedValue({});
    mockObsClient.getSceneItemList.mockResolvedValue({ sceneItems: [] });

    const { result } = renderHook(() =>
      useObsConnection(mockSetObs, mockSetActiveTab, mockSetErrorMessage),
    );

    await act(async () => {
      await result.current.handleConnect('ws://localhost:4455', 'password');
    });

    expect(mockSetConnecting).toHaveBeenCalledTimes(1);
    expect(mockObsClient.connect).toHaveBeenCalledWith('ws://localhost:4455', 'password', {
      eventSubscriptions: 0xffffffff,
    });
    expect(mockSetObs).toHaveBeenCalledWith(expect.any(Object));
    expect(mockSetObsServiceInstance).toHaveBeenCalledWith(mockObsClient);
    expect(mockObsClient.getSceneList).toHaveBeenCalledTimes(1);
    expect(mockSetConnected).toHaveBeenCalledWith(expect.any(Object));
    expect(mockUpdateOBSData).toHaveBeenCalledWith(expect.any(Object));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'OBS Connection',
        description: 'Successfully connected to OBS.',
      }),
    );
  });
});