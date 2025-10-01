export const mockConnect = jest.fn();
export const mockDisconnect = jest.fn();
export const mockCall = jest.fn();
export const mockOn = jest.fn();

export const ObsClientImpl = jest.fn().mockImplementation(() => {
  return {
    connect: mockConnect,
    disconnect: mockDisconnect,
    call: mockCall,
    on: mockOn,
    getSceneList: jest.fn(),
    getCurrentProgramScene: jest.fn(),
    getStreamStatus: jest.fn(),
    getRecordStatus: jest.fn(),
    getVideoSettings: jest.fn(),
    getSceneItemList: jest.fn(),
  };
});
