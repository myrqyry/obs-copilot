export interface ConnectionSettings {
    obsUrl: string;
    obsPassword?: string;
    autoConnect: boolean;
    rememberApiKey?: boolean;
    streamerBotAddress?: string;
    streamerBotPort?: string;
}

export interface ConnectionState extends ConnectionSettings {
    isConnected: boolean;
    lastConnected?: Date;
    connectionError?: string;
}
