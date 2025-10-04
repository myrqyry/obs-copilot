import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConnectionProfile, ObsConnectionProfile, ConnectionType } from '@/types/connections';
import { nanoid } from 'nanoid';

// Helper function for URL validation
const isValidObsUrl = (url: string): boolean => {
  try {
    const u = new URL(url.startsWith('http') ? url.replace(/^https?:\/\//, 'ws://') : url);
    return (u.protocol === 'ws:' || u.protocol === 'wss:') &&
           (u.hostname && (u.hostname.match(/^(localhost|127\.0\.0\.1|[a-zA-Z0-9.-]+)$/)) !== null) &&
           (u.port === '' || /^\d+$/.test(u.port)) &&
           u.pathname === '/';
  } catch {
    return false;
  }
};

interface ConnectionFormProps {
  onSave: (profile: ConnectionProfile) => void;
  initialProfile?: ConnectionProfile;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onSave, initialProfile }) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [type, setType] = useState<ConnectionType>(initialProfile?.type || 'obs');
  const [obsUrl, setObsUrl] = useState<string>('');
  const [obsPassword, setObsPassword] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setType(initialProfile.type);
      if (initialProfile.type === 'obs') {
        setObsUrl((initialProfile as ObsConnectionProfile).url);
        setObsPassword((initialProfile as ObsConnectionProfile).password || '');
      }
    }
  }, [initialProfile]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newProfile: ConnectionProfile | null = null;
    const commonProps = { name, type, id: initialProfile?.id || nanoid() };

    if (type === 'obs') {
      newProfile = {
        ...commonProps,
        type: 'obs',
        url: obsUrl,
        password: obsPassword,
      } as ObsConnectionProfile;
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
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setObsUrl(newUrl);
                    // Real-time validation
                    if (newUrl && !isValidObsUrl(newUrl)) {
                      toast({
                        title: "Invalid URL",
                        description: "Please enter a valid WebSocket URL (e.g., ws://localhost:4455)",
                        variant: "destructive"
                      });
                    }
                  }}
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

          <Button type="submit">
            {initialProfile ? 'Save Changes' : 'Add Connection'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ConnectionForm;