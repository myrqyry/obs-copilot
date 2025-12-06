// src/components/asset-search/EnhancedSearchFilters.tsx
import React from 'react';
import { SearchFilters, AssetCategory } from '@/shared/types/assetSearch';

interface EnhancedSearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (key: string, value: any) => void;
  supportedFilters: string[];
  category: AssetCategory;
}

export const EnhancedSearchFilters: React.FC<EnhancedSearchFiltersProps> = ({
  filters,
  onFilterChange,
  supportedFilters,
  category,
}) => {
  const renderFilter = (filterType: string) => {
    switch (filterType) {
      case 'orientation':
        return (
          <div key="orientation">
            <label className="text-xs font-medium text-muted-foreground">Orientation</label>
            <select
              value={filters.orientation || 'all'}
              onChange={(e) => onFilterChange('orientation', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="all">All</option>
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
              <option value="squarish">Square</option>
            </select>
          </div>
        );

      case 'color':
        return (
          <div key="color">
            <label className="text-xs font-medium text-muted-foreground">Color</label>
            <select
              value={filters.color || 'any'}
              onChange={(e) => onFilterChange('color', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="any">Any</option>
              <option value="black_and_white">Black & White</option>
              <option value="#000000">Black</option>
              <option value="#ffffff">White</option>
              <option value="#ffff00">Yellow</option>
              <option value="#ffa500">Orange</option>
              <option value="#ff0000">Red</option>
              <option value="#800080">Purple</option>
              <option value="#ff00ff">Magenta</option>
              <option value="#00ff00">Green</option>
              <option value="#008080">Teal</option>
              <option value="#0000ff">Blue</option>
            </select>
          </div>
        );

      case 'category':
        return (
          <div key="category">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <input
              type="text"
              value={filters.category || ''}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
              placeholder="e.g., nature, technology"
            />
          </div>
        );

      case 'rating':
        return (
          <div key="rating">
            <label className="text-xs font-medium text-muted-foreground">Content Rating</label>
            <select
              value={filters.rating || 'g'}
              onChange={(e) => onFilterChange('rating', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="g">G - General</option>
              <option value="pg">PG - Parental Guidance</option>
              <option value="pg-13">PG-13 - Parents Cautioned</option>
              <option value="r">R - Restricted</option>
            </select>
          </div>
        );

      case 'type':
        return (
          <div key="type">
            <label className="text-xs font-medium text-muted-foreground">Content Type</label>
            <select
              value={filters.type || 'gifs'}
              onChange={(e) => onFilterChange('type', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="gifs">GIFs</option>
              <option value="stickers">Stickers</option>
              <option value="text">Text</option>
            </select>
          </div>
        );

      case 'bundle':
        return (
          <div key="bundle">
            <label className="text-xs font-medium text-muted-foreground">Rendition Bundle</label>
            <select
              value={filters.bundle || 'messaging_non_clips'}
              onChange={(e) => onFilterChange('bundle', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="messaging_non_clips">Messaging</option>
              <option value="clips_grid_non_clips">Grid</option>
            </select>
          </div>
        );

      case 'lang':
        return (
          <div key="lang">
            <label className="text-xs font-medium text-muted-foreground">Language</label>
            <input
              type="text"
              value={filters.lang || 'en'}
              onChange={(e) => onFilterChange('lang', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
              placeholder="en (ISO 639-1)"
              maxLength={5}
              pattern="^[a-z]{2}(-[A-Z]{2})?$"
            />
          </div>
        );

      case 'style':
        return (
          <div key="style">
            <label className="text-xs font-medium text-muted-foreground">Icon Style</label>
            <select
              value={filters.style || 'filled'}
              onChange={(e) => onFilterChange('style', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="filled">Filled</option>
              <option value="outlined">Outlined</option>
              <option value="sharp">Sharp</option>
              <option value="round">Round</option>
              <option value="two-tone">Two Tone</option>
            </select>
          </div>
        );

      case 'size':
        return (
          <div key="size">
            <label className="text-xs font-medium text-muted-foreground">Icon Size</label>
            <select
              value={filters.size || 'medium'}
              onChange={(e) => onFilterChange('size', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="small">Small (16-32px)</option>
              <option value="medium">Medium (48-64px)</option>
              <option value="large">Large (128px+)</option>
            </select>
          </div>
        );

      case 'limit':
        return (
          <div key="limit">
            <label className="text-xs font-medium text-muted-foreground">Results Limit</label>
            <select
              value={filters.limit || 12}
              onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value={6}>6 results</option>
              <option value={12}>12 results</option>
              <option value={24}>24 results</option>
              <option value={48}>48 results</option>
            </select>
          </div>
        );

      case 'random_id':
        return (
          <div key="random_id">
            <label className="text-xs font-medium text-muted-foreground">Random ID</label>
            <input
              type="text"
              value={filters.random_id || ''}
              onChange={(e) => onFilterChange('random_id', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
              placeholder="User-specific ID"
            />
          </div>
        );

      case 'country_code':
        return (
          <div key="country_code">
            <label className="text-xs font-medium text-muted-foreground">Country Code</label>
            <input
              type="text"
              value={filters.country_code || ''}
              onChange={(e) => onFilterChange('country_code', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
              placeholder="e.g., US (ISO 3166-1)"
              maxLength={2}
            />
          </div>
        );

      case 'region':
        return (
          <div key="region">
            <label className="text-xs font-medium text-muted-foreground">Region</label>
            <input
              type="text"
              value={filters.region || ''}
              onChange={(e) => onFilterChange('region', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
              placeholder="e.g., VA (ISO 3166-2)"
              maxLength={2}
            />
          </div>
        );

      case 'remove_low_contrast':
        return (
          <div key="remove_low_contrast" className="flex items-center mt-4">
            <input
              type="checkbox"
              id="remove_low_contrast"
              checked={!!filters.remove_low_contrast}
              onChange={(e) => onFilterChange('remove_low_contrast', e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="remove_low_contrast" className="ml-2 text-xs font-medium text-muted-foreground">
              Exclude Low Contrast
            </label>
          </div>
        );

      case 'premium':
        return (
          <div key="premium">
            <label className="text-xs font-medium text-muted-foreground">Premium</label>
            <select
              value={filters.premium || 'all'}
              onChange={(e) => onFilterChange('premium', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="all">All</option>
              <option value="premium">Premium</option>
              <option value="free">Free</option>
            </select>
          </div>
        );

      case 'vector':
        return (
          <div key="vector" className="flex items-center mt-4">
            <input
              type="checkbox"
              id="vector"
              checked={!!filters.vector}
              onChange={(e) => onFilterChange('vector', e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="vector" className="ml-2 text-xs font-medium text-muted-foreground">
              Vector
            </label>
          </div>
        );

      case 'license':
        return (
          <div key="license">
            <label className="text-xs font-medium text-muted-foreground">License</label>
            <select
              value={filters.license || 'any'}
              onChange={(e) => onFilterChange('license', e.target.value)}
              className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            >
              <option value="any">Any</option>
              <option value="commercial">Commercial</option>
              <option value="commercial-non-resell">Commercial (no resell)</option>
              <option value="free">Free</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  if (supportedFilters.length === 0) {
    return null;
  }

  return (
    <div className="p-3 bg-card border border-border rounded-md mt-2 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {supportedFilters.map(renderFilter)}
      </div>
      
      {/* Category-specific help text */}
      <div className="text-xs text-muted-foreground">
        {category === 'gifs' && (
          <p>💡 Tip: Use specific terms like "happy cat" or "celebration dance" for better GIF results.</p>
        )}
        {category === 'icons' && (
          <p>💡 Tip: Search for concepts like "home", "user", or "settings" to find relevant icons.</p>
        )}
        {category === 'backgrounds' && (
          <p>💡 Tip: Try terms like "nature", "abstract", or "minimal" for background images.</p>
        )}
        {category === 'emojis' && (
          <p>💡 Tip: Search by emotion, object, or activity to find the perfect emoji.</p>
        )}
      </div>
    </div>
  );
};

export default EnhancedSearchFilters;
