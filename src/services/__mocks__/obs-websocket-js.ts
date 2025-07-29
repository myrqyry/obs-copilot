const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockCall = jest.fn();
const mockOn = jest.fn();

const OBSWebSocket = jest.fn().mockImplementation(() => {
  return {
    connect: mockConnect,
    disconnect: mockDisconnect,
    call: mockCall,
    on: mockOn,
    // Add other methods that might be called on the OBSWebSocket instance
  };
});

// Mock the default export
export default OBSWebSocket;

// Also export named mocks if they are imported directly (though not the case in ObsClient.ts)
export {
  mockConnect,
  mockDisconnect,
  mockCall,
  mockOn,
};
