# Universal OBS Widget System - Core Type Definitions

## Widget Control Types

```typescript
export type WidgetControlType = 
  | 'button'      // Click to execute action
  | 'switch'      // Toggle on/off
  | 'knob'        // Rotary continuous control
  | 'slider'      // Linear continuous control
  | 'picker'      // Dropdown selection
  | 'stepper'     // Increment/decrement buttons
  | 'color'       // Color picker
  | 'text'        // Text input
  | 'multi'       // Multi-button group
  | 'status'      // Read-only status display
  | 'progress'    // Progress bar
  | 'meter'       // Analog meter display
  | 'chart'       // Chart/graph display
```

## Target Types

```typescript
export type TargetType = 
  | 'input'       // Audio/video inputs
  | 'scene'       // Scenes
  | 'transition'  // Transitions
  | 'filter'      // Source filters
  | 'output'      // Streaming/recording outputs
  | 'media'       // Media sources
  | 'general'     // General OBS functions
  | 'source'      // Sources (generic)
  | 'scene_item'  // Scene items
```

## Core Widget Configuration

```typescript
export interface UniversalWidgetConfig {
  id: string;
  name: string;
  controlType: WidgetControlType;
  actionType: string; // Any OBS action from obsActions.ts
  targetType: TargetType;
  targetName?: string; // Specific target (input name, scene name, etc.)
  property?: string; // Specific property to control
  valueMapping?: ValueMappingConfig;
  eventSubscriptions?: string[]; // Events to subscribe for real-time updates
  visualConfig?: VisualWidgetConfig;
  reactionConfig?: ReactionConfig;
  validation?: ValidationConfig;
  performance?: PerformanceConfig;
}

export interface ValueMappingConfig {
  min?: number;
  max?: number;
  step?: number;
  scale?: 'linear' | 'logarithmic' | 'exponential';
  invert?: boolean;
  customMapping?: Record<string, any>;
  defaultValue?: any;
  unit?: string; // dB, %, px, etc.
  precision?: number; // Decimal places
}

export interface VisualWidgetConfig {
  theme?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large' | 'custom';
  icon?: string;
  label?: string;
  showValue?: boolean;
  showLabel?: boolean;
  orientation?: 'horizontal' | 'vertical';
  style?: Record<string, any>;
  animation?: AnimationConfig;
}

export interface AnimationConfig {
  enabled?: boolean;
  duration?: number;
  easing?: string;
  transitions?: Record<string, any>;
}

export interface ReactionConfig {
  onClick?: ActionConfig[];
  onChange?: ActionConfig[];
  onDoubleClick?: ActionConfig[];
  onLongPress?: ActionConfig[];
  onHover?: ActionConfig[];
  conditions?: ConditionalAction[];
  debounce?: number; // ms
  throttle?: number; // ms
}

export interface ActionConfig {
  actionType: string;
  parameters?: Record<string, any>;
  delay?: number;
  sequence?: ActionConfig[]; // For complex action sequences
  condition?: string; // Conditional expression
  fallback?: ActionConfig; // Fallback action if condition fails
}

export interface ConditionalAction {
  condition: string;
  actions: ActionConfig[];
  else?: ConditionalAction[];
}

export interface ValidationConfig {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

export interface PerformanceConfig {
  throttle?: number;
  debounce?: number;
  batchUpdates?: boolean;
  optimizeRender?: boolean;
  cacheResults?: boolean;
}
```

## Widget State Management

```typescript
export interface WidgetState {
  id: string;
  value: any;
  isActive: boolean;
  isLoading: boolean;
  error?: string;
  lastUpdated: number;
  metadata?: Record<string, any>;
}

export interface WidgetContext {
  config: UniversalWidgetConfig;
  state: WidgetState;
  obsConnection: ObsConnectionState;
  updateState: (updates: Partial<WidgetState>) => void;
  executeAction: (action: ActionConfig, value?: any) => Promise<void>;
  subscribeToEvents: (events: string[]) => void;
  unsubscribeFromEvents: (events: string[]) => void;
}
```

## Action Execution System

```typescript
export interface ActionExecutionContext {
  widgetId: string;
  actionType: string;
  parameters: Record<string, any>;
  value?: any;
  timestamp: number;
  retryCount?: number;
}

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface ActionHandler {
  actionType: string;
  execute: (context: ActionExecutionContext) => Promise<ActionResult>;
  validate: (parameters: Record<string, any>) => ValidationResult;
  getRequiredParameters: () => string[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
```

## Event Subscription System

```typescript
export interface EventSubscription {
  id: string;
  widgetId: string;
  eventType: string;
  filter?: EventFilter;
  callback: (event: ObsEvent) => void;
}

export interface EventFilter {
  targetType?: TargetType;
  targetName?: string;
  property?: string;
  condition?: string;
}

export interface ObsEvent {
  type: string;
  data: any;
  timestamp: number;
  source?: string;
}
```

## Widget Template System

```typescript
export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  controlType: WidgetControlType;
  actionType: string;
  targetType: TargetType;
  icon?: string;
  color?: string;
  defaultConfig: Partial<UniversalWidgetConfig>;
  parameters: TemplateParameter[];
  requirements?: TemplateRequirements;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: SelectOption[];
  validation?: ValidationConfig;
}

export interface SelectOption {
  value: any;
  label: string;
  description?: string;
}

export interface TemplateRequirements {
  obsVersion?: string;
  websocketVersion?: string;
  plugins?: string[];
  permissions?: string[];
}
```

## Advanced Features

```typescript
export interface WidgetDashboard {
  id: string;
  name: string;
  widgets: UniversalWidgetConfig[];
  layout: DashboardLayout;
  theme?: string;
  settings?: DashboardSettings;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  gap?: number;
  padding?: number;
  breakpoints?: Record<string, LayoutBreakpoint>;
}

export interface LayoutBreakpoint {
  width: number;
  columns: number;
  widgetSize: 'small' | 'medium' | 'large';
}

export interface DashboardSettings {
  autoSave?: boolean;
  showGrid?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  background?: string;
}
```

## Error Handling

```typescript
export interface WidgetError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable?: boolean;
  retryable?: boolean;
}

export interface ErrorHandler {
  handleError: (error: WidgetError, context: WidgetContext) => void;
  canRecover: (error: WidgetError) => boolean;
  getRecoveryAction: (error: WidgetError) => ActionConfig | null;
}
```

## Performance Monitoring

```typescript
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

export interface PerformanceMonitor {
  recordRender: (widgetId: string, duration: number) => void;
  recordAction: (widgetId: string, duration: number, success: boolean) => void;
  recordEvent: (widgetId: string, eventType: string) => void;
  recordError: (widgetId: string, error: WidgetError) => void;
  getMetrics: (widgetId: string) => WidgetMetrics;
  getAllMetrics: () => Record<string, WidgetMetrics>;
}
```

This comprehensive type system provides the foundation for building a universal widget system that can handle any OBS websocket command with various control types, real-time state synchronization, advanced configuration options, and robust error handling.