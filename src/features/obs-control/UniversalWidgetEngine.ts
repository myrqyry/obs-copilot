import { ObsClientImpl } from '@/shared/services/obsClient';
import { 
  WidgetError, 
  ActionResult, 
  ActionConfig,
  ActionExecutionOptions,
  ObsActionType
} from '@/shared/types/universalWidget';
import { 
  ActionExecutionContext, 
  ActionHandler, 
  ValidationResult,
  WidgetAction
} from './types';
import { actionHandlers } from './ActionHandler';
import type {
  CurrentSceneChangedEvent,
  InputMuteStateChangedEvent,
  InputVolumeChangedEvent,
  StreamOutputStateEvent,
  ScenesChangedEvent,
  ObsEventPayload,
} from '@/shared/types/obsEvents';

// Import additional types from canonical location
import type {
  UniversalWidgetConfig,
  WidgetContext,
  WidgetState,
} from '@/shared/types/universalWidget';
import { EventEmitter } from 'eventemitter3';

const obsClient = ObsClientImpl.getInstance();

/**
 * Universal Widget Engine - Core engine for managing all widget operations
 * Handles action execution, event subscriptions, state synchronization, and performance optimization
 */
export class UniversalWidgetEngine extends EventEmitter {
  private static _instance: UniversalWidgetEngine | null = null;

  /**
   * Get or create the singleton instance of the engine
   */
  public static getInstance(): UniversalWidgetEngine {
    if (!this._instance) {
      this._instance = new UniversalWidgetEngine();
    }
    return this._instance;
  }
  private widgets: Map<string, WidgetContext> = new Map();
  private eventSubscriptions: Map<string, Set<string>> = new Map();
  private actionCache: Map<string, ActionResult> = new Map();
  private performanceMetrics: Map<string, WidgetMetrics> = new Map();

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the widget engine and set up OBS connection listeners
   */
  private async initialize(): Promise<void> {
    try {
      obsClient.on('ConnectionOpened', this.handleConnectionOpened.bind(this));
      obsClient.on('ConnectionClosed', this.handleConnectionClosed.bind(this));
      obsClient.on('ConnectionError', this.handleConnectionError.bind(this));
      
      this.emit('engineInitialized');
      
      console.log('[UniversalWidgetEngine] Initialized successfully');
    } catch (error) {
      console.error('[UniversalWidgetEngine] Initialization failed:', error);
      this.emit('engineError', error);
    }
  }

  /**
   * Register a new widget with the engine
   */
  public async registerWidget(config: UniversalWidgetConfig): Promise<WidgetContext> {
    const widgetId = config.id;
    
    if (this.widgets.has(widgetId)) {
      throw new Error(`Widget with ID ${widgetId} already exists`);
    }

    const initialState: WidgetState = {
      id: widgetId,
      value: this.getDefaultValue(config),
      isActive: true,
      isLoading: false,
      isDirty: false,
      lastUpdated: Date.now(),
      lastSynced: Date.now(),
      metadata: {}
    };

    const context: WidgetContext = {
      widgetId,
      config,
      state: initialState,
      obsConnection: {
        isConnected: obsClient.isConnected(),
        connectionState: obsClient.getConnectionStatus()
      },
      updateState: (updates: Partial<WidgetState>) => this.updateWidgetState(widgetId, updates),
      executeAction: (action: ObsActionType | ActionConfig, value?: any, options?: ActionExecutionOptions) => 
        this.executeWidgetAction(widgetId, action, value, options),
      subscribeToEvents: (events: string[]) => this.subscribeWidgetToEvents(widgetId, events),
      unsubscribeFromEvents: (events: string[]) => this.unsubscribeWidgetFromEvents(widgetId, events),
      getMetrics: () => this.getMetrics(widgetId) || {
        renderCount: 0,
        actionExecutions: 0,
        eventReceived: 0,
        errors: 0,
        averageRenderTime: 0,
        averageActionTime: 0,
        memoryUsage: 0,
        lastUpdated: Date.now()
      }
    };

    this.widgets.set(widgetId, context);
    
    if (config.eventSubscriptions && config.eventSubscriptions.length > 0) {
      await this.subscribeWidgetToEvents(widgetId, config.eventSubscriptions);
    }

    this.initializeMetrics(widgetId);

    this.emit('widgetRegistered', { widgetId, config });
    
    console.log(`[UniversalWidgetEngine] Widget registered: ${widgetId}`);
    
    return context;
  }

  /**
   * Unregister a widget and clean up resources
   */
  public async unregisterWidget(widgetId: string): Promise<void> {
    const context = this.widgets.get(widgetId);
    if (!context) {
      console.warn(`[UniversalWidgetEngine] Widget not found: ${widgetId}`);
      return;
    }

    const subscriptions = this.eventSubscriptions.get(widgetId);
    if (subscriptions) {
      for (const eventType of subscriptions) {
        await this.unsubscribeWidgetFromEvents(widgetId, [eventType]);
      }
    }

    this.widgets.delete(widgetId);
    this.eventSubscriptions.delete(widgetId);
    this.actionCache.delete(widgetId);
    this.performanceMetrics.delete(widgetId);

    this.emit('widgetUnregistered', { widgetId });
    
    console.log(`[UniversalWidgetEngine] Widget unregistered: ${widgetId}`);
  }

  /**
   * Execute an action for a specific widget
   */
  public async executeWidgetAction(
    widgetId: string, 
    action: string | WidgetAction | ActionConfig, 
    value?: any,
    _options?: ActionExecutionOptions
  ): Promise<ActionResult> {
    const startTime = performance.now();
    const context = this.widgets.get(widgetId);
    
    if (!context) {
      throw new WidgetError(`Widget not found: ${widgetId}`, 'WIDGET_NOT_FOUND');
    }

    // Parse action to standardized form
    let actionType: string;
    let parameters: Record<string, any> = {};
    
    if (typeof action === 'string') {
      actionType = action;
    } else if ('actionType' in action) {
      actionType = action.actionType || '';
      parameters = action.parameters || {};
    } else {
      throw new WidgetError('Invalid action format', 'INVALID_ACTION');
    }

    const executionContext: ActionExecutionContext = {
      widgetId,
      actionType,
      parameters,
      value,
      timestamp: Date.now(),
      retryCount: 0
    };

    try {
      this.updateWidgetState(widgetId, { isLoading: true, error: undefined });

      const handler = actionHandlers.getHandler(actionType);
      if (!handler) {
        throw new WidgetError(`No handler found for action type: ${actionType}`, 'NO_HANDLER');
      }

      let result: ActionResult;
      
      // Handle both function and object handler types
      if (typeof handler === 'function') {
        // Direct function call
        result = await handler(executionContext, parameters);
      } else {
        // Object with validate and execute
        if (handler.validate) {
          const validation = await handler.validate(parameters);
          if (!validation.valid) {
            throw new WidgetError(`Validation failed: ${validation.errors?.join(', ')}`, 'VALIDATION_FAILED');
          }
        }
        result = await handler.execute(executionContext, parameters);
      }

      this.updateWidgetState(widgetId, { 
        isLoading: false,
        value: result.data,
        lastUpdated: Date.now()
      });

      this.actionCache.set(this.getActionCacheKey(widgetId, actionType, parameters), result);

      const duration = performance.now() - startTime;
      this.recordActionExecution(widgetId, duration, true);

      this.emit('actionExecuted', { widgetId, action, result, duration });
      
      console.log(`[UniversalWidgetEngine] Action executed successfully: ${actionType} for widget ${widgetId}`);
      
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      const widgetError = new WidgetError(
        error instanceof Error ? error.message : 'Unknown error',
        'ACTION_EXECUTION_ERROR',
        this.isErrorRecoverable(error),
        { action, value },
        Date.now(),
        this.isErrorRetryable(error)
      );

      this.updateWidgetState(widgetId, { 
        isLoading: false, 
        error: widgetError.message 
      });

      this.recordActionExecution(widgetId, duration, false);
      this.recordError(widgetId, widgetError);

      this.emit('actionError', { widgetId, action, error: widgetError, duration });
      
      console.error(`[UniversalWidgetEngine] Action execution failed: ${actionType} for widget ${widgetId}`, error);
      
      throw widgetError;
    }
  }

  /**
   * Execute action with retry logic
   */
  private async executeWithRetry(
    handler: ActionHandler, 
    context: ActionExecutionContext,
    maxRetries = 3
  ): Promise<ActionResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        context.retryCount = attempt;
        
        let result: ActionResult;
        if (typeof handler === 'function') {
          result = await handler(context);
        } else {
          result = await handler.execute(context);
        }
        
        if (result.success) {
          return result;
        }
        
        if (result.error && this.isErrorRetryable(new Error(result.error as string))) {
          lastError = new Error(result.error as string);
          continue;
        }
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isErrorRetryable(error) || attempt === maxRetries) {
          throw error;
        }
        
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error('Max retry attempts reached');
  }

  /**
   * Subscribe widget to OBS events
   */
  public async subscribeWidgetToEvents(widgetId: string, eventTypes: string[]): Promise<void> {
    const context = this.widgets.get(widgetId);
    if (!context) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    let widgetSubscriptions = this.eventSubscriptions.get(widgetId);
    if (!widgetSubscriptions) {
      widgetSubscriptions = new Set();
      this.eventSubscriptions.set(widgetId, widgetSubscriptions);
    }

    for (const eventType of eventTypes) {
      if (widgetSubscriptions.has(eventType)) {
        continue;
      }

      widgetSubscriptions.add(eventType);
      
      const totalSubscriptions = this.getTotalEventSubscriptions(eventType);
      if (totalSubscriptions === 1) {
        await this.setupObsEventListener(eventType);
      }
    }

    this.emit('widgetSubscribed', { widgetId, eventTypes });
    
    console.log(`[UniversalWidgetEngine] Widget ${widgetId} subscribed to events:`, eventTypes);
  }

  /**
   * Unsubscribe widget from OBS events
   */
  public async unsubscribeWidgetFromEvents(widgetId: string, eventTypes: string[]): Promise<void> {
    const widgetSubscriptions = this.eventSubscriptions.get(widgetId);
    if (!widgetSubscriptions) {
      return;
    }

    for (const eventType of eventTypes) {
      widgetSubscriptions.delete(eventType);
      
      const totalSubscriptions = this.getTotalEventSubscriptions(eventType);
      if (totalSubscriptions === 0) {
        await this.removeObsEventListener(eventType);
      }
    }

    if (widgetSubscriptions.size === 0) {
      this.eventSubscriptions.delete(widgetId);
    }

    this.emit('widgetUnsubscribed', { widgetId, eventTypes });
    
    console.log(`[UniversalWidgetEngine] Widget ${widgetId} unsubscribed from events:`, eventTypes);
  }

  /**
   * Handle OBS connection opened
   */
  private handleConnectionOpened(): void {
    console.log('[UniversalWidgetEngine] OBS connection opened');
    
    for (const [widgetId, context] of this.widgets) {
      context.obsConnection = {
        isConnected: true,
        connectionState: 'connected'
      };
      this.updateWidgetState(widgetId, { isActive: true });
    }

    this.reestablishEventSubscriptions();
    
    this.emit('obsConnected');
  }

  /**
   * Handle OBS connection closed
   */
  private handleConnectionClosed(): void {
    console.log('[UniversalWidgetEngine] OBS connection closed');
    
    for (const [widgetId, context] of this.widgets) {
      context.obsConnection = {
        isConnected: false,
        connectionState: 'disconnected'
      };
      this.updateWidgetState(widgetId, { isActive: false });
    }
    
    this.emit('obsDisconnected');
  }

  /**
   * Handle OBS connection error
   */
  private handleConnectionError(error: Error): void {
    console.error('[UniversalWidgetEngine] OBS connection error:', error);
    
    for (const [widgetId, context] of this.widgets) {
      context.obsConnection = {
        isConnected: false,
        connectionState: 'error',
        lastError: error.message
      };
      this.updateWidgetState(widgetId, { isActive: false });
    }
    
    this.emit('obsConnectionError', error);
  }

  /**
   * Handle OBS events and route to subscribed widgets
   */
  private handleObsEvent(eventType: string, eventData: ObsEventPayload): void {
    const startTime = performance.now();
    
    const subscribedWidgets = this.getWidgetsSubscribedToEvent(eventType);
    
    for (const widgetId of subscribedWidgets) {
      const context = this.widgets.get(widgetId);
      if (!context) continue;

      try {
        this.processObsEventForWidget(context, eventType, eventData);
        
        this.recordEventReceived(widgetId, eventType);
        
      } catch (error) {
        console.error(`[UniversalWidgetEngine] Error processing event ${eventType} for widget ${widgetId}:`, error);
        const widgetError = new WidgetError(
          error instanceof Error ? error.message : 'Unknown error',
          'EVENT_PROCESSING_ERROR',
          true,
          { eventType, eventData },
          Date.now(),
          false
        );
        this.recordError(widgetId, widgetError);
      }
    }

    const duration = performance.now() - startTime;
    this.emit('obsEventProcessed', { eventType, widgetCount: subscribedWidgets.length, duration });
    
    console.log(`[UniversalWidgetEngine] Processed OBS event: ${eventType} for ${subscribedWidgets.length} widgets in ${duration}ms`);
  }

  /**
   * Process OBS event for a specific widget
   */
  private processObsEventForWidget(
    context: WidgetContext,
    eventType: string,
    eventData: ObsEventPayload
  ): void {
    const { config } = context;

    if (config.reactionConfig?.onObsEvent) {
      this.executeCustomEventHandler(context, eventType, eventData);
      return;
    }

    switch (eventType) {
      case 'InputMuteStateChanged':
        this.handleInputMuteStateChanged(context, eventData as InputMuteStateChangedEvent);
        break;
        break;
      case 'InputVolumeChanged':
        this.handleInputVolumeChanged(context, eventData as InputVolumeChangedEvent);
        break;
        break;
      case 'CurrentProgramSceneChanged':
        this.handleCurrentProgramSceneChanged(context, eventData as CurrentSceneChangedEvent);
        break;
        break;
      case 'StreamStateChanged':
        this.handleStreamStateChanged(context, eventData as StreamOutputStateEvent);
        break;
        break;
      case 'RecordStateChanged':
        this.handleRecordStateChanged(context, eventData as StreamOutputStateEvent);
        break;
        break;
      default:
        this.handleGenericObsEvent(context, eventType, eventData);
        break;
    }
  }

  /**
   * Update widget state
   */
  private updateWidgetState(widgetId: string, updates: Partial<WidgetState>): void {
    const context = this.widgets.get(widgetId);
    if (!context) return;

    const startTime = performance.now();
    
    const newState = { ...context.state, ...updates };
    context.state = newState;

    const duration = performance.now() - startTime;
    this.recordWidgetUpdate(widgetId, duration);

    this.emit('widgetStateUpdated', { widgetId, state: newState, duration });
    
    console.log(`[UniversalWidgetEngine] Widget ${widgetId} state updated`, updates);
  }

  /**
   * Get default value for widget based on configuration
   */
  private getDefaultValue(config: UniversalWidgetConfig): any {
    if (config.valueMapping?.defaultValue !== undefined) {
      return config.valueMapping.defaultValue;
    }

    switch (config.controlType) {
      case 'button':
      case 'switch':
        return false;
      case 'knob':
      case 'slider':
        return config.valueMapping?.min || 0;
      case 'picker':
        return null;
      case 'text':
        return '';
      case 'color':
        return '#000000';
      default:
        return null;
    }
  }

  /**
   * Get action cache key
   */
  private getActionCacheKey(widgetId: string, actionType: string, parameters: Record<string, any>): string {
    return `${widgetId}:${actionType}:${JSON.stringify(parameters)}`;
  }

  /**
   * Get total event subscriptions across all widgets
   */
  private getTotalEventSubscriptions(eventType: string): number {
    let total = 0;
    for (const subscriptions of this.eventSubscriptions.values()) {
      if (subscriptions.has(eventType)) {
        total++;
      }
    }
    return total;
  }

  /**
   * Get widgets subscribed to a specific event
   */
  private getWidgetsSubscribedToEvent(eventType: string): string[] {
    const widgets: string[] = [];
    for (const [widgetId, subscriptions] of this.eventSubscriptions) {
      if (subscriptions.has(eventType)) {
        widgets.push(widgetId);
      }
    }
    return widgets;
  }

  /**
   * Set up OBS event listener
   */
  private async setupObsEventListener(eventType: string): Promise<void> {
    try {
      console.log(`[UniversalWidgetEngine] Subscribed to OBS event: ${eventType}`);
    } catch (error) {
      console.error(`[UniversalWidgetEngine] Failed to subscribe to OBS event ${eventType}:`, error);
    }
  }

  /**
   * Remove OBS event listener
   */
  private async removeObsEventListener(eventType: string): Promise<void> {
    try {
      console.log(`[UniversalWidgetEngine] Unsubscribed from OBS event: ${eventType}`);
    } catch (error) {
      console.error(`[UniversalWidgetEngine] Failed to unsubscribe from OBS event ${eventType}:`, error);
    }
  }

  /**
   * Re-establish event subscriptions after connection recovery
   */
  private async reestablishEventSubscriptions(): Promise<void> {
    const eventTypes = new Set<string>();
    
    for (const subscriptions of this.eventSubscriptions.values()) {
      for (const eventType of subscriptions) {
        eventTypes.add(eventType);
      }
    }

    for (const eventType of eventTypes) {
      await this.setupObsEventListener(eventType);
    }
    
    console.log(`[UniversalWidgetEngine] Re-established ${eventTypes.size} event subscriptions`);
  }

  /**
   * Initialize performance metrics for a widget
   */
  private initializeMetrics(widgetId: string): void {
    this.performanceMetrics.set(widgetId, {
      widgetId,
      renderCount: 0,
      actionExecutions: 0,
      eventReceived: 0,
      errors: 0,
      averageRenderTime: 0,
      averageActionTime: 0,
      memoryUsage: 0,
      lastUpdated: Date.now()
    });
  }

  /**
   * Record widget render
   */
  public recordRender(widgetId: string, duration: number): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.renderCount++;
      metrics.averageRenderTime = (metrics.averageRenderTime + duration) / 2;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Record action execution
   */
  private recordActionExecution(widgetId: string, duration: number, success: boolean): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.actionExecutions++;
      metrics.averageActionTime = (metrics.averageActionTime + duration) / 2;
      if (!success) metrics.errors++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Record event received
   */
  private recordEventReceived(widgetId: string, _eventType: string): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.eventReceived++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Record error
   */
  private recordError(widgetId: string, _error: WidgetError): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.errors++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Record widget update
   */
  private recordWidgetUpdate(widgetId: string, _duration: number): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Check if error is recoverable
   */
  private isErrorRecoverable(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('connection') || 
             message.includes('timeout') ||
             message.includes('temporary');
    }
    return false;
  }

  /**
   * Check if error is retryable
   */
  private isErrorRetryable(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('connection') || 
             message.includes('timeout') ||
             message.includes('rate limit') ||
             message.includes('busy') ||
             message.includes('temporary');
    }
    return false;
  }

  /**
   * Execute custom event handler
   */
  private executeCustomEventHandler(
    _context: WidgetContext, 
    eventType: string, 
    _eventData: any
  ): void {
    console.log(`[UniversalWidgetEngine] Executing custom event handler for ${eventType}`);
  }

  /**
   * Handle input mute state changed event
   */
  private handleInputMuteStateChanged(context: WidgetContext, eventData: InputMuteStateChangedEvent): void {
    if (context.config.targetType === 'input' && context.config.targetName === eventData.inputName) {
      this.updateWidgetState(context.config.id, { value: eventData.inputMuted });
    }
  }

  /**
   * Handle input volume changed event
   */
  private handleInputVolumeChanged(context: WidgetContext, eventData: InputVolumeChangedEvent): void {
    if (context.config.targetType === 'input' && context.config.targetName === eventData.inputName) {
      this.updateWidgetState(context.config.id, { value: eventData.inputVolumeDb });
    }
  }

  /**
   * Handle current program scene changed event
   */
  private handleCurrentProgramSceneChanged(context: WidgetContext, eventData: CurrentSceneChangedEvent): void {
    if (context.config.targetType === 'scene') {
      this.updateWidgetState(context.config.id, { value: eventData.sceneName });
    }
  }

  /**
   * Handle stream state changed event
   */
  private handleStreamStateChanged(context: WidgetContext, eventData: StreamOutputStateEvent): void {
    if (context.config.targetType === 'output' && String(context.config.actionType).includes('Stream')) {
      this.updateWidgetState(context.config.id, { value: eventData.outputActive });
    }
  }

  /**
   * Handle record state changed event
   */
  private handleRecordStateChanged(context: WidgetContext, eventData: StreamOutputStateEvent): void {
    if (context.config.targetType === 'output' && String(context.config.actionType).includes('Record')) {
      this.updateWidgetState(context.config.id, { value: eventData.outputActive });
    }
  }

  /**
   * Handle generic OBS event
   */
  private handleGenericObsEvent(context: WidgetContext, eventType: string, _eventData: any): void {
    console.log(`[UniversalWidgetEngine] Generic event handling: ${eventType} for widget ${context.config.id}`);
  }

  /**
   * Get performance metrics for a widget
   */
  public getMetrics(widgetId: string): WidgetMetrics | undefined {
    return this.performanceMetrics.get(widgetId);
  }

  /**
   * Get all performance metrics
   */
  public getAllMetrics(): Record<string, WidgetMetrics> {
    const metrics: Record<string, WidgetMetrics> = {};
    for (const [widgetId, metric] of this.performanceMetrics) {
      metrics[widgetId] = metric;
    }
    return metrics;
  }

  /**
   * Get widget context
   */
  public getWidgetContext(widgetId: string): WidgetContext | undefined {
    return this.widgets.get(widgetId);
  }

  /**
   * Get all registered widgets
   */
  public getAllWidgets(): WidgetContext[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Clean up resources
   */
  public async destroy(): Promise<void> {
    console.log('[UniversalWidgetEngine] Destroying engine');
    
    const widgetIds = Array.from(this.widgets.keys());
    for (const widgetId of widgetIds) {
      await this.unregisterWidget(widgetId);
    }

    console.log('[UniversalWidgetEngine] Universal Widget Engine destroyed');

    this.widgets.clear();
    this.eventSubscriptions.clear();
    this.actionCache.clear();
    this.performanceMetrics.clear();
    
    this.removeAllListeners();
    
    console.log('[UniversalWidgetEngine] Engine destroyed');
  }
}

/**
 * Widget metrics interface
 */
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

export const widgetEngine = UniversalWidgetEngine.getInstance();

export default widgetEngine;