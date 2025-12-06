import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/input';

interface ChatConnectionInputProps {
  channel: string;
  setChannel: (channel: string) => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ChatConnectionInput: React.FC<ChatConnectionInputProps> = ({
  channel,
  setChannel,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  return (
    <div className="flex gap-2 mb-3">
      <Input
        id="twitch-channel"
        placeholder="channel"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        className="p-2 rounded border-border transition-all duration-200 ease-in-out"
      />
      {isConnected ? (
        <Button onClick={onDisconnect} variant="destructive" size="sm" className="p-2">Disconnect</Button>
      ) : (
        <Button onClick={onConnect} variant="default" size="sm" className="p-2">Connect</Button>
      )}
    </div>
  );
};

export default ChatConnectionInput;