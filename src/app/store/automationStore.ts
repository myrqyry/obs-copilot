import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AutomationRule } from '@/shared/types/automation';
import { StreamerBotService } from '@/shared/services/streamerBotService';
import { automationService } from '@/shared/services/automationService';

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

export const useAutomationStore = create<AutomationState>()(
  persist(
    (set, get) => ({
      automationRules: [],
      streamerBotServiceInstance: null,
      actions: {
        addAutomationRule: (rule) => {
          const updatedRules = [...get().automationRules, rule];
          set({ automationRules: updatedRules });
          automationService.updateRules(updatedRules);
        },
        updateAutomationRule: (id, updates) => {
          const updatedRules = get().automationRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule,
          );
          set({ automationRules: updatedRules });
          automationService.updateRules(updatedRules);
        },
        deleteAutomationRule: (id) => {
          const updatedRules = get().automationRules.filter((rule) => rule.id !== id);
          set({ automationRules: updatedRules });
          automationService.updateRules(updatedRules);
        },
        toggleAutomationRule: (id) => {
          const updatedRules = get().automationRules.map((rule) =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
          );
          set({ automationRules: updatedRules });
          automationService.updateRules(updatedRules);
        },
        setStreamerBotServiceInstance: (instance) => {
          set({ streamerBotServiceInstance: instance });
        },
      },
    }),
    {
      name: 'automation-rules-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        automationRules: state.automationRules,
      }),
    }
  )
);

export default useAutomationStore;
