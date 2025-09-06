
# Universal OBS Widget System Design

## Overview
A comprehensive widget system that allows users to control ANY obs-websocket command using various control types (buttons, switches, knobs, sliders, pickers) with customizable reactions.

## Core Architecture

### 1. Universal Widget Types
```typescript
type WidgetControlType = 
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
```

### 2. Universal Action Mapping
```typescript
interface UniversalWidgetConfig {
  id: string;
  name: string;
  controlType: WidgetControlType;
  actionType: string; // Any OBS action from obsActions.ts
  targetType: 'input' | 'scene' | 'transition' | 'filter' | 'output' | 'media' | 'general';
  targetName?: string; // Specific target (input name, scene name, etc.)
  property?: string; // Specific property to control
  valueMapping?: ValueMappingConfig;
  eventSubscriptions?: string[]; // Events to subscribe for real-time updates
  visualConfig?: VisualWidgetConfig;
  reactionConfig?: ReactionConfig;
}

interface ValueMappingConfig {
  min?: number;
  max?: number;
  step?: number;
  scale?: 'linear' | 'logarithmic' | 'exponential';
  invert?: boolean;
  customMapping?: Record<string, any>;
}

interface ReactionConfig {
  onClick?: ActionConfig[];
  onChange?: ActionConfig[];
  onDoubleClick?: ActionConfig[];
  onLongPress?: ActionConfig[];
  conditions?: ConditionalAction[];
}

interface ActionConfig {
  actionType: string;
  parameters?: Record<string, any>;
  delay?: number;
  sequence?: ActionConfig[]; // For complex action sequences
}
```

### 3. Smart Widget Templates
```typescript
const WIDGET_TEMPLATES = {
  // Audio Controls
  audioMute: {
    name: 'Audio Mute Toggle',
    controlType: 'switch',
    actionType: 'ToggleInputMute',
    targetType: 'input',
    icon: '🔇',
    color: '#ff6b6b'
  },
  audioVolume: {
    name: 'Audio Volume',
    controlType: 'slider',
    actionType: 'SetInputVolume',
    targetType: 'input',
    valueMapping: { min: 0, max: 1, step: 0.01 },
    icon: '🔊',
    color: '#4ecdc4'
  },
  audioBalance: {
    name: 'Audio Balance',
    controlType: 'knob',
    actionType: 'SetInputBalance',
    targetType: 'input',
    valueMapping: { min: -1, max: 1, step: 0.01 },
    icon: '⚖️',
    color: '#45b7d1'
  },
  
  // Scene Controls
  sceneSwitch: {
    name: 'Scene Switch',
    controlType: 'picker',
    actionType: 'SetCurrentProgramScene',
    targetType: 'scene',
    icon: '🎬',
    color: '#96ceb4'
  },
  sceneTransition: {
    name: 'Scene Transition',
    controlType: 'button',
    actionType: 'TriggerStudioModeTransition',
    targetType: 'transition',
    icon: '🔄',
    color: '#feca57'
  },
  
  // Streaming/Recording
  streamStart: {
    name: 'Start Streaming',
    controlType: 'button',
    actionType: 'StartStream',
    targetType: 'output',
    icon: '📡',
    color: '#48dbfb'
  },
  recordStart: {
    name: 'Start Recording',
    controlType: 'button',
    actionType: 'StartRecord',
    targetType: 'output',
    icon: '⏺️',
    color: '#ff9ff3'
  },
  
  // Status Displays
  streamStatus: {
    name: 'Stream Status',
    controlType: 'status',
    actionType: 'GetStreamStatus',
    targetType: 'output',
    eventSubscriptions: ['StreamStateChanged'],
    icon: '📊',
    color: '#54a0ff'
  },
  
  // Media Controls
  mediaPlay: {
    name: 'Media Play/Pause',
    controlType: 'button',
    actionType: 'TriggerMediaInputAction',
    targetType: 'media',
    parameters: { mediaAction: 'OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY' },
    icon: '▶️',
    color: '#5f27cd'
  },
  
  // Advanced Controls
  sourcePosition: {
    name: 'Source Position',
    controlType: 'multi',
    actionType: 'SetInputSettings',
    targetType: 'input',
    property: 'position',
    icon: '📍',
    color: '#00d2d3'
  },
  
  filterToggle: {
    name: 'Filter Toggle',
    controlType: 'switch',
    actionType: 'SetSourceFilterEnabled',
    targetType: 'filter',
    icon: '🔧',
    color: '#ff6348'
  }
};
```

## Implementation Plan

### Phase 1: Core Universal Widget Framework
1. **Universal Widget Engine**
   - Dynamic control type rendering system
   - Action parameter mapping and validation
   - Real-time event subscription management
   - Value conversion and scaling utilities

2. **Enhanced Configuration System**
   - Smart template selection with search
   - Visual widget preview during configuration
   - Advanced parameter mapping interface
   - Reaction/action sequence builder

3. **Control Type Implementations**
   - Button with multiple action modes (click, double-click, long-press)
   - Switch with smooth animations and state feedback
   - Knob with rotary input and value display
   - Slider with range selection and value labels
   - Picker with dynamic option loading
   - Multi-button groups for complex controls

### Phase 2: Advanced Features
1. **Real-time State Synchronization**
   - Automatic event subscription based on widget actions
   - Bidirectional state updates
   - Conflict resolution for multiple widgets controlling same property
   - Performance optimization for high-frequency updates

2. **Smart Widget Intelligence**
   - Auto-discovery of available actions for selected targets
   - Intelligent parameter suggestions based on target type
   - Context-aware value mappings and constraints
   - Dynamic option population for pickers

3. **Advanced Reaction System**
   - Multi-action sequences with delays and conditions
   - Conditional logic based on OBS state
   - External trigger integration (hotkeys, webhooks, etc.)
   - Custom scripting support for complex workflows

### Phase 3: Professional Features
1. **Widget Grouping and Dashboards**
   - Tabbed widget organization
   - Custom dashboard layouts with drag-and-drop
   - Widget linking and master controls
   - Scene-based widget configurations

2. **Visual Customization**
   - Theme system with predefined and custom themes
   - Control styling (colors, sizes, fonts, icons)
   - Animation and transition customization
   - Branding and logo integration

3. **Advanced Monitoring and Analytics**
   - Widget usage statistics
   - Performance monitoring and optimization
   - Error tracking and recovery
   - Usage pattern analysis and suggestions

## Technical Implementation Details

### Widget Rendering System
```typescript
const UniversalWidget: React.FC<UniversalWidgetConfig> = (config) => {
  const { controlType, actionType, targetType, valueMapping, reactionConfig } = config;
  
  // Dynamic control rendering based on type
  const renderControl = () => {
    switch (controlType) {
      case 'button':
        return <UniversalButton {...config} />;
      case 'switch':
        return <UniversalSwitch {...config} />;
      case 'knob':
        return <UniversalKnob {...config} />;
      case 'slider':
        return <UniversalSlider {...config} />;
      case 'picker':
        return <UniversalPicker {...config} />;
      case 'status':
        return <UniversalStatus {...config} />;
      default:
        return null;
    }
  };
  
  return (
    <WidgetContainer config={config}>
      {renderControl()}
    </WidgetContainer>
  );
};
```

### Action Execution System
```typescript
class UniversalActionExecutor {
  async executeAction(config: ActionConfig, value?: any) {
    const { actionType, parameters, sequence } = config;
    
    if (sequence) {
      // Execute action sequence
      for (const action of sequence) {
        await this.executeSingleAction(action, value);
        if (action.delay) {
          await this.delay(action.delay);
        }
      }
    } else {
      await this.executeSingleAction(config, value);
    }
  }
  
  private async executeSingleAction(config: ActionConfig, value?: any) {
    const { actionType, parameters } = config;
    
    // Get the appropriate action handler
    const handler = this.getActionHandler(actionType);
    
    // Map widget value to action parameters
    const actionParams = this.mapValueToParameters(config, value);
    
    // Execute the action
    await handler.execute(actionParams);
    
    // Handle any reactions or follow-up actions
    await this.handleReactions(config, value);
  }
}
```

### Real-time State Management
```typescript
class WidgetStateManager {
  private subscriptions = new Map<string, Set<string>>();
  private stateCache = new Map<string, any>();
  
  subscribeWidget(widgetId: string, events: string[]) {
    events.forEach(event => {
      if (!this.subscriptions.has(event)) {
        this.subscriptions.set(event, new Set());
        this.subscribeToObsEvent(event);
      }
      this.subscriptions.get(event)!.add(widgetId);
    });
  }
  
  private handleObsEvent(event: ObsEvent) {
    const widgetIds = this.subscriptions.get(event.type);
    if (widgetIds) {
      // Update state cache
      this.stateCache.set(event.type, event.data);
      
      // Notify subscribed widgets
      widgetIds.forEach(widgetId => {
        this.notifyWidget(widgetId, event);
      });
    }
  }
}
```

This universal widget system will transform the current limited widget implementation into a comprehensive control center that can handle any OBS websocket command with intuitive, customizable controls. Users will be able to create exactly the controls they need for their specific workflow, whether it's simple buttons for scene switching or complex multi-parameter controls for advanced audio mixing.

Would you like me to proceed with implementing this universal widget system, starting with the core framework and basic control types?