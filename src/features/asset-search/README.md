# Enhanced Asset Search System

This directory contains the improved asset search architecture for the OBS Copilot application. The system provides a unified, extensible way to search for and integrate various types of digital assets directly into OBS scenes.

## Architecture Overview

The enhanced asset search system is built around several key components:

### Core Components

1. **EnhancedAssetSearch** - The main reusable search component
2. **EnhancedSearchFilters** - Advanced filtering system
3. **AssetSearchTab** - Complete tab interface with category switching
4. **Type System** - Comprehensive TypeScript definitions
5. **API Mappers** - Standardized data transformation layer
6. **Configuration System** - Centralized API and category management

## Key Features

### 🔍 **Unified Search Interface**
- Consistent search experience across all asset types
- Real-time search with loading states
- Advanced filtering capabilities
- API provider switching

### 🎨 **Multiple Asset Categories**
- **Backgrounds** - High-quality background images (Unsplash, Pexels, Pixabay, Wallhaven)
- **GIFs** - Animated GIFs and stickers (Giphy, Tenor)
- **Icons** - Vector icons and graphics (Iconfinder, Iconify)
- **Emojis** - Unicode emojis and symbols (Emoji API, OpenMoji)
- **Images** - General purpose images (Multiple providers)
- **Stickers** - Stickers and decals (Giphy Stickers)

### 🔧 **OBS Integration**
- Direct browser source creation
- Image source integration
- Automatic source naming
- Connection status awareness

### 🎛️ **Advanced Filtering**
- Content rating controls
- Orientation filters (landscape, portrait, square)
- Color filtering
- Language selection
- Category-specific filters
- API-specific options

### 🔒 **Security & Performance**
- Secure HTML rendering for SVG content
- Error handling and recovery
- Toast notifications
- Clipboard integration
- Responsive design

## File Structure

```
src/
├── components/asset-search/
│   ├── EnhancedAssetSearch.tsx      # Main search component
│   ├── EnhancedSearchFilters.tsx    # Advanced filtering
│   └── index.ts                     # Exports
├── components/ui/
│   └── AssetSearchTab.tsx           # Complete tab interface
├── config/
│   ├── assetSearchConfigs.ts        # API configurations
│   └── enhancedApiMappers.ts        # Data mappers
├── types/
│   └── assetSearch.ts               # Type definitions
└── features/asset-search/
    └── README.md                    # This file
```

## Usage Examples

### Basic Asset Search

```tsx
import { EnhancedAssetSearch } from '@/components/asset-search';
import { ASSET_SEARCH_CONFIGS } from '@/config/assetSearchConfigs';

function MyComponent() {
  return (
    <EnhancedAssetSearch
      title="Backgrounds"
      emoji="🖼️"
      apiConfigs={ASSET_SEARCH_CONFIGS.backgrounds}
      maxResults={12}
      showFilters={true}
    />
  );
}
```

### Custom Actions

```tsx
const customActions = (item: StandardApiItem): AssetModalActions[] => [
  {
    label: 'Custom Action',
    onClick: () => console.log('Custom action for', item.title),
    variant: 'primary',
    icon: '⚡',
  },
];

<EnhancedAssetSearch
  // ... other props
  customActions={customActions}
/>
```

### Custom Renderers

```tsx
const customGridRenderer = (item: StandardApiItem, onClick: () => void) => (
  <div className="custom-grid-item" onClick={onClick}>
    <img src={item.thumbnail} alt={item.title} />
    <span>{item.title}</span>
  </div>
);

<EnhancedAssetSearch
  // ... other props
  customGridRenderer={customGridRenderer}
/>
```

## API Integration

### Adding New APIs

1. **Add API Configuration**
```typescript
// In assetSearchConfigs.ts
export const ASSET_SEARCH_CONFIGS = {
  myCategory: [
    {
      value: 'my-api',
      label: 'My API',
      domain: 'myapi.com',
      category: 'images',
      supportsFilters: ['orientation', 'color'],
      requiresAuth: true,
    },
  ],
};
```

2. **Create API Mapper**
```typescript
// In enhancedApiMappers.ts
export const enhancedApiMappers = {
  'my-api': (item: any): StandardApiItem => ({
    id: item.id,
    title: item.title,
    url: item.imageUrl,
    thumbnail: item.thumbnailUrl,
    source: 'my-api',
    author: item.creator,
    // ... other fields
  }),
};
```

3. **Backend Integration**
Ensure your backend API service supports the new API endpoint at `/api/assets/search/my-api`.

### Supported Filters

The system supports various filter types:

- **orientation**: `all`, `landscape`, `portrait`, `squarish`
- **color**: Various color options
- **rating**: `g`, `pg`, `pg-13`, `r`
- **type**: `gifs`, `stickers`, `text` (for GIF APIs)
- **style**: `filled`, `outlined`, `sharp`, `round`, `two-tone` (for icons)
- **category**: Free-text category filtering
- **lang**: ISO 639-1 language codes
- **limit**: Number of results to return

## Type System

### StandardApiItem

The core interface that all API responses are mapped to:

```typescript
interface StandardApiItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  source: string;
  author: string;
  // Optional enhanced fields
  description?: string;
  tags?: string[];
  dimensions?: { width: number; height: number };
  fileSize?: number;
  format?: string;
  license?: string;
  downloadUrl?: string;
  // Special fields
  svgContent?: string;  // For SVG icons
  character?: string;   // For emojis
  duration?: number;    // For GIFs/videos
  rating?: string;      // Content rating
}
```

### AssetSearchConfig

Configuration for each API provider:

```typescript
interface AssetSearchConfig {
  value: string;              // API identifier
  label: string;              // Display name
  domain: string;             // API domain
  category: AssetCategory;    // Asset category
  supportsFilters?: string[]; // Supported filter types
  requiresAuth?: boolean;     // Requires API key
}
```

## Best Practices

### Performance
- Use `maxResults` to limit API calls
- Implement proper loading states
- Cache results when possible
- Use thumbnail images for grid display

### UX/UI
- Provide clear category descriptions
- Show API requirements (auth needed)
- Use consistent grid layouts
- Implement proper error states

### Security
- Always use SecureHtmlRenderer for SVG content
- Validate API responses
- Handle authentication securely
- Sanitize user inputs

### Accessibility
- Provide alt text for images
- Use semantic HTML
- Support keyboard navigation
- Include ARIA labels

## Migration from Legacy System

If migrating from the old asset search components:

1. **Replace imports**:
   ```typescript
   // Old
   import AssetSearch from '@/features/asset-search/AssetSearch';
   
   // New
   import { EnhancedAssetSearch } from '@/components/asset-search';
   ```

2. **Update props**:
   - `apiMapper` → Use centralized `apiMappers`
   - `renderGridItem` → `customGridRenderer`
   - `renderModalContent` → `customModalRenderer`
   - `getModalActions` → `customActions`

3. **Use new configurations**:
   ```typescript
   // Old
   const apiConfigs = [{ value: 'unsplash', label: 'Unsplash', domain: 'unsplash.com' }];
   
   // New
   import { ASSET_SEARCH_CONFIGS } from '@/config/assetSearchConfigs';
   const apiConfigs = ASSET_SEARCH_CONFIGS.backgrounds;
   ```

## Contributing

When adding new features:

1. Update type definitions in `types/assetSearch.ts`
2. Add API configurations in `config/assetSearchConfigs.ts`
3. Create or update API mappers in `config/enhancedApiMappers.ts`
4. Test with multiple API providers
5. Update this documentation

## Troubleshooting

### Common Issues

1. **API Key Required**: Some APIs require authentication. Check the `requiresAuth` flag in configurations.

2. **No Results**: Verify API endpoints are working and mappers are correctly transforming data.

3. **Type Errors**: Ensure all API mappers return complete `StandardApiItem` objects.

4. **OBS Integration**: Check OBS connection status and scene availability.

### Debug Mode

Enable debug logging by setting:
```typescript
// In your component
console.log('API Results:', results);
console.log('Mapped Results:', mappedResults);
```

## Future Enhancements

- [ ] Pagination support
- [ ] Favorites/bookmarking system
- [ ] Batch operations
- [ ] Advanced search operators
- [ ] Custom API provider support
- [ ] Offline caching
- [ ] Search history
- [ ] Asset preview improvements
