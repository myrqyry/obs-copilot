import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface AudioFilterWidgetProps {
  config: UniversalWidgetConfig & { filterType: string; params?: Record<string, unknown> };
  id: string;
  className?: string;
}

const AudioFilterWidget: React.FC<AudioFilterWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [filters, setFilters] = useState<Record<string, unknown>[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [filterParams, setFilterParams] = useState<Record<string, unknown>>({});
  const sourceName = config.targetName || '';

  // Fetch initial filters
  useEffect(() => {
    const fetchFilters = async () => {
      if (!obsClient.isConnected()) return;

      try {
        const settingsResponse = await obsClient.call('GetInputSettings', { inputName: sourceName });
        const audioFilters = settingsResponse.inputSettings.filters || [];
        setFilters(audioFilters);
        updateWidgetState(id, { value: audioFilters });
      } catch (error) {
        console.error('Failed to fetch filters:', error);
        updateWidgetState(id, { error: 'Failed to fetch filters' });
      }
    };

    fetchFilters();
  }, [sourceName, id]);

  // Add new filter
  const addFilter = useCallback(async (filterType: string) => {
    if (!obsClient.isConnected()) return;

    try {
      const newFilter = { type: filterType, settings: {} };
      const settings = {
        filters: [...filters, newFilter]
      };
      await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: settings });
      setFilters([...filters, newFilter]);
      setSelectedFilter(filterType);
      setFilterParams({});
      updateWidgetState(id, { value: [...filters, newFilter] });
    } catch (error) {
      console.error('Failed to add filter:', error);
      updateWidgetState(id, { error: 'Failed to add filter' });
    }
  }, [filters, sourceName, id]);

  // Update filter params
  const updateFilterParams = useCallback(async (params: Record<string, unknown>) => {
    if (!obsClient.isConnected() || !selectedFilter) return;

    try {
      const newFilters = filters.map(f => {
        if (f.type === selectedFilter) {
          return { ...f, settings: params };
        }
        return f;
      });
      const settings = { filters: newFilters };
      await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: settings });
      setFilters(newFilters);
      setFilterParams(params);
      updateWidgetState(id, { value: newFilters });
    } catch (error) {
      console.error('Failed to update filter params:', error);
      updateWidgetState(id, { error: 'Failed to update filter params' });
    }
  }, [selectedFilter, filters, sourceName, id]);

  // Remove filter
  const removeFilter = useCallback(async (filterType: string) => {
    if (!obsClient.isConnected()) return;

    try {
      const newFilters = filters.filter(f => f.type !== filterType);
      const settings = { filters: newFilters };
      await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: settings });
      setFilters(newFilters);
      setSelectedFilter('');
      setFilterParams({});
      updateWidgetState(id, { value: newFilters });
    } catch (error) {
      console.error('Failed to remove filter:', error);
      updateWidgetState(id, { error: 'Failed to remove filter' });
    }
  }, [filters, sourceName, id]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Audio Filter: {sourceName}</h3>
      <div className="mb-4">
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded mb-2"
        >
          <option value="">Select Filter</option>
          {filters.map((filter, index) => (
            <option key={index} value={String(filter.type || '')}>
              {String(filter.type || 'Unknown Filter')}
            </option>
          ))}
        </select>
        {selectedFilter && (
          <div className="space-y-2">
            {Object.entries(filterParams).map(([key, value]) => (
              <input
                key={key}
                type="number"
                placeholder={key}
                value={String(value || '')}
                onChange={(e) => setFilterParams({ ...filterParams, [key]: Number(e.target.value) })}
                className="w-full p-1 bg-gray-700 text-white rounded"
              />
            ))}
            <button
              onClick={() => updateFilterParams(filterParams)}
              className="w-full p-2 bg-blue-500 text-white rounded"
            >
              Update Params
            </button>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <button
          onClick={() => addFilter('noise_suppression')}
          className="w-full p-2 bg-green-500 text-white rounded"
        >
          Add Noise Suppression
        </button>
        <button
          onClick={() => addFilter('gain')}
          className="w-full p-2 bg-green-500 text-white rounded"
        >
          Add Gain
        </button>
        <button
          onClick={() => addFilter('compressor')}
          className="w-full p-2 bg-green-500 text-white rounded"
        >
          Add Compressor
        </button>
        {selectedFilter && (
          <button
            onClick={() => removeFilter(selectedFilter)}
            className="w-full p-2 bg-red-500 text-white rounded"
          >
            Remove Filter
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioFilterWidget;