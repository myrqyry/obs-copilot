// src/types/automation.ts
import type { ObsAction } from './obsActions';

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
  cooldown: number; // Cooldown in seconds
}

export interface AutomationTrigger {
  eventName: string; // e.g., "StreamStateChanged"
  eventData?: Record<string, unknown>; // e.g., { outputState: "started" }
}

export interface AutomationCondition {
  id: string;
  type: 'scene' | 'source' | 'stream' | 'custom';
  field: string; // e.g., "currentProgramScene", "inputMuted", "outputActive"
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
  description?: string; // Human-readable description
}

export interface StreamerBotActionData {
  actionName?: string; // Make optional for new action types
  args?: Record<string, unknown>;
}

export interface FileExistsActionData {
  type: 'FileExists';
  path: string;
  variableName?: string;
}

export interface FolderExistsActionData {
  type: 'FolderExists';
  path: string;
  variableName?: string;
}

export interface AutomationAction {
  id: string;
  type: 'obs' | 'streamerbot';
  data: ObsAction | StreamerBotActionData | FileExistsActionData | FolderExistsActionData;
  description?: string; // Human-readable description
}

// Helper types for UI building
export interface EventDataField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[]; // For select type
  description?: string;
}

export interface ConditionFieldOption {
  field: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[]; // For select type
  description?: string;
}

// Common event data configurations
export const EVENT_DATA_CONFIGS: Record<string, EventDataField[]> = {
  StreamStateChanged: [
    {
      name: 'outputState',
      type: 'select',
      options: [
        'OBS_WEBSOCKET_OUTPUT_STARTING',
        'OBS_WEBSOCKET_OUTPUT_STARTED',
        'OBS_WEBSOCKET_OUTPUT_STOPPING',
        'OBS_WEBSOCKET_OUTPUT_STOPPED',
      ],
      description: 'Stream state to trigger on',
    },
  ],
  RecordStateChanged: [
    {
      name: 'outputState',
      type: 'select',
      options: [
        'OBS_WEBSOCKET_OUTPUT_STARTING',
        'OBS_WEBSOCKET_OUTPUT_STARTED',
        'OBS_WEBSOCKET_OUTPUT_STOPPING',
        'OBS_WEBSOCKET_OUTPUT_STOPPED',
      ],
      description: 'Record state to trigger on',
    },
  ],
  CurrentProgramSceneChanged: [
    {
      name: 'sceneName',
      type: 'string',
      description: 'Specific scene name to trigger on (leave empty for any scene)',
    },
  ],
  InputMuteStateChanged: [
    {
      name: 'inputName',
      type: 'string',
      description: 'Specific input name (leave empty for any input)',
    },
    {
      name: 'inputMuted',
      type: 'boolean',
      description: 'Mute state to trigger on',
    },
  ],
  SceneItemEnableStateChanged: [
    {
      name: 'sceneName',
      type: 'string',
      description: 'Scene name (leave empty for any scene)',
    },
    {
      name: 'sceneItemEnabled',
      type: 'boolean',
      description: 'Enable state to trigger on',
    },
  ],
};

// Common condition field options by type
export const CONDITION_FIELD_OPTIONS: Record<string, ConditionFieldOption[]> = {
  scene: [
    {
      field: 'currentProgramScene',
      label: 'Current Program Scene',
      type: 'string',
      description: 'The currently active scene',
    },
    {
      field: 'currentPreviewScene',
      label: 'Current Preview Scene',
      type: 'string',
      description: 'The currently previewed scene (Studio Mode)',
    },
  ],
  source: [
    {
      field: 'inputMuted',
      label: 'Input Muted',
      type: 'boolean',
      description: 'Whether a specific input is muted',
    },
    {
      field: 'inputActive',
      label: 'Input Active',
      type: 'boolean',
      description: 'Whether a specific input is active',
    },
  ],
  stream: [
    {
      field: 'streamActive',
      label: 'Stream Active',
      type: 'boolean',
      description: 'Whether streaming is currently active',
    },
    {
      field: 'recordActive',
      label: 'Recording Active',
      type: 'boolean',
      description: 'Whether recording is currently active',
    },
  ],
};

// Rule templates for quick setup
export interface RuleTemplate {
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: Omit<AutomationAction, 'id'>[];
}

export const RULE_TEMPLATES: RuleTemplate[] = [
  {
    name: 'Stream Started Notification',
    description: 'Send Streamer.bot action when stream starts',
    trigger: {
      eventName: 'StreamStateChanged',
      eventData: { outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED' },
    },
    actions: [
      {
        type: 'streamerbot',
        data: {
          actionName: 'Stream Started',
          args: {},
        },
        description: 'Trigger Stream Started action in Streamer.bot',
      },
    ],
  },
  {
    name: 'Gaming Scene Auto-Setup',
    description: 'When switching to Gaming scene, enable game capture and adjust audio',
    trigger: {
      eventName: 'CurrentProgramSceneChanged',
      eventData: { sceneName: 'Gaming' },
    },
    actions: [
      {
        type: 'obs',
        data: {
          type: 'setSceneItemEnabled',
          sceneName: 'Gaming',
          sourceName: 'Game Capture',
          sceneItemEnabled: true,
        },
        description: 'Enable Game Capture source',
      },
      {
        type: 'obs',
        data: {
          type: 'setInputVolume',
          inputName: 'Desktop Audio',
          inputVolumeMul: 0.8,
        },
        description: 'Lower desktop audio volume',
      },
    ],
  },
  {
    name: 'Mute Alert',
    description: 'Show alert when microphone is muted',
    trigger: {
      eventName: 'InputMuteStateChanged',
      eventData: { inputMuted: true },
    },
    conditions: [
      {
        id: 'condition-1',
        type: 'source',
        field: 'inputName',
        operator: 'contains',
        value: 'Mic',
        description: 'Input name contains "Mic"',
      },
    ],
    actions: [
      {
        type: 'obs',
        data: {
          type: 'setSceneItemEnabled',
          sceneName: 'current',
          sourceName: 'Muted Alert',
          sceneItemEnabled: true,
        },
        description: 'Show muted alert overlay',
      },
    ],
  },
];
