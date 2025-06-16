# New Semantic Theming System

This project has been updated with a new semantic theming system that provides better consistency, maintainability, and design system integration.

## What Changed

### 1. Dependencies Added
- `class-variance-authority` - For creating component variants
- `clsx` - For conditional class names
- `lucide-react` - Modern icon library (React 19 compatible with legacy peer deps)
- `tailwind-merge` - For merging Tailwind CSS classes intelligently
- `tailwindcss-animate` - Enhanced animations for Tailwind

### 2. New Configuration Structure

**tailwind.config.js**: Now uses a semantic design system with CSS variables:
- HSL-based color system with semantic naming (primary, secondary, muted, etc.)
- CSS variable integration for dynamic theming
- Built-in animation support
- Design tokens for consistent spacing and typography

**src/index.css**: Completely redesigned with:
- CSS custom properties for all theme colors
- Semantic color variables (--primary, --secondary, --muted, etc.)
- Improved typography with Inter font
- Streamlined scrollbar styling
- Utility classes for common effects (like `.glow`)

### 3. New Utility System

**src/lib/utils.ts**: Provides the `cn()` utility function for intelligent class merging:
```typescript
import { cn } from '../lib/utils';

// Merge classes intelligently, handling conflicts
const className = cn(
  'base-class',
  condition && 'conditional-class',
  'override-class'
);
```

### 4. Component System

**src/components/ui/**: New UI component library with:
- `Button` component with multiple variants and sizes
- `Card` component system (Card, CardHeader, CardContent, etc.)
- Consistent styling using the new design tokens
- Type-safe props with TypeScript

## How to Use

### Using Semantic Colors
Instead of specific color values, use semantic names:
```css
/* Old approach */
bg-ctp-surface0 text-ctp-text

/* New approach */
bg-card text-card-foreground
bg-primary text-primary-foreground
bg-muted text-muted-foreground
```

### Using New Components
```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default" size="lg">
          Primary Action
        </Button>
        <Button variant="secondary" size="sm">
          Secondary Action
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Using the cn() Utility
```tsx
import { cn } from '@/lib/utils';

function DynamicComponent({ isActive, className }) {
  return (
    <div 
      className={cn(
        'base-styles',
        isActive && 'active-styles',
        className // User-provided overrides
      )}
    >
      Content
    </div>
  );
}
```

## Benefits

1. **Consistency**: All components use the same design tokens
2. **Maintainability**: Changes to the theme affect all components automatically
3. **Type Safety**: Full TypeScript support for component props and variants
4. **Performance**: Optimized class merging and conflict resolution
5. **Scalability**: Easy to add new components and variants
6. **Accessibility**: Built-in focus states and semantic color contrast

## Migration Notes

- The old Catppuccin color classes (ctp-*) can still be used alongside the new system
- Gradually migrate components to use semantic colors for better maintainability
- The new `cn()` utility should be used for all new components
- Consider using the new UI components as building blocks for complex interfaces

## Next Steps

1. Gradually migrate existing components to use semantic colors
2. Create additional UI components as needed (Input, Select, Modal, etc.)
3. Implement theme switching functionality using CSS variable updates
4. Add more animation utilities using the new tailwindcss-animate plugin
