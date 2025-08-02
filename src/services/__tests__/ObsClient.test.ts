import { ObsClientImpl } from '../obsClient';
import OBSWebSocket from 'obs-websocket-js';

jest.mock('obs-websocket-js', () => {
  return jest.fn().mockImplementation(() => {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      call: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      off: jest.fn(),
    };
  });
});

describe('ObsClientImpl', () => {
  let obsClient: ObsClientImpl;
  let mockObs: jest.Mocked<OBSWebSocket>;

  beforeEach(async () => {
    // Now, when you instantiate ObsClientImpl, it will use the mock
    obsClient = new ObsClientImpl();
    // We can cast the internal obs instance to the mocked type for testing
    mockObs = obsClient.obs as jest.Mocked<OBSWebSocket>;
  });

  it('should connect to OBS', async () => {
    const address = 'localhost:4455';
    const password = 'password';

    await obsClient.connect(address, password);

    expect(mockObs.connect).toHaveBeenCalledWith(address, password, {
      eventSubscriptions: 0xffffffff,
    });
  });
});
