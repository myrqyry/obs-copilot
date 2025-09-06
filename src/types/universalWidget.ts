// src/types/universalWidget.ts
// Core Type Definitions for Universal OBS Widget System
// These types provide the foundation for widget configuration, state management,
// and integration with OBS actions from obsActions.ts

import { ObsAction } from './obsActions';

// Type aliases for compatibility
export type ObsActionType = ObsAction['type'];

// Enums
export enum WidgetControlType {
  BUTTON = 'button',
  SWITCH = 'switch',
  SLIDER = 'slider',
  KNOB = 'knob',
  PICKER = 'picker',
  STATUS = 'status',
  STEPPER = 'stepper',
  COLOR = 'color',
  TEXT = 'text',
  MULTI = 'multi',
  PROGRESS = 'progress',
  METER = 'meter',
  CHART = 'chart',
  // Phase 3 Advanced Types
  AUDIO_VOLUME = 'audioVolume',
  AUDIO_METER = 'audioMeter',
  AUDIO_MIXER = 'audioMixer',
  AUDIO_FILTER = 'audioFilter',
  SCENE_SWITCHER = 'sceneSwitcher',
  SCENE_CREATOR = 'sceneCreator',
  SCENE_ORGANIZER = 'sceneOrganizer',
  TRANSITION = 'transition',
  TRANSFORM = 'transform',
  VISIBILITY = 'visibility',
  FILTER_MANAGER = 'filterManager',
  SOURCE_SETTINGS = 'sourceSettings'
}

export enum TargetType {
  INPUT = 'input',
  SCENE = 'scene',
  TRANSITION = 'transition',
  FILTER = 'filter',
  OUTPUT = 'output',
  MEDIA = 'media',
  GENERAL = 'general'
}

// Core Configuration Interfaces
export interface UniversalWidgetConfig {
  id: string;
  name: string;
  description?: string;
  controlType: WidgetControlType;
  actionType: ObsActionType; // Compatible with OBS actions
  targetType: TargetType;
  targetName?: string; // Specific target (e.g., input name, scene name)
  property?: string; // Specific property to control
  valueMapping?: ValueMappingConfig;
  eventSubscriptions?: string[]; // OBS events for real-time updates
  visualConfig?: VisualWidgetConfig;
  reactionConfig?: ReactionConfig;
  validation?: ValidationConfig;
  performance?: PerformanceConfig;
  enabled?: boolean;
  hidden?: boolean;
  groupId?: string;
  order?: number;
  createdAt?: number;
  updatedAt?: number;
  // Phase 3 Advanced Configurations
  audioConfig?: AudioConfig;
  sceneConfig?: SceneConfig;
  sourceConfig?: SourceConfig;
  transformConfig?: TransformConfig;
  visibilityConfig?: VisibilityConfig;
  filterConfig?: FilterConfig;
}

export interface ValueMappingConfig {
  min?: number;
  max?: number;
  step?: number;
  scale?: 'linear' | 'logarithmic' | 'exponential';
  invert?: boolean;
  customMapping?: Record<string, any>;
  defaultValue?: any;
  unit?: string; // e.g., 'dB', '%', 'px'
  precision?: number; // Decimal places
  format?: (value: number) => string;
}

export interface VisualWidgetConfig {
  theme?: string; // e.g., 'dark', 'light', 'custom'
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  size?: 'small' | 'medium' | 'large' | 'custom';
  icon?: string;
  label?: string;
  showValue?: boolean;
  showLabel?: boolean;
  showUnit?: boolean;
  orientation?: 'horizontal' | 'vertical';
  customStyles?: Record<string, string>;
}

export interface ReactionConfig {
  onClick?: ActionConfig[];
  onChange?: ActionConfig[];
  onDoubleClick?: ActionConfig[];
  onLongPress?: ActionConfig[];
  onObsEvent?: Record<string, ActionConfig[]>;
  conditions?: ConditionalAction[];
  sequenceDelay?: number; // ms between actions in sequence
}

export interface ActionConfig {
  actionType: ObsActionType;
  parameters?: Record<string, any>;
  delay?: number; // ms
  condition?: string; // Simple condition expression
  targetOverride?: string;
}

export interface ConditionalAction {
  condition: string; // e.g., 'value > 50', 'obs.connected'
  then: ActionConfig[];
  else?: ActionConfig[];
}

export interface ValidationConfig {
  requiredParams?: string[];
  paramTypes?: Record<string, string>; // 'string', 'number', 'boolean'
  valueRanges?: Record<string, { min?: number; max?: number }>;
  customValidator?: (params: Record<string, any>) => boolean;
}

export interface PerformanceConfig {
  debounceMs?: number; // For change events
  throttleMs?: number; // For rapid updates
  maxFrequency?: number; // Updates per second
  cacheResults?: boolean;
  offlineBehavior?: 'queue' | 'skip' | 'error';
}

// State Management Interfaces
export interface WidgetState {
  id: string;
  value: any; // Current value
  isActive: boolean;
  isLoading: boolean;
  isDirty: boolean; // Has unsynced changes
  error?: string;
  lastUpdated: number;
  lastSynced: number;
  metadata?: Record<string, any>; // Additional runtime data
  performance?: WidgetMetrics;
}

export interface WidgetMetrics {
  renderCount: number;
  actionExecutions: number;
  eventReceived: number;
  errors: number;
  averageRenderTime: number;
  averageActionTime: number;
  memoryUsage: number;
  lastUpdated: number;
}

export interface ObsConnectionState {
  isConnected: boolean;
  connectionState: string; // 'connected', 'disconnected', 'error'
  lastError?: string;
  latency?: number;
}

// Context Interface for Widget Operations
export interface WidgetContext {
  widgetId: string;
  config: UniversalWidgetConfig;
  state: WidgetState;
  obsConnection: ObsConnectionState;
  updateState: (updates: Partial<WidgetState>) => void;
  executeAction: (
    action: ObsActionType | ActionConfig, 
    value?: any, 
    options?: ActionExecutionOptions
  ) => Promise<ActionResult>;
  subscribeToEvents: (events: string[]) => void;
  unsubscribeFromEvents: (events: string[]) => void;
  getMetrics: () => WidgetMetrics;
}

export interface ActionExecutionOptions {
  force?: boolean;
  validateOnly?: boolean;
  retry?: boolean;
  timeout?: number;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: WidgetError;
  retryable?: boolean;
  duration?: number; // ms
}

export class WidgetError extends Error {
  code: string;
  retryable?: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'WidgetError';
    this.code = code;
    this.retryable = retryable;
  }
}

// Performance Monitor Interface
export interface PerformanceMonitor {
  recordRender: (widgetId: string, duration: number) => void;
  recordAction: (widgetId: string, duration: number, success: boolean) => void;
  recordEvent: (widgetId: string, eventType: string) => void;
  recordError: (widgetId: string, error: WidgetError) => void;
  getMetrics: (widgetId: string) => WidgetMetrics;
  getAllMetrics: () => Record<string, WidgetMetrics>;
}

// Retry Configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number; // ms
  backoffMultiplier: number;
  maxDelay: number; // ms
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Widget Group for Dashboard Feature (Phase 4, but type here for completeness)
export interface WidgetGroup {
  id: string;
  name: string;
  description?: string;
  widgetIds: string[];
  layout: {
    type: 'grid' | 'flex' | 'absolute';
    columns?: number;
    rows?: number;
    gap?: number;
    padding?: number;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  isVisible: boolean;
  order: number;
}

export interface AudioConfig {
  channels?: string[]; // e.g., ['1', '2'] for multi-channel
  mute?: boolean;
  balance?: boolean;
  sync?: boolean; // Sync across channels
  meterType?: 'peak' | 'rms' | 'vu';
}

export interface SceneConfig {
  preview?: boolean; // Show scene previews
  templates?: string[]; // Pre-defined scene templates
  autoSwitch?: boolean; // Auto-switch on conditions
}

export interface SourceConfig {
  settings?: Record<string, any>; // Dynamic source properties
  autoLoad?: boolean; // Auto-load settings
}

export interface TransformConfig {
  position?: { x: number; y: number };
  scale?: { x: number; y: number };
  rotation?: number;
  crop?: { left: number; right: number; top: number; bottom: number };
  bounds?: { width: number; height: number };
}

export interface VisibilityConfig {
  animation?: {
    duration: number;
    easing: string; // GSAP easing
    type?: 'fade' | 'slide' | 'scale';
  };
  autoHide?: boolean;
  conditions?: string[]; // Visibility conditions
}

export interface FilterConfig {
  addableFilters?: string[]; // Available filter types
  params?: Record<string, any>; // Filter parameters
  managerType?: 'simple' | 'advanced';
}

// Extend ValueMappingConfig for multi-channel support
export interface MultiChannelValueMappingConfig extends ValueMappingConfig {
  multiChannel?: boolean;
  channelMapping?: Record<string, ValueMappingConfig>; // Per-channel mappings
}

// Export all types for use in other modules
export type {
  WidgetControlType,
  TargetType,
  UniversalWidgetConfig,
  ValueMappingConfig,
  VisualWidgetConfig,
  ReactionConfig,
  ActionConfig,
  ConditionalAction,
  WidgetState,
  WidgetMetrics,
  ObsConnectionState,
  WidgetContext,
  ActionExecutionOptions,
  ActionResult,
  WidgetError,
  PerformanceMonitor,
  RetryConfig,
  ValidationResult,
  WidgetGroup,
  AudioConfig,
  SceneConfig,
  SourceConfig,
  TransformConfig,
  VisibilityConfig,
  FilterConfig,
  MultiChannelValueMappingConfig
};