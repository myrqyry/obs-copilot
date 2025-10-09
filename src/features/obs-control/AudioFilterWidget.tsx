import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
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
    <div className="p-4 bg-card rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-foreground text-lg font-bold mb-2">Audio Filter: {sourceName}</h3>
      <div className="mb-4">
        <Select
          value={selectedFilter}
          onValueChange={setSelectedFilter}
        >
          <SelectTrigger className="w-full mb-2">
            <SelectValue placeholder="Select Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Select Filter</SelectItem>
            {filters.map((filter, index) => (
              <SelectItem key={index} value={String(filter.type || '')}>
                {String(filter.type || 'Unknown Filter')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedFilter && (
          <div className="space-y-2">
            {Object.entries(filterParams).map(([key, value]) => (
              <Input
                key={key}
                type="number"
                placeholder={key}
                value={String(value || '')}
                onChange={(e) => setFilterParams({ ...filterParams, [key]: Number(e.target.value) })}
              />
            ))}
            <Button
              onClick={() => updateFilterParams(filterParams)}
              className="w-full"
            >
              Update Params
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <Button
          onClick={() => addFilter('noise_suppression')}
          className="w-full"
          variant="success"
        >
          Add Noise Suppression
        </Button>
        <Button
          onClick={() => addFilter('gain')}
          className="w-full"
          variant="success"
        >
          Add Gain
        </Button>
        <Button
          onClick={() => addFilter('compressor')}
          className="w-full"
          variant="success"
        >
          Add Compressor
        </Button>
        {selectedFilter && (
          <Button
            onClick={() => removeFilter(selectedFilter)}
            className="w-full"
            variant="destructive"
          >
            Remove Filter
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioFilterWidget;