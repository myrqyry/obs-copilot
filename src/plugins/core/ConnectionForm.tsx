import React, { useState, useEffect } from 'react';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConnectionProfile, ObsConnectionProfile, StreamerbotConnectionProfile, ConnectionType } from '@/types/connections';
import { nanoid } from 'nanoid';

interface ConnectionFormProps {
  onSave: (profile: ConnectionProfile) => void; // Now accepts full ConnectionProfile
  initialProfile?: ConnectionProfile;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onSave, initialProfile }) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [type, setType] = useState<ConnectionType>(initialProfile?.type || 'obs');
  const [obsUrl, setObsUrl] = useState<string>('');
  const [obsPassword, setObsPassword] = useState<string>('');
  const [streamerBotHost, setStreamerBotHost] = useState<string>('');
  const [streamerBotPort, setStreamerBotPort] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setType(initialProfile.type);
      if (initialProfile.type === 'obs') {
        setObsUrl((initialProfile as ObsConnectionProfile).url);
        setObsPassword((initialProfile as ObsConnectionProfile).password || '');
      } else {
        setStreamerBotHost((initialProfile as StreamerbotConnectionProfile).host);
        setStreamerBotPort((initialProfile as StreamerbotConnectionProfile).port.toString());
      }
    }
  }, [initialProfile]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newProfile: ConnectionProfile | null = null;
    const commonProps = { name, type, id: initialProfile?.id || nanoid() }; // Generate ID if new

    if (type === 'obs') {
      newProfile = {
        ...commonProps,
        type: 'obs',
        url: obsUrl,
        password: obsPassword,
      } as ObsConnectionProfile;
    } else if (type === 'streamerbot') {
      const portNumber = parseInt(streamerBotPort, 10);
      if (isNaN(portNumber)) {
        toast({
          title: "Error",
          description: "Streamer.bot port must be a number.",
          variant: "destructive"
        });
        return;
      }
      newProfile = {
        ...commonProps,
        type: 'streamerbot',
        host: streamerBotHost,
        port: portNumber,
      } as StreamerbotConnectionProfile;
    }

    if (newProfile) {
      onSave(newProfile);
      toast({
        title: initialProfile ? "Connection Updated" : "Connection Saved",
        description: `${newProfile.name} has been ${initialProfile ? 'updated' : 'saved'}.`,
      });
      // Clear form after saving a new connection
      if (!initialProfile) {
        setName('');
        setObsUrl('');
        setObsPassword('');
        setStreamerBotHost('');
        setStreamerBotPort('');
        setType('obs');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialProfile ? 'Edit Connection' : 'Add New Connection'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connection-name">Connection Name</Label>
            <Input
              id="connection-name"
              placeholder="My Streaming PC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="connection-type">Type</Label>
            <Select onValueChange={(value: ConnectionType) => setType(value)} value={type}>
              <SelectTrigger id="connection-type">
                <SelectValue placeholder="Select connection type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obs">OBS Studio</SelectItem>
                <SelectItem value="streamerbot">Streamer.bot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'obs' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="obs-url">OBS WebSocket URL</Label>
                <Input
                  id="obs-url"
                  placeholder="ws://localhost:4455"
                  value={obsUrl}
                  onChange={(e) => setObsUrl(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs-password">OBS WebSocket Password (optional)</Label>
                <Input
                  id="obs-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={obsPassword}
                  onChange={(e) => setObsPassword(e.target.value)}
                />
              </div>
            </>
          )}

          {type === 'streamerbot' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="streamerbot-host">Host</Label>
                <Input
                  id="streamerbot-host"
                  placeholder="localhost"
                  value={streamerBotHost}
                  onChange={(e) => setStreamerBotHost(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streamerbot-port">Port</Label>
                <Input
                  id="streamerbot-port"
                  placeholder="8080"
                  value={streamerBotPort}
                  onChange={(e) => setStreamerBotPort(e.target.value)}
                  type="number"
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit">
            {initialProfile ? 'Save Changes' : 'Add Connection'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConnectionForm;
