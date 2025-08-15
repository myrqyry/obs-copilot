// src/features/asset-search/SearchFilters.tsx
import React from 'react';

interface SearchFiltersProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  api: string; // To show API-specific filters
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFilterChange, api }) => {
  return (
    <div className="p-3 bg-card border border-border rounded-md mt-2 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Content Type (Giphy specific) */}
        {api === 'giphy' && (
          <div>
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
        )}

        {/* Content Rating Filter */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Rating</label>
          <select
            value={filters.rating || 'g'}
            onChange={(e) => onFilterChange('rating', e.target.value)}
            className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
          >
            <option value="g">G</option>
            <option value="pg">PG</option>
            <option value="pg-13">PG-13</option>
            <option value="r">R</option>
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Language</label>
          <input
            type="text"
            value={filters.lang || 'en'}
            onChange={(e) => onFilterChange('lang', e.target.value)}
            className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1"
            placeholder="en (ISO 639-1)"
          />
        </div>

        {/* Giphy Rendition Bundle Filter */}
        {api === 'giphy' && (
            <div>
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
        )}
      </div>
    </div>
  );
};