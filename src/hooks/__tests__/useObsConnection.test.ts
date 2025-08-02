import { renderHook, act } from '@testing-library/react';
import { useObsConnection } from '../useObsConnection';
import { useConnectionManagerStore } from '../../store/connectionManagerStore';
import { useToast } from '@/components/ui/use-toast';
import { ObsClientImpl } from '../../services/obsClient';
import OBSWebSocket from 'obs-websocket-js';

jest.mock('obs-websocket-js');
jest.mock('../../services/obsClient');
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
  const mockConnect = jest.fn();
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (OBSWebSocket as jest.Mock).mockImplementation(() => {
      return {
        connect: mockConnect,
        disconnect: mockDisconnect,
      };
    });
    (useConnectionManagerStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        actions: {
          setConnecting: mockSetConnecting,
          setConnected: mockSetConnected,
          setDisconnected: mockSetDisconnected,
          setObsServiceInstance: mockSetObsServiceInstance,
          updateOBSData: mockUpdateOBSData,
        },
      };
      return selector(state);
    });
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    (ObsClientImpl as jest.Mock).mockImplementation(() => {
      return {
        getSceneList: jest.fn().mockResolvedValue({ scenes: [] }),
        getCurrentProgramScene: jest.fn().mockResolvedValue({ sceneName: 'Scene 1' }),
        getStreamStatus: jest.fn().mockResolvedValue({}),
        getRecordStatus: jest.fn().mockResolvedValue({}),
        getVideoSettings: jest.fn().mockResolvedValue({}),
        getSceneItemList: jest.fn().mockResolvedValue({ sceneItems: [] }),
        getSources: jest.fn().mockResolvedValue({ inputs: [] }),
      };
    });
  });

  it('should handle successful connection and fetch data', async () => {
    mockConnect.mockResolvedValue(undefined);

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
    expect(mockSetObs).toHaveBeenCalledWith(expect.any(Object));
    expect(mockSetObsServiceInstance).toHaveBeenCalledWith(expect.any(Object));
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