// TypeScript declaration for possible OBSWebSocket events
// This is a helper for editor autocomplete and type safety

declare module 'obs-websocket-js' {
    interface OBSWebSocket {
        on(event: 'error', listener: (err: Error) => void): this;
        on(event: 'ConnectionClosed', listener: (data: any) => void): this;
        on(event: 'ConnectionError', listener: (err: Error) => void): this;
        // ...other events
    }
}
