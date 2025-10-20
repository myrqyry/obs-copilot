import React, { useState, useEffect } from 'react';
import { snapshotService, AppSnapshot } from '@/services/snapshotService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from '@/components/ui/toast';

const SnapshotManager: React.FC = () => {
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshots, setSnapshots] = useState<AppSnapshot[]>([]);

  useEffect(() => {
    setSnapshots(snapshotService.getSnapshots());
  }, []);

  const handleCreateSnapshot = () => {
    if (!snapshotName.trim()) {
      toast({
        title: "Error",
        description: "Snapshot name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const newSnapshot = snapshotService.createSnapshot(snapshotName);
    setSnapshots(snapshotService.getSnapshots());
    setSnapshotName('');
    toast({
      title: "Success",
      description: `Snapshot '${newSnapshot.name}' created.`, 
    });
  };

  const handleRestoreSnapshot = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to restore this snapshot? This will overwrite your current application state.");
    if (confirmed) {
      const success = snapshotService.restoreSnapshot(id);
      if (success) {
        toast({
          title: "Success",
          description: "Application state restored.",
        });
        // Optionally, refresh UI or navigate
      } else {
        toast({
          title: "Error",
          description: "Failed to restore snapshot.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this snapshot?");
    if (confirmed) {
      snapshotService.deleteSnapshot(id);
      setSnapshots(snapshotService.getSnapshots());
      toast({
        title: "Success",
        description: "Snapshot deleted.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Snapshots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Snapshot Name"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
          />
          <Button onClick={handleCreateSnapshot}>Create Snapshot</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No snapshots found.
                </TableCell>
              </TableRow>
            ) : (
              snapshots.map((snapshot) => (
                <TableRow key={snapshot.id}>
                  <TableCell className="font-medium">{snapshot.name}</TableCell>
                  <TableCell>{format(new Date(snapshot.timestamp), 'PPP p')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleRestoreSnapshot(snapshot.id)} className="mr-2">
                      Restore
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSnapshot(snapshot.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SnapshotManager;
