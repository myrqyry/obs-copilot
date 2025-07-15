const obsWebSocketMock = {
    default: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        call: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        off: jest.fn(),
    })),
};

export = obsWebSocketMock;
