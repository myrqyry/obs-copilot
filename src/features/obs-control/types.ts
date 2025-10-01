/**
 * Core type definitions for the Universal Widget System
 */

 // Base error type for widget operations
export interface WidgetError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
}

export class WidgetError extends Error {
  constructor(
    message: string,
    public code: string = 'WIDGET_ERROR',
    public recoverable: boolean = false,
    public details?: Record<string, any>,
    public timestamp: number = Date.now(),
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'WidgetError';
  }
}

// Action execution result
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: WidgetError | string;
  retryable?: boolean;
}

// Action execution context
export interface ActionExecutionContext {
  widgetId: string;
  action?: string;
  actionType?: string;
  parameters?: Record<string, any>;
  value?: any;
  timestamp: number;
  retryCount: number;
}

// Validation result for actions
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Action handler interfaces
export type ActionHandlerFunc<T = any> = (
  context: ActionExecutionContext,
  params?: Record<string, any>
) => Promise<ActionResult<T>>;

/**
 * ActionHandler may be provided either as:
 *  - a plain function (ActionHandlerFunc), or
 *  - an object with an optional `validate` helper and `execute` function.
 *
 * This union keeps compatibility with existing code that registers both shapes.
 */
export type ActionHandler<T = any> =
  | ActionHandlerFunc<T>
  | {
      validate?: (params?: Record<string, any>) => ValidationResult | Promise<ValidationResult>;
      execute: ActionHandlerFunc<T>;
    };

// Widget configuration
export interface UniversalWidgetConfig {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  icon?: string;
  actions?: WidgetAction[];
  // legacy alias
  events?: string[];
  eventSubscriptions?: string[];
  defaultState?: Partial<WidgetState>;
  validation?: WidgetValidation;
  performance?: PerformanceConfig;
  ui?: UIConfig;
  // Engine-specific fields
  controlType?: WidgetControlType | string;
  actionType?: string;
  targetType?: string;
  targetName?: string;
  valueMapping?: ValueMappingConfig;
  controlProps?: SliderProps;
  reactionConfig?: ReactionConfig;
  // AI configuration for Gemini-assisted setup
  aiConfig?: {
    prompt?: string;
    generated?: boolean;
    suggestions?: string[];
  };
}

// Widget control types
export type WidgetControlType =
  | 'button'
  | 'switch'
  | 'knob'
  | 'slider'
  | 'picker'
  | 'status'
  | 'text'
  | 'color'
  | 'file'
  | 'list'
  | 'grid'
  | 'chart'
  | 'custom';

// Widget types (alias)
export type WidgetType = WidgetControlType;

// Widget action definition
export interface WidgetAction {
  id: string;
  name: string;
  description?: string;
  method?: string; // OBS WebSocket method
  actionType?: string;
  parameters?: Record<string, any>;
  params?: Record<string, any>; // legacy
  validation?: ActionValidation;
  retryConfig?: RetryConfig;
  requiresConnection?: boolean;
}

// Lightweight ActionConfig used by engine and for action sequences
export interface ActionConfig {
  actionType: string;
  parameters?: Record<string, any>;
  delay?: number;
  sequence?: ActionConfig[];
  condition?: string;
  fallback?: ActionConfig;
}

// Value mapping config
export interface ValueMappingConfig {
  min?: number;
  max?: number;
  step?: number;
  scale?: 'linear' | 'logarithmic' | 'exponential';
  invert?: boolean;
  customMapping?: Record<string, any>;
  defaultValue?: any;
  unit?: string;
  precision?: number;
}

export interface SliderProps extends ValueMappingConfig {}

// Reaction config for event-driven behavior
export interface ReactionConfig {
  onObsEvent?: (eventType: string, data: any) => void;
  onValueChange?: (oldValue: any, newValue: any) => void;
  debounceMs?: number;
  throttleMs?: number;
}

// Widget state
export interface WidgetState<T = any> {
  id: string;
  type?: WidgetType;
  name?: string;
  enabled?: boolean;
  visible?: boolean;
  value?: T;
  metadata?: Record<string, any>;
  lastUpdated: number;
  error?: WidgetError | string;
  // engine-friendly flags
  isActive?: boolean;
  isLoading?: boolean;
  loading?: boolean; // legacy
}

// OBS connection state for widget context
export interface ObsConnectionState {
  isConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | string;
  lastError?: WidgetError;
}

// Widget context for execution
export interface WidgetContext {
  widgetId?: string;
  config: UniversalWidgetConfig;
  state: WidgetState;
  obsConnection?: ObsConnectionState;
  updateState: (updates: Partial<WidgetState>) => void;
  executeAction: (action: string | WidgetAction | ActionConfig, value?: any, options?: ActionExecutionOptions) => Promise<ActionResult>;
  subscribeToEvents: (events: string[]) => void;
  unsubscribeFromEvents: (events: string[]) => void;
}

// Widget validation
export interface WidgetValidation {
  requiredFields?: string[];
  valueRanges?: Record<string, { min?: number; max?: number }>;
  dependencies?: string[];
  customValidators?: string[];
}

// Action validation
export interface ActionValidation {
  requiredParams?: string[];
  paramTypes?: Record<string, string>;
  valueRanges?: Record<string, { min?: number; max?: number }>;
  customValidators?: string[];
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

// Performance configuration
export interface PerformanceConfig {
  throttleMs?: number;
  debounceMs?: number;
  cacheTtl?: number;
  batchSize?: number;
}

// UI configuration
export interface UIConfig {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
  showIcon?: boolean;
  customStyles?: Record<string, any>;
}

// Event subscription
export interface EventSubscription {
  id: string;
  widgetId: string;
  events: string[];
  callback: (event: string, data: any) => void;
  active: boolean;
}

// Widget metrics (engine)
export interface WidgetMetrics {
  widgetId: string;
  renderCount: number;
  actionExecutions: number;
  eventReceived: number;
  errors: number;
  averageRenderTime: number;
  averageActionTime: number;
  memoryUsage: number;
  lastUpdated: number;
}

// Performance metrics (legacy alias)
export type PerformanceMetrics = WidgetMetrics;

// Widget registration
export interface WidgetRegistration {
  id: string;
  config: UniversalWidgetConfig;
  context: WidgetContext;
  subscriptions: EventSubscription[];
  metrics: WidgetMetrics;
  createdAt: number;
  lastActivity: number;
}

// Engine configuration
export interface EngineConfig {
  maxWidgets: number;
  defaultRetryConfig: RetryConfig;
  performanceMonitoring: boolean;
  eventBatching: boolean;
  cacheEnabled: boolean;
  connectionRequired: boolean;
}

// Action handler map
export type ActionHandlerMap = {
  [actionId: string]: ActionHandler | ActionHandlerFunc;
};

// Event handler map
export interface EventHandlerMap {
  [eventName: string]: string[]; // widget IDs that subscribe to this event
}

// State update options
export interface StateUpdateOptions {
  silent?: boolean; // Don't trigger event callbacks
  validate?: boolean; // Run validation before update
  throttle?: boolean; // Apply throttling
  cache?: boolean; // Cache the update
}

// Error classification
export interface ErrorClassification {
  error: WidgetError;
  retryable: boolean;
  recoverable: boolean;
  requiresUserAction: boolean;
}

// Connection state
export interface ConnectionState {
  connected: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  lastError?: WidgetError;
  reconnectAttempts: number;
}

// Widget factory
export interface WidgetFactory {
  createWidget(config: UniversalWidgetConfig): WidgetContext;
  destroyWidget(widgetId: string): void;
  getWidget(widgetId: string): WidgetContext | undefined;
  getAllWidgets(): WidgetContext[];
}

// Action execution options
export interface ActionExecutionOptions {
  validate?: boolean;
  retry?: boolean;
  cache?: boolean;
  silent?: boolean;
  timeout?: number;
}

// Event callback
export type EventCallback = (event: string, data: any, widgetId: string) => void;

// State change callback
export type StateChangeCallback = (widgetId: string, newState: WidgetState, oldState: WidgetState) => void;

// Error callback
export type ErrorCallback = (widgetId: string, error: WidgetError, context: ActionExecutionContext) => void;

// Performance callback
export type PerformanceCallback = (widgetId: string, metrics: WidgetMetrics) => void;

// Widget lifecycle callbacks
export interface WidgetLifecycleCallbacks {
  onCreate?: (widgetId: string, config: UniversalWidgetConfig) => void;
  onDestroy?: (widgetId: string) => void;
  onStateChange?: StateChangeCallback;
  onActionExecute?: (widgetId: string, action: string, result: ActionResult) => void;
  onError?: ErrorCallback;
  onPerformanceUpdate?: PerformanceCallback;
}