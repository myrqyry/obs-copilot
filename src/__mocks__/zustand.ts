const create = () => () => {
    const state = {};
    const store = {
        getState: () => state,
        setState: jest.fn(),
        subscribe: jest.fn(),
        destroy: jest.fn(),
        persist: {
            getOptions: jest.fn(),
            setOptions: jest.fn(),
            clearStorage: jest.fn(),
            rehydrate: jest.fn(),
            hasHydrated: jest.fn(),
            onHydrate: jest.fn(),
            onFinishHydration: jest.fn(),
        }
    };
    return store;
};

export default create;
