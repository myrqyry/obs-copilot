import { create } from 'zustand';
import { AutomationRule } from '../types/automation';
import { StreamerBotService } from '../services/streamerBotService';
import { automationService } from '../services/automationService';
import { saveUserSettings } from '../utils/persistence';

export interface AutomationState {
  automationRules: AutomationRule[];
  streamerBotServiceInstance: StreamerBotService | null;
  actions: {
    addAutomationRule: (rule: AutomationRule) => void;
    updateAutomationRule: (id: string, updates: Partial<AutomationRule>) => void;
    deleteAutomationRule: (id: string) => void;
    toggleAutomationRule: (id: string) => void;
    setStreamerBotServiceInstance: (instance: StreamerBotService | null) => void;
  };
}

export const useAutomationStore = create<AutomationState>((set, get) => ({
  automationRules: [],
  streamerBotServiceInstance: null,
  actions: {
    addAutomationRule: (rule) => {
      const updatedRules = [...get().automationRules, rule];
      set({ automationRules: updatedRules });
      saveUserSettings({ automationRules: updatedRules });
      automationService.updateRules(updatedRules);
    },
    updateAutomationRule: (id, updates) => {
      const updatedRules = get().automationRules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule,
      );
      set({ automationRules: updatedRules });
      saveUserSettings({ automationRules: updatedRules });
      automationService.updateRules(updatedRules);
    },
    deleteAutomationRule: (id) => {
      const updatedRules = get().automationRules.filter((rule) => rule.id !== id);
      set({ automationRules: updatedRules });
      saveUserSettings({ automationRules: updatedRules });
      automationService.updateRules(updatedRules);
    },
    toggleAutomationRule: (id) => {
      const updatedRules = get().automationRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
      );
      set({ automationRules: updatedRules });
      saveUserSettings({ automationRules: updatedRules });
      automationService.updateRules(updatedRules);
    },
    setStreamerBotServiceInstance: (instance) => {
      set({ streamerBotServiceInstance: instance });
      // This part of the logic needs to be updated in the component that uses it,
      // as it depends on other stores.
    },
  },
}));
