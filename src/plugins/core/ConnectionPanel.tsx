import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from "@/components/ui";
import { ConnectionStatusIcon } from './ConnectionStatusIcon';
import { ConnectionProfile, ObsConnectionProfile, StreamerbotConnectionProfile } from '@/types/connections';
import useConnectionsStore, { selectIsObsConnected, selectIsObsLoading, selectObsError } from '@/store/connectionsStore';

interface ConnectionPanelProps {
  connection: ConnectionProfile;
  onEdit: (connection: ConnectionProfile) => void;
  onDelete: (id: string) => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ connection, onEdit, onDelete }) => {
  const {
    activeConnectionId,
    connectToObs,
    disconnectFromObs,
    connectToStreamerBot,
    disconnectFromStreamerBot,
    setActiveConnectionId,
    isStreamerBotConnected,
    isStreamerBotLoading,
    streamerBotConnectionError,
  } = useConnectionsStore(state => ({
    activeConnectionId: state.activeConnectionId,
    connectToObs: state.connectToObs,
    disconnectFromObs: state.disconnectFromObs,
    connectToStreamerBot: state.connectToStreamerBot,
    disconnectFromStreamerBot: state.disconnectFromStreamerBot,
    setActiveConnectionId: state.setActiveConnectionId,
    isStreamerBotConnected: state.isStreamerBotConnected,
    isStreamerBotLoading: state.isStreamerBotLoading,
    streamerBotConnectionError: state.streamerBotConnectionError,
  }));

  // Use selectors for OBS connection status
  const isCurrentConnection = activeConnectionId === connection.id;
  const isObsConnected = useConnectionsStore(selectIsObsConnected);
  const isObsLoading = useConnectionsStore(selectIsObsLoading);
  const obsError = useConnectionsStore(selectObsError);

  const handleConnectToggle = async () => {
    if (isCurrentConnection) {
      if (connection.type === 'obs') {
        disconnectFromObs();
      } else if (connection.type === 'streamerbot') {
        disconnectFromStreamerBot();
      }
      setActiveConnectionId(null);
    } else {
      let result;
      if (connection.type === 'obs') {
        result = await connectToObs((connection as ObsConnectionProfile).url, (connection as ObsConnectionProfile).password);
      } else if (connection.type === 'streamerbot') {
        result = await connectToStreamerBot((connection as StreamerbotConnectionProfile).host, (connection as StreamerbotConnectionProfile).port);
      }
      if (result && result.ok) {
        setActiveConnectionId(connection.id);
      }
      // Optionally handle error: result?.error
    }
  };

  const getStatus = () => {
    if (connection.type === 'obs') {
      return (
        <ConnectionStatusIcon
          isConnected={isObsConnected && isCurrentConnection}
          isConnecting={isObsLoading && isCurrentConnection}
          error={!!obsError && isCurrentConnection}
        />
      );
    } else {
      return (
        <ConnectionStatusIcon
          isConnected={isStreamerBotConnected && isCurrentConnection}
          isConnecting={isStreamerBotLoading && isCurrentConnection}
          error={streamerBotConnectionError !== null && isCurrentConnection}
        />
      );
    }
  };


  return (
    <Card className={`relative mb-4 ${isCurrentConnection ? 'border-2 border-green-500 shadow-lg' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{connection.name}</CardTitle>
          {getStatus()}
        </div>
        <CardDescription>
          {connection.type === 'obs' && (
            <span>OBS Studio ({ (connection as ObsConnectionProfile).url })</span>
          )}
          {connection.type === 'streamerbot' && (
            <span>Streamer.bot ({ (connection as StreamerbotConnectionProfile).host }:{ (connection as StreamerbotConnectionProfile).port })</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end space-x-2">
        <Button onClick={handleConnectToggle} variant={isCurrentConnection ? 'destructive' : 'default'}>
          {isCurrentConnection ? 'Disconnect' : 'Connect'}
        </Button>
        <Button onClick={() => onEdit(connection)} variant="secondary">
          Edit
        </Button>
        <Button onClick={() => onDelete(connection.id)} variant="outline">
          Delete
        </Button>
      </CardContent>
    </Card>
  );
};
