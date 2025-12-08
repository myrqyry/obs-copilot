import { logger } from '@/shared/utils/logger';
import { obsClient } from './obsClient';

export interface StateChange {
  timestamp: number;
  changes: Record<string, any>;
  type: 'scene' | 'source' | 'output' | 'config';
}

export interface StateWithChanges {
  full_state: any;
  changes: Record<string, any> | null;
  recent_changes: StateChange[];
  is_first_query: boolean;
  state_version: number;
}

export class ObsStateManager {
  private previousState: any = null;
  private changeLog: StateChange[] = [];
  private stateVersion = 0;
  private readonly MAX_CHANGE_HISTORY = 10;

  /**
   * Get current OBS state with change detection
   */
  async getStateWithChanges(): Promise<StateWithChanges> {
    const currentState = await obsClient.getFullState();
    this.stateVersion++;

    // First query - no previous state to compare
    if (!this.previousState) {
      this.previousState = currentState;
      return {
        full_state: currentState,
        changes: null,
        recent_changes: [],
        is_first_query: true,
        state_version: this.stateVersion
      };
    }

    // Detect changes
    const changes = this.detectChanges(this.previousState, currentState);

    // Log changes if any
    if (Object.keys(changes).length > 0) {
      const changeType = this.categorizeChanges(changes);
      const changeRecord: StateChange = {
        timestamp: Date.now(),
        changes,
        type: changeType
      };
      
      this.changeLog.push(changeRecord);
      
      // Keep only recent changes
      if (this.changeLog.length > this.MAX_CHANGE_HISTORY) {
        this.changeLog.shift();
      }

      logger.info(`[StateManager] Detected ${Object.keys(changes).length} changes:`, changes);
    }

    this.previousState = currentState;

    return {
      full_state: currentState,
      changes,
      recent_changes: this.changeLog.slice(-3),
      is_first_query: false,
      state_version: this.stateVersion
    };
  }

  /**
   * Detect changes between two states
   */
  private detectChanges(prev: any, curr: any): Record<string, any> {
    const changes: Record<string, any> = {};

    // Scene changes
    if (prev.current_scene !== curr.current_scene) {
      changes.scene_changed = {
        from: prev.current_scene,
        to: curr.current_scene
      };
    }

    // Scene list changes
    const prevScenes = new Set(prev.available_scenes || []);
    const currScenes = new Set(curr.available_scenes || []);

    const addedScenes = [...currScenes].filter(s => !prevScenes.has(s));
    const removedScenes = [...prevScenes].filter(s => !currScenes.has(s));

    if (addedScenes.length > 0) changes.scenes_added = addedScenes;
    if (removedScenes.length > 0) changes.scenes_removed = removedScenes;

    // Source/input changes
    const prevSources = new Set((prev.active_sources || []).map((s: any) => s.inputName));
    const currSources = new Set((curr.active_sources || []).map((s: any) => s.inputName));

    const addedSources = [...currSources].filter(s => !prevSources.has(s));
    const removedSources = [...prevSources].filter(s => !currSources.has(s));

    if (addedSources.length > 0) changes.sources_added = addedSources;
    if (removedSources.length > 0) changes.sources_removed = removedSources;

    // Detect source property changes (volume, mute, etc.)
    const sourceChanges = this.detectSourceChanges(prev.active_sources, curr.active_sources);
    if (Object.keys(sourceChanges).length > 0) {
      changes.source_changes = sourceChanges;
    }

    // Streaming status changes
    if (prev.streaming_status !== curr.streaming_status) {
      changes.streaming = curr.streaming_status ? 'started' : 'stopped';
    }

    // Recording status changes
    if (prev.recording_status !== curr.recording_status) {
      changes.recording = curr.recording_status ? 'started' : 'stopped';
    }

    return changes;
  }

  /**
   * Detect changes in source properties
   */
  private detectSourceChanges(prevSources: any[], currSources: any[]): Record<string, any> {
    const changes: Record<string, any> = {};

    if (!prevSources || !currSources) return changes;

    const prevSourceMap = new Map(prevSources.map((s: any) => [s.inputName, s]));
    const currSourceMap = new Map(currSources.map((s: any) => [s.inputName, s]));

    for (const [name, currSource] of currSourceMap) {
      const prevSource = prevSourceMap.get(name);
      if (!prevSource) continue;

      const sourceChanges: any = {};

      // Volume changes
      if (prevSource.inputVolumeDb !== currSource.inputVolumeDb) {
        sourceChanges.volume = {
          from: prevSource.inputVolumeDb,
          to: currSource.inputVolumeDb
        };
      }

      // Mute changes
      if (prevSource.inputMuted !== currSource.inputMuted) {
        sourceChanges.muted = currSource.inputMuted;
      }

      if (Object.keys(sourceChanges).length > 0) {
        changes[name] = sourceChanges;
      }
    }

    return changes;
  }

  /**
   * Categorize changes for better logging
   */
  private categorizeChanges(changes: Record<string, any>): 'scene' | 'source' | 'output' | 'config' {
    if (changes.scene_changed || changes.scenes_added || changes.scenes_removed) {
      return 'scene';
    }
    if (changes.sources_added || changes.sources_removed || changes.source_changes) {
      return 'source';
    }
    if (changes.streaming !== undefined || changes.recording !== undefined) {
      return 'output';
    }
    return 'config';
  }

  /**
   * Get change summary for display
   */
  getChangeSummary(changes: Record<string, any>): string {
    const summaries: string[] = [];

    if (changes.scene_changed) {
      summaries.push(`Scene: ${changes.scene_changed.from} → ${changes.scene_changed.to}`);
    }

    if (changes.sources_added) {
      summaries.push(`Added sources: ${changes.sources_added.join(', ')}`);
    }

    if (changes.sources_removed) {
      summaries.push(`Removed sources: ${changes.sources_removed.join(', ')}`);
    }

    if (changes.streaming) {
      summaries.push(`Stream ${changes.streaming}`);
    }

    if (changes.recording) {
      summaries.push(`Recording ${changes.recording}`);
    }

    return summaries.join(' | ') || 'No changes';
  }

  /**
   * Reset state tracking (call when reconnecting)
   */
  reset(): void {
    this.previousState = null;
    this.changeLog = [];
    this.stateVersion = 0;
    logger.info('[StateManager] State tracking reset');
  }

  /**
   * Get recent changes for debugging
   */
  getRecentChanges(): StateChange[] {
    return [...this.changeLog];
  }
}

export const obsStateManager = new ObsStateManager();
