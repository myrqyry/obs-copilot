# Plugin Development Guide

## Creating a New Plugin

### 1. Define Plugin Structure
```typescript
// src/plugins/my-plugin/index.tsx
import { PluginDefinition } from '@/plugins/core/PluginManager';

const MyPlugin: PluginDefinition = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'My awesome plugin',
  component: MyPluginComponent,
  dependencies: [], // Optional: other plugin IDs

  async onInit(context) {
    // Initialize resources
    console.log('Plugin initialized with context:', context);
  },

  async onActivate() {
    // Start services
  },

  async onDeactivate() {
    // Pause/cleanup
  },

  async onDestroy() {
    // Complete cleanup
  }
};
```

### 2. Register Plugin
```typescript
// src/plugins/index.ts
import MyPlugin from '@/plugins/my-plugin';

const plugins: PluginDefinition[] = [
  // ... existing plugins
  MyPlugin,
];
```

### 3. Access Plugin Context
```typescript
const MyPluginComponent: React.FC<{ context: PluginContext }> = ({ context }) => {
  // Access OBS client
  const scenes = await context.obs.getScenes();

  // Access Gemini service
  const response = await context.gemini.generateContent('Hello');

  // Emit events
  context.events.emit('my-plugin:action', data);

  // Use storage
  context.storage.setItem('my-key', 'value');
};
```
