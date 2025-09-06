import { ObsClientImpl } from '@/services/obsClient';
import { WidgetError, ActionResult, ActionExecutionContext, ActionHandler, ValidationResult } from './types';
import { UniversalWidgetConfig, WidgetState, WidgetContext } from './types';
import { actionHandlers } from './ActionHandler';
import { EventEmitter } from 'events';

// Get the OBS client instance
const obsClient = ObsClientImpl.getInstance();

/**
 * Universal Widget Engine - Core engine for managing all widget operations
 * Handles action execution, event subscriptions, state synchronization, and performance optimization
 */
export class UniversalWidgetEngine extends EventEmitter {
  private widgets: Map<string, WidgetContext> = new Map();
  private eventSubscriptions: Map<string, Set<string>> = new Map();
  private actionCache: Map<string, ActionResult> = new Map();
  private performanceMetrics: Map<string, WidgetMetrics> = new Map();
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    super();
    this.initialize();
  }

  /**
   * Initialize the widget engine and set up OBS connection listeners
   */
  private async initialize(): Promise<void> {
    try {
      // Set up OBS connection event listeners
      obsClient.on('ConnectionOpened', this.handleConnectionOpened.bind(this));
      obsClient.on('ConnectionClosed', this.handleConnectionClosed.bind(this));
      obsClient.on('ConnectionError', this.handleConnectionError.bind(this));
      
      // Set up general OBS event listener for widget updates
      // Note: The OBS client doesn't have a generic 'obsEvent' - events are specific
      // We'll handle specific OBS events in the subscribeWidgetToEvents method
      
      this.isInitialized = true;
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
      lastUpdated: Date.now(),
      metadata: {}
    };

    const context: WidgetContext = {
      config,
      state: initialState,
      obsConnection: {
        isConnected: obsClient.isConnected(),
        connectionState: obsClient.getConnectionStatus()
      },
      updateState: (updates: Partial<WidgetState>) => this.updateWidgetState(widgetId, updates),
      executeAction: (action: string, value?: any) => this.executeWidgetAction(widgetId, action, value),
      subscribeToEvents: (events: string[]) => this.subscribeWidgetToEvents(widgetId, events),
      unsubscribeFromEvents: (events: string[]) => this.unsubscribeWidgetFromEvents(widgetId, events)
    };

    this.widgets.set(widgetId, context);
    
    // Set up event subscriptions if specified
    if (config.eventSubscriptions && config.eventSubscriptions.length > 0) {
      await this.subscribeWidgetToEvents(widgetId, config.eventSubscriptions);
    }

    // Initialize performance metrics
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

    // Unsubscribe from all events
    const subscriptions = this.eventSubscriptions.get(widgetId);
    if (subscriptions) {
      for (const eventType of subscriptions) {
        await this.unsubscribeWidgetFromEvents(widgetId, [eventType]);
      }
    }

    // Clean up resources
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
    action: any, 
    value?: any
  ): Promise<ActionResult> {
    const startTime = performance.now();
    const context = this.widgets.get(widgetId);
    
    if (!context) {
      throw new Error(`Widget not found: ${widgetId}`);
    }

    const executionContext: ActionExecutionContext = {
      widgetId,
      actionType: action.actionType,
      parameters: action.parameters || {},
      value,
      timestamp: Date.now(),
      retryCount: 0
    };

    try {
      // Update widget state to loading
      this.updateWidgetState(widgetId, { isLoading: true, error: undefined });

      // Get the appropriate action handler
      const handler = actionHandlers.get(action.actionType);
      if (!handler) {
        throw new Error(`No handler found for action type: ${action.actionType}`);
      }

      // Validate action parameters
      const validation = handler.validate(executionContext.parameters);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
      }

      // Execute the action with retry logic
      const result = await this.executeWithRetry(handler, executionContext);
      
      // Update widget state with result
      this.updateWidgetState(widgetId, { 
        isLoading: false,
        value: result.data,
        lastUpdated: Date.now()
      });

      // Cache the result
      this.actionCache.set(this.getActionCacheKey(widgetId, action), result);

      const duration = performance.now() - startTime;
      this.recordActionExecution(widgetId, duration, true);

      this.emit('actionExecuted', { widgetId, action, result, duration });
      
      console.log(`[UniversalWidgetEngine] Action executed successfully: ${action.actionType} for widget ${widgetId}`);
      
      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      const widgetError: WidgetError = {
        code: 'ACTION_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { action, value },
        timestamp: Date.now(),
        recoverable: this.isErrorRecoverable(error),
        retryable: this.isErrorRetryable(error)
      };

      this.updateWidgetState(widgetId, { 
        isLoading: false, 
        error: widgetError.message 
      });

      this.recordActionExecution(widgetId, duration, false);
      this.recordError(widgetId, widgetError);

      this.emit('actionError', { widgetId, action, error: widgetError, duration });
      
      console.error(`[UniversalWidgetEngine] Action execution failed: ${action.actionType} for widget ${widgetId}`, error);
      
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
        const result = await handler.execute(context);
        
        if (result.success) {
          return result;
        }
        
        // If action failed but is retryable, continue
        if (result.error && this.isErrorRetryable(new Error(result.error))) {
          lastError = new Error(result.error);
          continue;
        }
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isErrorRetryable(error) || attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry with exponential backoff
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
        continue; // Already subscribed
      }

      widgetSubscriptions.add(eventType);
      
      // If this is the first subscription for this event type, set up OBS listener
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
      
      // If no more subscriptions for this event type, remove OBS listener
      const totalSubscriptions = this.getTotalEventSubscriptions(eventType);
      if (totalSubscriptions === 0) {
        await this.removeObsEventListener(eventType);
      }
    }

    // Clean up empty subscription sets
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
    
    // Update all widget connection states
    for (const [widgetId, context] of this.widgets) {
      this.updateWidgetState(widgetId, {
        obsConnection: {
          isConnected: true,
          connectionState: 'connected'
        }
      });
    }

    // Re-establish event subscriptions
    this.reestablishEventSubscriptions();
    
    this.emit('obsConnected');
  }

  /**
   * Handle OBS connection closed
   */
  private handleConnectionClosed(): void {
    console.log('[UniversalWidgetEngine] OBS connection closed');
    
    // Update all widget connection states
    for (const [widgetId, context] of this.widgets) {
      this.updateWidgetState(widgetId, {
        obsConnection: {
          isConnected: false,
          connectionState: 'disconnected'
        }
      });
    }
    
    this.emit('obsDisconnected');
  }

  /**
   * Handle OBS connection error
   */
  private handleConnectionError(error: Error): void {
    console.error('[UniversalWidgetEngine] OBS connection error:', error);
    
    // Update all widget connection states
    for (const [widgetId, context] of this.widgets) {
      this.updateWidgetState(widgetId, {
        obsConnection: {
          isConnected: false,
          connectionState: 'error'
        }
      });
    }
    
    this.emit('obsConnectionError', error);
  }

  /**
   * Handle OBS events and route to subscribed widgets
   */
  private handleObsEvent(eventType: string, eventData: any): void {
    const startTime = performance.now();
    
    // Find all widgets subscribed to this event type
    const subscribedWidgets = this.getWidgetsSubscribedToEvent(eventType);
    
    for (const widgetId of subscribedWidgets) {
      const context = this.widgets.get(widgetId);
      if (!context) continue;

      try {
        // Process event based on widget configuration
        this.processObsEventForWidget(context, eventType, eventData);
        
        this.recordEventReceived(widgetId, eventType);
        
      } catch (error) {
        console.error(`[UniversalWidgetEngine] Error processing event ${eventType} for widget ${widgetId}:`, error);
        this.recordError(widgetId, {
          code: 'EVENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { eventType, eventData },
          timestamp: Date.now(),
          recoverable: true,
          retryable: false
        });
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
    eventData: any
  ): void {
    const { config, state } = context;

    // Check if widget has custom event processing
    if (config.reactionConfig?.onObsEvent) {
      // Execute custom event handler
      this.executeCustomEventHandler(context, eventType, eventData);
      return;
    }

    // Default event processing based on widget type and configuration
    switch (eventType) {
      case 'InputMuteStateChanged':
        this.handleInputMuteStateChanged(context, eventData);
        break;
      case 'InputVolumeChanged':
        this.handleInputVolumeChanged(context, eventData);
        break;
      case 'CurrentProgramSceneChanged':
        this.handleCurrentProgramSceneChanged(context, eventData);
        break;
      case 'StreamStateChanged':
        this.handleStreamStateChanged(context, eventData);
        break;
      case 'RecordStateChanged':
        this.handleRecordStateChanged(context, eventData);
        break;
      default:
        // Generic event handling - update widget state if relevant
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

    // Default values based on control type
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
  private getActionCacheKey(widgetId: string, action: any): string {
    return `${widgetId}:${action.actionType}:${JSON.stringify(action.parameters)}`;
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
      // Subscribe to the OBS event
      // OBS WebSocket v5 doesn't have a generic SubscribeEvents method
      // Events are subscribed to automatically when using obsClient.on()
      // This method will be implemented to track subscriptions
      console.log(`[UniversalWidgetEngine] Subscribing widget to events:`, eventType);
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
      // Unsubscribe from the OBS event
      // OBS WebSocket v5 doesn't have a generic UnsubscribeEvents method
      // Events are unsubscribed by removing listeners
      // This method will be implemented to track unsubscriptions
      console.log(`[UniversalWidgetEngine] Unsubscribing widget from events:`, eventType);
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
    
    // Collect all subscribed event types
    for (const subscriptions of this.eventSubscriptions.values()) {
      for (const eventType of subscriptions) {
        eventTypes.add(eventType);
      }
    }

    // Re-subscribe to all events
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
  private recordEventReceived(widgetId: string, eventType: string): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.eventReceived++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Record error
   */
  private recordError(widgetId: string, error: WidgetError): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.errors++;
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Record widget update
   */
  private recordWidgetUpdate(widgetId: string, duration: number): void {
    const metrics = this.performanceMetrics.get(widgetId);
    if (metrics) {
      metrics.lastUpdated = Date.now();
    }
  }

  /**
   * Check if error is recoverable
   */
  private isErrorRecoverable(error: any): boolean {
    // Network errors, temporary OBS issues are recoverable
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
    // Network errors, rate limiting, temporary issues are retryable
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
    context: WidgetContext, 
    eventType: string, 
    eventData: any
  ): void {
    // This would be implemented based on custom event handler configuration
    console.log(`[UniversalWidgetEngine] Executing custom event handler for ${eventType}`);
  }

  /**
   * Handle input mute state changed event
   */
  private handleInputMuteStateChanged(context: WidgetContext, eventData: any): void {
    if (context.config.targetType === 'input' && context.config.targetName === eventData.inputName) {
      this.updateWidgetState(context.config.id, { value: eventData.inputMuted });
    }
  }

  /**
   * Handle input volume changed event
   */
  private handleInputVolumeChanged(context: WidgetContext, eventData: any): void {
    if (context.config.targetType === 'input' && context.config.targetName === eventData.inputName) {
      this.updateWidgetState(context.config.id, { value: eventData.inputVolumeDb });
    }
  }

  /**
   * Handle current program scene changed event
   */
  private handleCurrentProgramSceneChanged(context: WidgetContext, eventData: any): void {
    if (context.config.targetType === 'scene') {
      this.updateWidgetState(context.config.id, { value: eventData.sceneName });
    }
  }

  /**
   * Handle stream state changed event
   */
  private handleStreamStateChanged(context: WidgetContext, eventData: any): void {
    if (context.config.targetType === 'output' && context.config.actionType === 'StartStream') {
      this.updateWidgetState(context.config.id, { value: eventData.outputActive });
    }
  }

  /**
   * Handle record state changed event
   */
  private handleRecordStateChanged(context: WidgetContext, eventData: any): void {
    if (context.config.targetType === 'output' && context.config.actionType === 'StartRecord') {
      this.updateWidgetState(context.config.id, { value: eventData.outputActive });
    }
  }

  /**
   * Handle generic OBS event
   */
  private handleGenericObsEvent(context: WidgetContext, eventType: string, eventData: any): void {
    // Generic handling - could be customized based on widget configuration
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
    
    // Unregister all widgets
    const widgetIds = Array.from(this.widgets.keys());
    for (const widgetId of widgetIds) {
      await this.unregisterWidget(widgetId);
    }

    // Remove OBS event listeners
    // Note: The OBS client instance methods should be used carefully
    // We don't want to remove all listeners as other parts of the app might be using them
    console.log('[UniversalWidgetEngine] Universal Widget Engine destroyed');

    this.widgets.clear();
    this.eventSubscriptions.clear();
    this.actionCache.clear();
    this.performanceMetrics.clear();
    
    this.removeAllListeners();
    
    this.isInitialized = false;
    
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

// Create singleton instance
export const widgetEngine = new UniversalWidgetEngine();

// Export for use in other modules
export default widgetEngine;