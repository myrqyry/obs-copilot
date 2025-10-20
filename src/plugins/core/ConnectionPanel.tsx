import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from "@/components/ui";
import { ConnectionStatusIcon } from './ConnectionStatusIcon';
import { ConnectionProfile, ObsConnectionProfile, StreamerbotConnectionProfile } from '@/types/connections';
import useConnectionsStore from '@/store/connectionsStore';

interface ConnectionPanelProps {
  connection: ConnectionProfile;
  onEdit: (connection: ConnectionProfile) => void;
  onDelete: (id: string) => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ connection, onEdit, onDelete }) => {
  const activeConnectionId = useConnectionsStore(state => state.activeConnectionId);
  const connectToObs = useConnectionsStore(state => state.connectToObs);
  const disconnectFromObs = useConnectionsStore(state => state.disconnectFromObs);
  const connectToStreamerBot = useConnectionsStore(state => state.connectToStreamerBot);
  const disconnectFromStreamerBot = useConnectionsStore(state => state.disconnectFromStreamerBot);
  const setActiveConnectionId = useConnectionsStore(state => state.setActiveConnectionId);
  const obsStatus = useConnectionsStore(state => state.obsStatus);
  const connectionError = useConnectionsStore(state => state.connectionError);
  const isStreamerBotConnected = useConnectionsStore(state => state.isStreamerBotConnected);
  const isStreamerBotLoading = useConnectionsStore(state => state.isStreamerBotLoading);
  const streamerBotConnectionError = useConnectionsStore(state => state.streamerBotConnectionError);

  const isCurrentConnection = activeConnectionId === connection.id;
  const isObsConnected = obsStatus === 'connected';
  const isObsLoading = obsStatus === 'connecting' || obsStatus === 'reconnecting';

  const handleConnectToggle = async () => {
    if (isCurrentConnection) {
      if (connection.type === 'obs') {
        disconnectFromObs();
      } else if (connection.type === 'streamerbot') {
        disconnectFromStreamerBot();
      }
      setActiveConnectionId(null);
    } else {
      if (connection.type === 'obs') {
        await connectToObs((connection as ObsConnectionProfile).url, (connection as ObsConnectionProfile).password);
      } else if (connection.type === 'streamerbot') {
        await connectToStreamerBot((connection as StreamerbotConnectionProfile).host, (connection as StreamerbotConnectionProfile).port);
      }
      // After attempting connection, check the store's state
      const state = useConnectionsStore.getState();
      if (
        (connection.type === 'obs' && state.obsStatus === 'connected') ||
        (connection.type === 'streamerbot' && state.isStreamerBotConnected)
      ) {
        setActiveConnectionId(connection.id);
      }
    }
  };

  const getStatus = () => {
    let isConnected, isConnecting, hasError;

    if (connection.type === 'obs') {
      isConnected = isObsConnected && isCurrentConnection;
      isConnecting = isObsLoading && isCurrentConnection;
      hasError = connectionError !== null && isCurrentConnection;
    } else { // streamerbot
      isConnected = isStreamerBotConnected && isCurrentConnection;
      isConnecting = isStreamerBotLoading && isCurrentConnection;
      hasError = streamerBotConnectionError !== null && isCurrentConnection;
    }

    return (
        <ConnectionStatusIcon
            isConnected={isConnected}
            isConnecting={isConnecting}
            error={hasError}
        />
    );
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
