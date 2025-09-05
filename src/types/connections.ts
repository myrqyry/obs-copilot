export type ConnectionType = 'obs' | 'streamerbot';

export interface BaseConnectionProfile {
  id: string;
  name: string;
  type: ConnectionType;
}

export interface ObsConnectionProfile extends BaseConnectionProfile {
  type: 'obs';
  url: string;
  password?: string;
}

export interface StreamerbotConnectionProfile extends BaseConnectionProfile {
  type: 'streamerbot';
  host: string;
  port: number;
}

export type ConnectionProfile = ObsConnectionProfile | StreamerbotConnectionProfile;