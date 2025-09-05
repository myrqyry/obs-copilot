import React, { useState, useEffect } from 'react';
import tmi from 'tmi.js';
import axios from 'axios';
import useSettingsStore from '@/store/settingsStore';

interface TwitchMessage {
  user: string;
  message: string;
  userId: string;
}

const TwitchChat: React.FC = () => {
  const [channel, setChannel] = useState('');
  const [messages, setMessages] = useState<TwitchMessage[]>([]);
  const [client, setClient] = useState<tmi.Client | null>(null);
  const { twitchAccessToken, twitchClientId } = useSettingsStore();

  useEffect(() => {
    if (client) {
      client.on('message', (channel, tags, message, self) => {
        if (self) return;
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            user: tags['display-name'] || 'anonymous',
            message,
            userId: tags['user-id'] || '',
          },
        ]);
      });
    }
  }, [client]);

  const handleConnect = () => {
    if (channel) {
      const newClient = new tmi.Client({
        options: { debug: true },
        identity: twitchAccessToken
          ? {
              username: 'justinfan123', // Anonymous username
              password: `oauth:${twitchAccessToken}`,
            }
          : undefined,
        channels: [channel],
      });
      newClient.connect();
      setClient(newClient);
    }
  };

  const handleDisconnect = () => {
    if (client) {
      client.disconnect();
      setClient(null);
      setMessages([]);
    }
  };

  const getUserId = async (username: string) => {
    try {
      const response = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': twitchClientId,
          Authorization: `Bearer ${twitchAccessToken}`,
        },
        params: {
          login: username,
        },
      });
      return response.data.data[0].id;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };

  const handleModerationAction = async (userId: string, duration?: number) => {
    if (!twitchAccessToken || !twitchClientId) {
      console.error('Twitch credentials not set.');
      return;
    }

    const broadcasterId = await getUserId(channel);
    if (!broadcasterId) {
      console.error('Could not get broadcaster ID.');
      return;
    }

    try {
      await axios.post(
        'https://api.twitch.tv/helix/moderation/bans',
        {
          data: {
            user_id: userId,
            duration,
            reason: 'Moderation action from OBS Copilot.',
          },
        },
        {
          headers: {
            'Client-ID': twitchClientId,
            Authorization: `Bearer ${twitchAccessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            broadcaster_id: broadcasterId,
            moderator_id: broadcasterId, // Assuming the authenticated user is the broadcaster
          },
        }
      );
    } catch (error) {
      console.error('Error performing moderation action:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Twitch Chat</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          placeholder="Enter Twitch channel name"
          className="p-2 rounded-md bg-input border border-border flex-grow"
        />
        {client ? (
          <button onClick={handleDisconnect} className="p-2 rounded-md bg-destructive text-destructive-foreground">
            Disconnect
          </button>
        ) : (
          <button onClick={handleConnect} className="p-2 rounded-md bg-primary text-primary-foreground">
            Connect
          </button>
        )}
      </div>
      <div className="h-96 overflow-y-auto border border-border rounded-md p-2 bg-background">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 group relative">
            <strong>{msg.user}:</strong> {msg.message}
            {twitchAccessToken && (
              <div className="absolute top-0 right-0 bg-card p-1 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleModerationAction(msg.userId, 600)} className="text-xs p-1 hover:bg-muted rounded">
                  Timeout (10m)
                </button>
                <button onClick={() => handleModerationAction(msg.userId)} className="text-xs p-1 hover:bg-muted rounded">
                  Ban
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TwitchChat;
