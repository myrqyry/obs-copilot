import { StateCreator } from 'zustand';
import type { ConnectionProfile } from '@/shared/types/connections';

export interface ConnectionProfilesState {
  connectionProfiles: ConnectionProfile[];
  activeConnectionId: string | null;
  addConnectionProfile: (profile: ConnectionProfile) => void;
  updateConnectionProfile: (profile: ConnectionProfile) => void;
  removeConnectionProfile: (id: string) => void;
  clearAllProfiles: () => void;
  setActiveConnectionId: (id: string | null) => void;
}

export const createConnectionProfilesSlice: StateCreator<ConnectionProfilesState, [], [], ConnectionProfilesState> = (set) => ({
  connectionProfiles: [],
  activeConnectionId: null,

  addConnectionProfile: (profile: ConnectionProfile) => {
    set((state) => ({
      connectionProfiles: [...state.connectionProfiles, profile],
    }));
  },

  updateConnectionProfile: (updatedProfile: ConnectionProfile) => {
    set((state) => ({
      connectionProfiles: state.connectionProfiles.map((p) =>
        p.id === updatedProfile.id ? updatedProfile : p
      ),
    }));
  },

  removeConnectionProfile: (id: string) => {
    set((state) => ({
      connectionProfiles: state.connectionProfiles.filter((p) => p.id !== id),
      activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
    }));
  },

  clearAllProfiles: () => {
    set({ connectionProfiles: [], activeConnectionId: null });
  },

  setActiveConnectionId: (id: string | null) => {
    set({ activeConnectionId: id });
  },
});