import React, { useState } from 'react';
import ConnectionForm from './ConnectionForm';
import { ConnectionPanel } from './ConnectionPanel';
import useConnectionsStore from '@/store/connectionsStore';
import { ConnectionProfile } from '@/types/connections';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import useTwitchStore from '@/store/twitchStore';
import useStreamerbotStore from '@/store/streamerbotStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ConnectionsTab: React.FC = () => {
  const {
    connectionProfiles,
    addConnectionProfile,
    updateConnectionProfile,
    removeConnectionProfile,
  } = useConnectionsStore();

  const {
    twitchClientId,
    twitchClientSecret,
    twitchAccessToken,
    setTwitchClientId,
    setTwitchClientSecret,
    setTwitchAccessToken,
    setTwitchRefreshToken,
  } = useTwitchStore();

  const {
    streamerBotHost,
    streamerBotPort,
    setStreamerBotHost,
    setStreamerBotPort,
  } = useStreamerbotStore();

  const [editingProfile, setEditingProfile] = useState<ConnectionProfile | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSaveConnection = (profile: ConnectionProfile) => { // profile now includes id
    if (editingProfile) {
      updateConnectionProfile(profile); // profile is already a complete ConnectionProfile
    } else {
      addConnectionProfile(profile); // profile is already a complete ConnectionProfile with generated id
    }
    setIsFormOpen(false); // Close form after saving
    setEditingProfile(undefined); // Clear editing state
  };

  const handleEdit = (profile: ConnectionProfile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    removeConnectionProfile(id);
  };

  const handleAddClick = () => {
    setEditingProfile(undefined); // Clear any previous editing state
    setIsFormOpen(true);
  };

  const handleTwitchLogin = () => {
    const redirectUri = 'http://localhost:5173/auth/twitch/callback';
    const scope = 'chat:read+chat:edit+channel:moderate';
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = url;
  };

  const handleTwitchLogout = () => {
    setTwitchAccessToken('');
    setTwitchRefreshToken('');
  };

  return (
    <div className="connections-tab p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Connections</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Existing Connections List */}
        <div className="existing-connections">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            Your Connections
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleAddClick}>
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingProfile ? 'Edit Connection' : 'Add New Connection'}</DialogTitle>
                  <DialogDescription>Define credentials and endpoints for OBS or Streamer.bot.</DialogDescription>
                </DialogHeader>
                <ConnectionForm
                  onSave={handleSaveConnection}
                  initialProfile={editingProfile}
                />
              </DialogContent>
            </Dialog>
          </h2>
          <div className="border p-4 rounded-md shadow-sm">
            {connectionProfiles.length > 0 ? (
              connectionProfiles.map((connection) => (
                <ConnectionPanel
                  key={connection.id}
                  connection={connection}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <p className="text-gray-600">Your configured connections will appear here. Click "Add New" to create one.</p>
            )}
          </div>
        </div>

        {/* Placeholder for ConnectionForm to keep it here visually without opening a dialog on top */}
        <div className="add-new-connection hidden lg:block">
            <h2 className="text-xl font-semibold mb-4">Add New Connection</h2>
            <div className="border p-4 rounded-md shadow-sm">
                <ConnectionForm onSave={handleSaveConnection} />
            </div>
        </div>

        <div className="twitch-connection">
            <h2 className="text-xl font-semibold mb-4">Twitch Connection</h2>
            <div className="border p-4 rounded-md shadow-sm space-y-4">
                <div>
                    <Label htmlFor="twitch-client-id">Client ID</Label>
                    <Input id="twitch-client-id" value={twitchClientId} onChange={(e) => setTwitchClientId(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="twitch-client-secret">Client Secret</Label>
                    <Input id="twitch-client-secret" type="password" value={twitchClientSecret} onChange={(e) => setTwitchClientSecret(e.target.value)} />
                </div>
                {twitchAccessToken ? (
                    <Button onClick={handleTwitchLogout} variant="destructive">Logout from Twitch</Button>
                ) : (
                    <Button onClick={handleTwitchLogin}>Login with Twitch</Button>
                )}
            </div>
        </div>

        <div className="streamerbot-connection">
            <h2 className="text-xl font-semibold mb-4">Streamer.bot Connection</h2>
            <div className="border p-4 rounded-md shadow-sm space-y-4">
                <div>
                    <Label htmlFor="streamerbot-host">Host</Label>
                    <Input id="streamerbot-host" value={streamerBotHost} onChange={(e) => setStreamerBotHost(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="streamerbot-port">Port</Label>
                    <Input id="streamerbot-port" type="text" value={streamerBotPort} onChange={(e) => setStreamerBotPort(e.target.value)} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsTab;
