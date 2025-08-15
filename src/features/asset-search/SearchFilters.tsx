// src/features/asset-search/SearchFilters.tsx
import React from 'react';

interface SearchFiltersProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="p-2 bg-card border border-border rounded-md mt-2 space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Content Rating Filter */}
        <div>
          <label className="text-xs text-muted-foreground">Rating</label>
          <select
            value={filters.rating || 'g'}
            onChange={(e) => onFilterChange('rating', e.target.value)}
            className="w-full text-xs bg-background border border-border rounded px-2 py-1"
          >
            <option value="g">G</option>
            <option value="pg">PG</option>
            <option value="pg-13">PG-13</option>
            <option value="r">R</option>
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="text-xs text-muted-foreground">Language</label>
          <input
            type="text"
            value={filters.lang || 'en'}
            onChange={(e) => onFilterChange('lang', e.target.value)}
            className="w-full text-xs bg-background border border-border rounded px-2 py-1"
            placeholder="en"
          />
        </div>
        
        {/* Add more filters here as needed! */}
        
      </div>
    </div>
  );
};