import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface Filter {
  filterName: string;
  filterType: string;
  settings: Record<string, any>;
}

interface FilterManagerWidgetProps extends UniversalWidgetConfig {
  config: { sceneName?: string; sourceName?: string };
  id: string;
  className?: string;
}

const FilterManagerWidget: React.FC<FilterManagerWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const sceneName = config.sceneName || '';
  const sourceName = config.sourceName || '';

  useEffect(() => {
    if (sceneName && sourceName) {
      fetchFilters();
    }
  }, [sceneName, sourceName]);

  const fetchFilters = async () => {
    try {
      const response = await obsClient.call('GetSourceFilterList', { sceneName, sourceName });
      setFilters(response.filters || []);
    } catch (error) {
      console.error('Failed to fetch filters:', error);
      setFilters([]);
    }
  };

  const addFilter = async (filterType: string) => {
    setLoading(true);
    try {
      await obsClient.call('CreateSourceFilter', { sceneName, sourceName, filterName: '', filterKind: filterType });
      fetchFilters(); // Refresh list
      updateWidgetState(id, { value: filters.length + 1 });
    } catch (error) {
      console.error('Failed to add filter:', error);
      updateWidgetState(id, { error: 'Failed to add filter' });
    } finally {
      setLoading(false);
    }
  };

  const removeFilter = async (filterName: string) => {
    setLoading(true);
    try {
      await obsClient.call('RemoveSourceFilter', { sceneName, sourceName, filterName });
      setFilters(filters.filter(f => f.filterName !== filterName));
      updateWidgetState(id, { value: filters.length - 1 });
    } catch (error) {
      console.error('Failed to remove filter:', error);
      updateWidgetState(id, { error: 'Failed to remove filter' });
    } finally {
      setLoading(false);
    }
  };

  const updateFilterSettings = async (filterName: string, settings: Record<string, any>) => {
    setLoading(true);
    try {
      await obsClient.call('SetSourceFilterSettings', { sceneName, sourceName, filterName, filterSettings: settings });
      setFilters(filters.map(f => f.filterName === filterName ? { ...f, settings } : f));
    } catch (error) {
      console.error('Failed to update filter settings:', error);
      updateWidgetState(id, { error: 'Failed to update filter settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Filter Manager</h3>
      <div className="mb-4">
        <select
          value={selectedFilterType}
          onChange={(e) => setSelectedFilterType(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded mb-2"
        >
          <option value="">Select Filter Type</option>
          <option value="crop">Crop</option>
          <option value="color">Color Key</option>
          <option value="sharpen">Sharpen</option>
          <option value="blur">Blur</option>
        </select>
        <button
          onClick={() => addFilter(selectedFilterType)}
          disabled={loading || !selectedFilterType}
          className="w-full p-2 bg-green-500 text-white rounded disabled:bg-gray-500 mb-2"
        >
          {loading ? 'Adding...' : 'Add Filter'}
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filters.map((filter) => (
          <div key={filter.filterName} className="p-2 bg-gray-700 rounded space-y-1">
            <div className="text-white text-sm mb-1">{filter.filterName} ({filter.filterType})</div>
            <button
              onClick={() => removeFilter(filter.filterName)}
              className="w-full p-1 bg-red-500 text-white rounded text-xs"
            >
              Remove
            </button>
            {/* Simple settings editor - expand as needed */}
            <div className="text-xs text-gray-300">Settings: {JSON.stringify(filter.settings)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterManagerWidget;