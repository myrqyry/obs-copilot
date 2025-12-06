import { useConnectionsStore } from '@/store/connections';
import { useAutomationStore } from '@/store/automationStore';
import { useOverlaysStore } from '@/store/overlaysStore';
import { logger } from '@/utils/logger';

export interface AppSnapshot {
  id: string;
  name: string;
  timestamp: number;
  connectionsState: ReturnType<typeof useConnectionsStore>['getState'];
  automationState: ReturnType<typeof useAutomationStore>['getState'];
  overlaysState: ReturnType<typeof useOverlaysStore>['getState'];
}

class SnapshotService {
  private static instance: SnapshotService;
  private snapshots: AppSnapshot[] = [];

  private constructor() {
    // Load snapshots from storage if available
    const storedSnapshots = localStorage.getItem('app-snapshots');
    if (storedSnapshots) {
      this.snapshots = JSON.parse(storedSnapshots);
    }
  }

  public static getInstance(): SnapshotService {
    if (!SnapshotService.instance) {
      SnapshotService.instance = new SnapshotService();
    }
    return SnapshotService.instance;
  }

  public createSnapshot(name: string): AppSnapshot {
    const connectionsState = useConnectionsStore.getState();
    const automationState = useAutomationStore.getState();
    const overlaysState = useOverlaysStore.getState();

    const snapshot: AppSnapshot = {
      id: `snapshot_${Date.now()}`,
      name,
      timestamp: Date.now(),
      connectionsState,
      automationState,
      overlaysState,
    };

    this.snapshots.push(snapshot);
    this.saveSnapshots();
    logger.info(`[SnapshotService] Created snapshot: ${name}`);
    return snapshot;
  }

  public restoreSnapshot(id: string): boolean {
    const snapshot = this.snapshots.find(s => s.id === id);
    if (snapshot) {
      useConnectionsStore.setState(snapshot.connectionsState);
      useAutomationStore.setState(snapshot.automationState);
      useOverlaysStore.setState(snapshot.overlaysState);
      this.saveSnapshots(); // Update timestamp or re-save if needed
      logger.info(`[SnapshotService] Restored snapshot: ${snapshot.name}`);
      return true;
    }
    logger.warn(`[SnapshotService] Snapshot with id ${id} not found.`);
    return false;
  }

  public getSnapshots(): AppSnapshot[] {
    return [...this.snapshots];
  }

  public deleteSnapshot(id: string): void {
    this.snapshots = this.snapshots.filter(s => s.id !== id);
    this.saveSnapshots();
    logger.info(`[SnapshotService] Deleted snapshot with id: ${id}`);
  }

  private saveSnapshots(): void {
    localStorage.setItem('app-snapshots', JSON.stringify(this.snapshots));
  }
}

export const snapshotService = SnapshotService.getInstance();
