/**
 * Core type definitions for the Universal Widget System
 */

// Base error type for widget operations
export class WidgetError extends Error {
  constructor(
    message: string,
    public code: string = 'WIDGET_ERROR',
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'WidgetError';
  }
}

// Action execution result
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: WidgetError;
  retryable?: boolean;
}

// Action execution context
export interface ActionExecutionContext {
  widgetId: string;
  action: string;
  value?: any;
  timestamp: number;
  retryCount: number;
}

// Action handler function signature
export type ActionHandler<T = any> = (
  context: ActionExecutionContext,
  params?: Record<string, any>
) => Promise<ActionResult<T>>;

// Validation result for actions
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Widget configuration
export interface UniversalWidgetConfig {
  id: string;
  type: WidgetType;
  name: string;
  description?: string;
  icon?: string;
  actions: WidgetAction[];
  events?: string[];
  defaultState?: Partial<WidgetState>;
  validation?: WidgetValidation;
  performance?: PerformanceConfig;
  ui?: UIConfig;
}

// Widget types
export type WidgetType = 
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

// Widget action definition
export interface WidgetAction {
  id: string;
  name: string;
  description?: string;
  method: string; // OBS WebSocket method
  params?: Record<string, any>;
  validation?: ActionValidation;
  retryConfig?: RetryConfig;
  requiresConnection?: boolean;
}

// Widget state
export interface WidgetState {
  id: string;
  type: WidgetType;
  name: string;
  enabled: boolean;
  visible: boolean;
  value?: any;
  metadata?: Record<string, any>;
  lastUpdated: number;
  error?: WidgetError;
  loading: boolean;
}

// Widget context for execution
export interface WidgetContext {
  widgetId: string;
  config: UniversalWidgetConfig;
  state: WidgetState;
  updateState: (updates: Partial<WidgetState>) => void;
  executeAction: (action: string, value?: any) => Promise<ActionResult>;
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

// Performance metrics
export interface PerformanceMetrics {
  widgetId: string;
  actionExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
  cacheHits: number;
  cacheMisses: number;
  eventCount: number;
}

// Widget registration
export interface WidgetRegistration {
  id: string;
  config: UniversalWidgetConfig;
  context: WidgetContext;
  subscriptions: EventSubscription[];
  metrics: PerformanceMetrics;
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
export interface ActionHandlerMap {
  [actionId: string]: ActionHandler;
}

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
export type PerformanceCallback = (widgetId: string, metrics: PerformanceMetrics) => void;

// Widget lifecycle callbacks
export interface WidgetLifecycleCallbacks {
  onCreate?: (widgetId: string, config: UniversalWidgetConfig) => void;
  onDestroy?: (widgetId: string) => void;
  onStateChange?: StateChangeCallback;
  onActionExecute?: (widgetId: string, action: string, result: ActionResult) => void;
  onError?: ErrorCallback;
  onPerformanceUpdate?: PerformanceCallback;
}